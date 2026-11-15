/**
 * Offline queued payout transactions submitted from the Flutter mobile app
 * and disbursement response contract.
 */

export interface QueuedOfflinePayoutItem {
  offlineId: string;
  farmerName: string;
  phone: string;
  county?: string;
  grade?: 'Grade A' | 'Grade B' | 'Grade C' | string;
  weightKg?: number;
  ratePerKg?: number;
  amountKes: number;
  offlineTimestamp: string;
  batchTag?: string;
  farmOrgName?: string;
  operatorId?: string;
  operatorName?: string;
  notes?: string;
}

export interface DisburseRequestBody {
  transactions: QueuedOfflinePayoutItem[];
  stationSyncCode?: string;
  operatorPinHash?: string;
}

export type DisbursementStatus =
  | 'QUEUED'
  | 'PENDING'
  | 'SUCCESS'
  | 'FAILED'
  | 'SKIPPED_DUPLICATE';

export interface PayoutDisbursementResultItem {
  offlineId: string;
  reference: string;
  phone: string;
  amountKes: number;
  status: DisbursementStatus;
  conversationId?: string;
  originatorConversationId?: string;
  darajaResponseCode?: string;
  darajaResponseDesc?: string;
  errorMessage?: string;
}

export interface DisburseResponseBody {
  success: boolean;
  summary: {
    totalReceived: number;
    totalDisbursed: number;
    totalFailed: number;
    totalSkippedDuplicate: number;
    totalAmountKes: number;
  };
  results: PayoutDisbursementResultItem[];
  timestamp: string;
}
