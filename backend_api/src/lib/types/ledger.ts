/**
 * MongoDB Atlas Payout Ledger Document Schema
 * Adheres to Node Best Practices for Idempotency & Financial Auditing
 */

export type LedgerStatus =
  | 'INITIATED'
  | 'PROCESSING'
  | 'PENDING'
  | 'COMPLETED'
  | 'FAILED'
  | 'TIMEOUT';

export interface PayoutLedgerDocument {
  _id?: any;
  reference: string; // KALRO-B2C-YYYYMMDD-XXXX
  offlineId: string; // Client Idempotency Key
  idempotencyKey?: string; // Explicit duplicate of offlineId for standardized queries
  farmerName: string;
  phoneNumber: string; // 254XXXXXXXXX
  amountKes: number;
  grade?: string;
  weightKg?: number;
  batchTag?: string;
  farmOrgName?: string;
  operatorName?: string;
  stationSyncCode?: string;
  status: LedgerStatus;
  attempts?: number;
  lockUntil?: Date; // Distributed lock timestamp to prevent concurrent double-spend
  createdAt: Date;
  updatedAt: Date;

  // Daraja Submission Data
  daraja?: {
    conversationId?: string;
    originatorConversationId?: string;
    responseCode?: string;
    responseDescription?: string;
    submittedAt?: Date;
  };

  // Callback Result Data from Safaricom Webhook
  callback?: {
    receivedAt: Date;
    resultCode: number;
    resultDesc: string;
    transactionId?: string; // Safaricom M-Pesa Receipt (e.g. QJ89XZ3411)
    transactionAmount?: number;
    receiverPublicName?: string;
    completedAt?: Date;
    b2cUtilityFunds?: number;
    b2cWorkingFunds?: number;
    rawPayload?: any;
  };
}
