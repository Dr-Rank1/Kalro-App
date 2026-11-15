/**
 * MongoDB Atlas Payout Ledger Document Schema
 */

export type LedgerStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'TIMEOUT';

export interface PayoutLedgerDocument {
  _id?: any;
  reference: string; // KALRO-B2C-YYYYMMDD-XXXX
  offlineId: string;
  farmerName: string;
  phoneNumber: string; // 254XXXXXXXXX
  amountKes: number;
  grade?: string;
  weightKg?: number;
  batchTag?: string;
  farmOrgName?: string;
  operatorName?: string;
  status: LedgerStatus;
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
