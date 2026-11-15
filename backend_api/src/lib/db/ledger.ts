import { Collection, Db } from 'mongodb';
import { getDatabase } from './mongodb';
import { PayoutLedgerDocument, LedgerStatus } from '../types/ledger';
import {
  DarajaB2CCallbackResult,
  ExtractedDarajaCallbackDetails,
} from '../types/daraja';

const COLLECTION_NAME = 'b2c_payouts';

// In-memory fallback ledger for test environments or when MONGODB_URI is absent
const inMemoryLedger = new Map<string, PayoutLedgerDocument>();

let indexesInitialized = false;

async function getLedgerCollection(): Promise<Collection<PayoutLedgerDocument> | null> {
  const db: Db | null = await getDatabase();
  if (!db) return null;

  const collection = db.collection<PayoutLedgerDocument>(COLLECTION_NAME);

  if (!indexesInitialized) {
    try {
      await collection.createIndex({ reference: 1 }, { unique: true });
      await collection.createIndex({ offlineId: 1 });
      await collection.createIndex({ 'daraja.originatorConversationId': 1 });
      await collection.createIndex({ 'daraja.conversationId': 1 });
      await collection.createIndex({ status: 1 });
      await collection.createIndex({ createdAt: -1 });
      indexesInitialized = true;
    } catch {
      // index might already exist or running in constrained environment
    }
  }

  return collection;
}

/**
 * Checks if a transaction with the given offlineId or reference already exists.
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

  await collection.insertOne(doc as any);
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
      doc.daraja = {
        ...darajaData,
        submittedAt: now,
      };
      doc.updatedAt = now;
      inMemoryLedger.set(reference, doc);
    }
    return;
  }

  await collection.updateOne(
    { reference },
    {
      $set: {
        daraja: {
          ...darajaData,
          submittedAt: now,
        },
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

  // Extract parsed details from parameters
  const details = extractDarajaCallbackDetails(callbackResult);
  const now = new Date();
  const finalStatus: LedgerStatus = ResultCode === 0 ? 'COMPLETED' : 'FAILED';

  // Look up document
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
