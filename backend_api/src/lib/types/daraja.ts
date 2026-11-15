/**
 * Safaricom Daraja 2.0 B2C API Types & Signatures
 * Strict typing for M-PESA B2C API and asynchronous Webhook Callbacks.
 */

export type DarajaEnvironment = 'sandbox' | 'production';

export type DarajaCommandID = 'BusinessPayment' | 'SalaryPayment' | 'PromotionPayment';

export interface DarajaOAuthResponse {
  access_token: string;
  expires_in: string;
}

export interface DarajaB2CRequestPayload {
  InitiatorName: string;
  SecurityCredential: string;
  CommandID: DarajaCommandID;
  Amount: number;
  PartyA: string; // The B2C shortcode
  PartyB: string; // Farmer Phone Number in 254XXXXXXXXX format
  Remarks: string;
  QueueTimeOutURL: string;
  ResultURL: string;
  Occasion?: string; // Reference KALRO-B2C-YYYYMMDD-XXXX
}

export interface DarajaB2CAsyncResponse {
  ConversationID: string;
  OriginatorConversationID: string;
  ResponseCode: string;
  ResponseDescription: string;
}

export interface DarajaResultParameter {
  Key: string;
  Value: string | number | null;
}

export interface DarajaResultParameters {
  ResultParameter: DarajaResultParameter[];
}

export interface DarajaReferenceItem {
  Key: string;
  Value: string | number | null;
}

export interface DarajaReferenceData {
  ReferenceItem: DarajaReferenceItem | DarajaReferenceItem[];
}

export interface DarajaB2CCallbackResult {
  ResultType: number;
  ResultCode: number;
  ResultDesc: string;
  OriginatorConversationID: string;
  ConversationID: string;
  TransactionID: string;
  ResultParameters?: DarajaResultParameters;
  ReferenceData?: DarajaReferenceData;
}

export interface DarajaB2CCallbackPayload {
  Result: DarajaB2CCallbackResult;
}

/**
 * Parsed parameters extracted from Daraja B2C Callback ResultParameters array
 */
export interface ExtractedDarajaCallbackDetails {
  transactionReceipt: string; // e.g. QJ89XZ3411
  transactionAmount: number;
  transactionCompletedDateTime?: string; // e.g. "15.11.2026 14:15:30"
  receiverPartyPublicName?: string; // e.g. "254712345678 - Grace Wanjiku"
  b2cWorkingAccountAvailableFunds?: number;
  b2cUtilityAccountAvailableFunds?: number;
}
