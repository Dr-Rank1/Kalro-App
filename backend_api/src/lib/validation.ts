import { z } from 'zod';
import { normalizeKenyanPhoneNumber, isValidKenyanPhoneNumber } from './daraja/reference';

/**
 * Sanitizes strings by trimming and stripping HTML/XSS control characters
 */
export function sanitizeString(val: string): string {
  return val
    .trim()
    .replace(/[<>"'&]/g, '')
    .slice(0, 150);
}

/**
 * Strict Phone Number Schema with automatic canonicalization to 254XXXXXXXXX.
 * Accepts:
 *   - 07XXXXXXXX -> 2547XXXXXXXX
 *   - 01XXXXXXXX -> 2541XXXXXXXX
 *   - +254XXXXXXXXX -> 254XXXXXXXXX
 *   - 254XXXXXXXXX -> 254XXXXXXXXX
 */
export const kenyanPhoneSchema = z
  .string()
  .trim()
  .refine(
    (phone) => isValidKenyanPhoneNumber(phone),
    {
      message: 'Invalid Kenyan phone number format. Expected valid 07... or 01... or 254... mobile number.',
    }
  )
  .transform((phone) => normalizeKenyanPhoneNumber(phone));

/**
 * Cocoon Quality Grading System
 */
export const cocoonGradeSchema = z.enum([
  'Grade A',
  'Grade B',
  'Grade C',
  'Reject',
  'Double',
  'Stained',
  'Floss',
]);

/**
 * Strict Individual Queued Payout Schema (One Cocoon Harvest Transaction).
 * Enforces .strict() to prevent prototype pollution or unauthorized mass assignment.
 */
export const queuedPayoutItemSchema = z
  .object({
    // Idempotency Key generated on mobile device during harvest weigh-in
    offlineId: z
      .string()
      .trim()
      .min(5, 'offlineId must be at least 5 characters long.')
      .max(100, 'offlineId cannot exceed 100 characters.')
      .regex(
        /^[a-zA-Z0-9_\-\.:]+$/,
        'offlineId contains invalid characters. Only alphanumeric, dashes, dots, colons, and underscores allowed.'
      ),

    farmerName: z
      .string()
      .trim()
      .min(2, 'farmerName must be at least 2 characters.')
      .max(120, 'farmerName cannot exceed 120 characters.')
      .transform(sanitizeString),

    phone: kenyanPhoneSchema,

    // Financial Disbursement Amount in KES strictly bounded between 10.00 and 150,000.00
    amountKes: z
      .number()
      .finite('amountKes must be a finite number.')
      .min(10, 'Safaricom Daraja B2C minimum disbursement amount is KES 10.00.')
      .max(150000, 'Safaricom Daraja B2C maximum single transaction limit is KES 150,000.00.')
      .transform((val) => Math.round(val)), // Daraja B2C requires integer shillings

    county: z
      .string()
      .trim()
      .max(60)
      .transform(sanitizeString)
      .optional(),

    grade: z
      .string()
      .trim()
      .transform(sanitizeString)
      .optional(),

    weightKg: z
      .number()
      .positive('weightKg must be greater than 0.')
      .max(5000, 'weightKg exceeds maximum single lot limit of 5,000 kg.')
      .optional(),

    ratePerKg: z
      .number()
      .positive('ratePerKg must be greater than 0.')
      .max(10000, 'ratePerKg exceeds maximum allowable rate.')
      .optional(),

    offlineTimestamp: z
      .string()
      .trim()
      .refine(
        (ts) => !isNaN(Date.parse(ts)),
        'offlineTimestamp must be a valid ISO 8601 date string.'
      ),

    batchTag: z
      .string()
      .trim()
      .max(80)
      .transform(sanitizeString)
      .optional(),

    farmOrgName: z
      .string()
      .trim()
      .max(100)
      .transform(sanitizeString)
      .optional(),

    operatorId: z
      .string()
      .trim()
      .max(80)
      .transform(sanitizeString)
      .optional(),

    operatorName: z
      .string()
      .trim()
      .max(80)
      .transform(sanitizeString)
      .optional(),

    notes: z
      .string()
      .trim()
      .max(500)
      .transform(sanitizeString)
      .optional(),
  })
  .strict(); // Strictly reject unexpected injected object keys

export type ValidatedQueuedPayoutItem = z.infer<typeof queuedPayoutItemSchema>;

/**
 * Strict Batch Disburse Request Schema
 */
export const disburseRequestSchema = z
  .object({
    transactions: z
      .array(queuedPayoutItemSchema)
      .min(1, 'transactions array must contain at least 1 payout.')
      .max(50, 'Batch size limit is 50 payouts per request to prevent timeouts.'),

    stationSyncCode: z
      .string()
      .trim()
      .max(50)
      .transform(sanitizeString)
      .optional(),

    operatorPinHash: z
      .string()
      .trim()
      .max(128)
      .optional(),
  })
  .strict();

export type ValidatedDisburseRequest = z.infer<typeof disburseRequestSchema>;

/**
 * Safaricom Daraja B2C Callback Webhook Schema
 * Validates the asynchronous callback payload structure from Safaricom.
 */
export const darajaCallbackSchema = z
  .object({
    Result: z
      .object({
        ResultType: z.number().optional(),
        ResultCode: z.number(),
        ResultDesc: z.string(),
        OriginatorConversationID: z
          .string()
          .min(1, 'OriginatorConversationID cannot be empty.'),
        ConversationID: z
          .string()
          .min(1, 'ConversationID cannot be empty.'),
        TransactionID: z.string().optional(),
        ResultParameters: z
          .object({
            ResultParameter: z.array(
              z.object({
                Key: z.string(),
                Value: z.union([z.string(), z.number()]).optional(),
              })
            ),
          })
          .optional(),
        ReferenceData: z
          .object({
            ReferenceItem: z
              .union([
                z.object({
                  Key: z.string(),
                  Value: z.union([z.string(), z.number()]).optional(),
                }),
                z.array(
                  z.object({
                    Key: z.string(),
                    Value: z.union([z.string(), z.number()]).optional(),
                  })
                ),
              ])
              .optional(),
          })
          .optional(),
      })
      .strict(),
  })
  .strict();

export type ValidatedDarajaCallback = z.infer<typeof darajaCallbackSchema>;

/**
 * Helper to normalize incoming request payload:
 * Accepts { transactions: [...] }, raw array [...], or single object {...}
 */
export function normalizeDisburseInput(rawInput: unknown): unknown {
  if (Array.isArray(rawInput)) {
    return { transactions: rawInput };
  }
  if (
    typeof rawInput === 'object' &&
    rawInput !== null &&
    !('transactions' in rawInput) &&
    'offlineId' in rawInput
  ) {
    return { transactions: [rawInput] };
  }
  return rawInput;
}
