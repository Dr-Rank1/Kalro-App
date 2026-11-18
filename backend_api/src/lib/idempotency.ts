import { Collection, Db } from 'mongodb';
import { getDatabase } from './db/mongodb';
import { PayoutLedgerDocument, LedgerStatus } from './types/ledger';
import {
  DarajaB2CCallbackResult,
  ExtractedDarajaCallbackDetails,
} from './types/daraja';

export const COLLECTION_NAME = 'b2c_payouts';

/**
 * Default threshold after which a PENDING lease without a Safaricom callback
 * is considered stuck (due to network drops or missed webhooks) and eligible for recovery.
 * Default: 10 minutes (600,000 ms).
 */
export const DEFAULT_PENDING_LEASE_TIMEOUT_MS = 600_000;

// In-memory fallback ledger for test environments or when MONGODB_URI is absent
const inMemoryLedger = new Map<string, PayoutLedgerDocument>();

let indexesInitialized = false;

export async function getLedgerCollection(): Promise<Collection<PayoutLedgerDocument> | null> {
  const db: Db | null = await getDatabase();
  if (!db) return null;

  const collection = db.collection<PayoutLedgerDocument>(COLLECTION_NAME);

  if (!indexesInitialized) {
    try {
      // 1. Strict Unique Index on offlineId (The Mobile Idempotency Key)
      await collection.createIndex({ offlineId: 1 }, { unique: true, background: false });
      // 2. Strict Unique Index on KALRO Reference
      await collection.createIndex({ reference: 1 }, { unique: true, background: false });
      // 3. Fast lookups for Safaricom async webhook callbacks
      await collection.createIndex({ 'daraja.originatorConversationId': 1 });
      await collection.createIndex({ 'daraja.conversationId': 1 });
      await collection.createIndex({ status: 1 });
      await collection.createIndex({ createdAt: -1 });
      indexesInitialized = true;
    } catch {
      // Index might already exist or running in restricted cluster
    }
  }

  return collection;
}

export interface ReservationResult {
  isNew: boolean;
  doc: PayoutLedgerDocument;
  action: 'PROCEED' | 'SKIP_COMPLETED' | 'SKIP_PENDING' | 'LOCKED_IN_PROGRESS';
}

/**
 * Atomically reserves a payout transaction by its offlineId (idempotency key).
 * Prevents race conditions and double-payment when a farmer or rural mobile device retries
 * over an unstable 2G/3G connection.
 *
 * Handles:
 * 1. Fresh transactions: Atomic insert with unique index enforcement on offlineId.
 * 2. Already completed: Immediate rejection with SKIP_COMPLETED (zero double spend).
 * 3. Concurrent in-flight requests: LOCKED_IN_PROGRESS rejection.
 * 4. Normal pending callbacks: SKIP_PENDING rejection.
 * 5. Stuck PENDING leases: Graceful atomic takeover if upstream timeout occurred before callback.
 * 6. Expired lock or prior failed attempts: Atomic findOneAndUpdate takeover.
 */
export async function reservePayoutIdempotency(params: {
  offlineId: string;
  reference: string;
  farmerName: string;
  phoneNumber: string;
  amountKes: number;
  grade?: string;
  weightKg?: number;
  batchTag?: string;
  farmOrgName?: string;
  operatorName?: string;
  stationSyncCode?: string;
}): Promise<ReservationResult> {
  const collection = await getLedgerCollection();
  const now = new Date();
  const lockUntil = new Date(now.getTime() + 45_000); // 45-second processing lock
  const pendingTimeoutMs =
    Number(process.env.PENDING_LEASE_TIMEOUT_MS) || DEFAULT_PENDING_LEASE_TIMEOUT_MS;
  const stuckPendingThreshold = new Date(now.getTime() - pendingTimeoutMs);

  const newDoc: PayoutLedgerDocument = {
    ...params,
    idempotencyKey: params.offlineId,
    status: 'PROCESSING',
    lockUntil,
    attempts: 1,
    createdAt: now,
    updatedAt: now,
  };

  // 1. In-Memory Fallback Path (Unit Tests / Offline Local Mock)
  if (!collection) {
    let existing = inMemoryLedger.get(params.reference);
    if (!existing) {
      for (const doc of inMemoryLedger.values()) {
        if (doc.offlineId === params.offlineId) {
          existing = doc;
          break;
        }
      }
    }

    if (existing) {
      if (existing.status === 'COMPLETED') {
        return { isNew: false, doc: existing, action: 'SKIP_COMPLETED' };
      }
      if (existing.status === 'PROCESSING' && existing.lockUntil && existing.lockUntil > now) {
        return { isNew: false, doc: existing, action: 'LOCKED_IN_PROGRESS' };
      }

      const isStuckPending =
        existing.status === 'PENDING' &&
        new Date(existing.updatedAt).getTime() <= stuckPendingThreshold.getTime();

      if (existing.status === 'PENDING' && !isStuckPending) {
        return { isNew: false, doc: existing, action: 'SKIP_PENDING' };
      }

      // Lock expired, previously failed, or stuck pending recovered: take over atomically
      existing.status = 'PROCESSING';
      existing.lockUntil = lockUntil;
      existing.updatedAt = now;
      existing.attempts = (existing.attempts || 1) + 1;
      return { isNew: true, doc: existing, action: 'PROCEED' };
    }

    inMemoryLedger.set(params.reference, newDoc);
    return { isNew: true, doc: newDoc, action: 'PROCEED' };
  }

  // 2. Production MongoDB Atlas Path with Atomic Insertion & Duplicate Guard
  try {
    // Attempt atomic insert. The unique index on offlineId guarantees only ONE can ever succeed.
    await collection.insertOne(newDoc as any);
    return { isNew: true, doc: newDoc, action: 'PROCEED' };
  } catch (error: any) {
    // Check for MongoDB Duplicate Key Error (E11000)
    if (error?.code === 11000 || error?.message?.includes('duplicate key')) {
      const existing = await collection.findOne({ offlineId: params.offlineId });
      if (existing) {
        if (existing.status === 'COMPLETED') {
          return { isNew: false, doc: existing, action: 'SKIP_COMPLETED' };
        }
        if (existing.status === 'PROCESSING' && existing.lockUntil && existing.lockUntil > now) {
          return { isNew: false, doc: existing, action: 'LOCKED_IN_PROGRESS' };
        }

        const isStuckPending =
          existing.status === 'PENDING' &&
          new Date(existing.updatedAt).getTime() <= stuckPendingThreshold.getTime();

        if (existing.status === 'PENDING' && !isStuckPending) {
          return { isNew: false, doc: existing, action: 'SKIP_PENDING' };
        }

        // Lock expired, failed prior attempt, or stuck pending lease:
        // Atomically take over lock using findOneAndUpdate with strict conditional filter
        const takeover = await collection.findOneAndUpdate(
          {
            offlineId: params.offlineId,
            $or: [
              { status: 'PROCESSING', lockUntil: { $lte: now } },
              { status: 'FAILED' },
              { status: 'PENDING', updatedAt: { $lte: stuckPendingThreshold } },
            ],
          },
          {
            $set: {
              status: 'PROCESSING',
              lockUntil,
              updatedAt: now,
            },
            $inc: { attempts: 1 },
          },
          { returnDocument: 'after' }
        );

        if (takeover) {
          return { isNew: true, doc: takeover, action: 'PROCEED' };
        }

        // Another concurrent thread or process won the takeover
        const fresh = (await collection.findOne({ offlineId: params.offlineId })) || existing;
        if (fresh.status === 'COMPLETED') {
          return { isNew: false, doc: fresh, action: 'SKIP_COMPLETED' };
        }
        return { isNew: false, doc: fresh, action: 'LOCKED_IN_PROGRESS' };
      }
    }
    throw error;
  }
}

/**
 * Checks if a transaction with the given offlineId already exists.
 */
export async function findPayoutByOfflineId(
  offlineId: string
): Promise<PayoutLedgerDocument | null> {
  const collection = await getLedgerCollection();
  if (!collection) {
    for (const doc of inMemoryLedger.values()) {
      if (doc.offlineId === offlineId) return doc;
    }
    return null;
  }

  return collection.findOne({ offlineId });
}

export async function findPayoutByReference(
  reference: string
): Promise<PayoutLedgerDocument | null> {
  const collection = await getLedgerCollection();
  if (!collection) {
    return inMemoryLedger.get(reference) || null;
  }

  return collection.findOne({ reference });
}

export async function findPayoutByConversationIds(
  originatorConversationId?: string,
  conversationId?: string
): Promise<PayoutLedgerDocument | null> {
  const collection = await getLedgerCollection();

  if (!collection) {
    for (const doc of inMemoryLedger.values()) {
      if (
        (originatorConversationId &&
          doc.daraja?.originatorConversationId === originatorConversationId) ||
        (conversationId && doc.daraja?.conversationId === conversationId)
      ) {
        return doc;
      }
    }
    return null;
  }

  const query: any = { $or: [] };
  if (originatorConversationId) {
    query.$or.push({ 'daraja.originatorConversationId': originatorConversationId });
  }
  if (conversationId) {
    query.$or.push({ 'daraja.conversationId': conversationId });
  }

  if (query.$or.length === 0) return null;

  return collection.findOne(query);
}

/**
 * Records a new pending payout before submitting to Daraja.
 */
export async function recordPendingPayout(
  payout: Omit<PayoutLedgerDocument, 'status' | 'createdAt' | 'updatedAt'>
): Promise<PayoutLedgerDocument> {
  const doc: PayoutLedgerDocument = {
    ...payout,
    status: 'PENDING',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const collection = await getLedgerCollection();
  if (!collection) {
    inMemoryLedger.set(doc.reference, doc);
    return doc;
  }

  await collection.updateOne(
    { reference: doc.reference },
    { $set: doc },
    { upsert: true }
  );
  return doc;
}

/**
 * Updates the payout ledger record with Daraja submission response.
 */
export async function updatePayoutDarajaSubmission(
  reference: string,
  darajaData: {
    conversationId: string;
    originatorConversationId: string;
    responseCode: string;
    responseDescription: string;
  }
): Promise<void> {
  const collection = await getLedgerCollection();
  const now = new Date();

  if (!collection) {
    const doc = inMemoryLedger.get(reference);
    if (doc) {
      doc.status = 'PENDING';
      doc.daraja = {
        ...darajaData,
        submittedAt: now,
      };
      doc.lockUntil = undefined;
      doc.updatedAt = now;
      inMemoryLedger.set(reference, doc);
    }
    return;
  }

  await collection.updateOne(
    { reference },
    {
      $set: {
        status: 'PENDING',
        daraja: {
          ...darajaData,
          submittedAt: now,
        },
        lockUntil: null as any,
        updatedAt: now,
      },
    }
  );
}

/**
 * Marks a payout as FAILED when Daraja rejects the disbursement request synchronously.
 */
export async function markPayoutFailed(
  reference: string,
  errorMessage: string
): Promise<void> {
  const collection = await getLedgerCollection();
  const now = new Date();

  if (!collection) {
    const doc = inMemoryLedger.get(reference);
    if (doc) {
      doc.status = 'FAILED';
      doc.lockUntil = undefined;
      doc.updatedAt = now;
      inMemoryLedger.set(reference, doc);
    }
    return;
  }

  await collection.updateOne(
    { reference },
    {
      $set: {
        status: 'FAILED',
        lockUntil: null as any,
        updatedAt: now,
      },
    }
  );
}

/**
 * Parses Safaricom Daraja callback ResultParameters key-value array.
 */
export function extractDarajaCallbackDetails(
  callback: DarajaB2CCallbackResult
): ExtractedDarajaCallbackDetails {
  const details: ExtractedDarajaCallbackDetails = {
    transactionReceipt: callback.TransactionID || '',
    transactionAmount: 0,
  };

  const params = callback.ResultParameters?.ResultParameter || [];
  for (const p of params) {
    switch (p.Key) {
      case 'TransactionReceipt':
        details.transactionReceipt = String(p.Value || '');
        break;
      case 'TransactionAmount':
        details.transactionAmount = Number(p.Value) || 0;
        break;
      case 'TransactionCompletedDateTime':
        details.transactionCompletedDateTime = String(p.Value || '');
        break;
      case 'ReceiverPartyPublicName':
        details.receiverPartyPublicName = String(p.Value || '');
        break;
      case 'B2CWorkingAccountAvailableFunds':
        details.b2cWorkingAccountAvailableFunds = Number(p.Value) || 0;
        break;
      case 'B2CUtilityAccountAvailableFunds':
        details.b2cUtilityAccountAvailableFunds = Number(p.Value) || 0;
        break;
    }
  }

  return details;
}

/**
 * Updates the MongoDB ledger upon receiving the Safaricom Daraja Webhook Callback.
 */
export async function recordDarajaCallback(
  callbackResult: DarajaB2CCallbackResult
): Promise<PayoutLedgerDocument | null> {
  const { OriginatorConversationID, ConversationID, ResultCode, ResultDesc } =
    callbackResult;

  const details = extractDarajaCallbackDetails(callbackResult);
  const now = new Date();
  const finalStatus: LedgerStatus = ResultCode === 0 ? 'COMPLETED' : 'FAILED';

  const existingDoc = await findPayoutByConversationIds(
    OriginatorConversationID,
    ConversationID
  );

  const collection = await getLedgerCollection();

  const callbackData = {
    receivedAt: now,
    resultCode: ResultCode,
    resultDesc: ResultDesc,
    transactionId: details.transactionReceipt || callbackResult.TransactionID,
    transactionAmount: details.transactionAmount,
    receiverPublicName: details.receiverPartyPublicName,
    completedAt: now,
    b2cUtilityFunds: details.b2cUtilityAccountAvailableFunds,
    b2cWorkingFunds: details.b2cWorkingAccountAvailableFunds,
    rawPayload: callbackResult,
  };

  if (!collection) {
    if (existingDoc) {
      existingDoc.status = finalStatus;
      existingDoc.callback = callbackData;
      existingDoc.lockUntil = undefined;
      existingDoc.updatedAt = now;
      inMemoryLedger.set(existingDoc.reference, existingDoc);
      return existingDoc;
    }
    return null;
  }

  const filter = existingDoc
    ? { reference: existingDoc.reference }
    : {
        $or: [
          { 'daraja.originatorConversationId': OriginatorConversationID },
          { 'daraja.conversationId': ConversationID },
        ],
      };

  const updateResult = await collection.findOneAndUpdate(
    filter,
    {
      $set: {
        status: finalStatus,
        callback: callbackData,
        lockUntil: null as any,
        updatedAt: now,
      },
    },
    { returnDocument: 'after' }
  );

  return updateResult;
}

/**
 * Retrieves recent payouts for inspection/reporting
 */
export async function getRecentPayouts(limit = 50): Promise<PayoutLedgerDocument[]> {
  const collection = await getLedgerCollection();
  if (!collection) {
    return Array.from(inMemoryLedger.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  return collection
    .find()
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray();
}

/**
 * Clears the in-memory ledger (used in unit test teardowns)
 */
export function clearInMemoryLedger(): void {
  inMemoryLedger.clear();
}
