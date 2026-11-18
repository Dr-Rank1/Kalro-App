import { NextRequest, NextResponse } from 'next/server';
import {
  DisburseResponseBody,
  PayoutDisbursementResultItem,
} from '@/lib/types/payout';
import { generateB2CReference, executeDarajaB2CDisbursement } from '@/lib/daraja';
import {
  reservePayoutIdempotency,
  updatePayoutDarajaSubmission,
  markPayoutFailed,
  getRecentPayouts,
} from '@/lib/idempotency';
import { withErrorHandler, BadRequestError } from '@/lib/errors';
import { checkRateLimit } from '@/lib/rate-limiter';
import {
  disburseRequestSchema,
  normalizeDisburseInput,
  ValidatedQueuedPayoutItem,
} from '@/lib/validation';

export const dynamic = 'force-dynamic';

/**
 * POST /api/payout/disburse
 * Safaricom M-PESA B2C Financial Disbursement Endpoint.
 *
 * Implements Node Best Practices:
 * 1. Centralized Error Handling via withErrorHandler
 * 2. Secrets Guard validated at boot-up
 * 3. Strict Zod payload validation & sanitization
 * 4. Strict idempotency key reservation preventing duplicate payments
 * 5. Sliding-window rate limiting per client
 */
export const POST = withErrorHandler(async (request: NextRequest): Promise<NextResponse> => {
  // 1. Sliding Window Rate Limiting Check
  const rateLimitInfo = checkRateLimit(request);

  // 2. Parse JSON Body
  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    throw new BadRequestError('Malformed JSON payload in request body.');
  }

  // 3. Normalize & Validate Payload with Strict Zod Schema
  const normalizedInput = normalizeDisburseInput(rawBody);
  const parseResult = disburseRequestSchema.safeParse(normalizedInput);

  if (!parseResult.success) {
    // Throws ZodError, which withErrorHandler catches and formats as 422 VALIDATION_ERROR
    throw parseResult.error;
  }

  const { transactions, stationSyncCode, operatorPinHash } = parseResult.data;

  const results: PayoutDisbursementResultItem[] = [];
  let totalDisbursed = 0;
  let totalFailed = 0;
  let totalSkippedDuplicate = 0;
  let totalAmountKes = 0;

  // 4. Process Each Payout with Idempotency Reservation
  for (const tx of transactions) {
    const reference = generateB2CReference();

    // Atomically reserve offlineId in the MongoDB ledger
    const reservation = await reservePayoutIdempotency({
      offlineId: tx.offlineId,
      reference,
      farmerName: tx.farmerName,
      phoneNumber: tx.phone,
      amountKes: tx.amountKes,
      grade: tx.grade,
      weightKg: tx.weightKg,
      batchTag: tx.batchTag,
      farmOrgName: tx.farmOrgName,
      operatorName: tx.operatorName,
      stationSyncCode,
    });

    // IDEMPOTENCY GUARD: If already processed or in progress, NEVER call Daraja again!
    if (!reservation.isNew) {
      const existing = reservation.doc;
      totalSkippedDuplicate++;

      let reason = 'Transaction was already processed and completed.';
      if (reservation.action === 'SKIP_PENDING') {
        reason = 'Transaction was already submitted to Safaricom Daraja and is awaiting callback confirmation.';
      } else if (reservation.action === 'LOCKED_IN_PROGRESS') {
        reason = 'Transaction is currently being processed by another cluster worker. Duplicate attempt ignored.';
      }

      results.push({
        offlineId: tx.offlineId,
        reference: existing.reference,
        phone: existing.phoneNumber,
        amountKes: existing.amountKes,
        status: 'SKIPPED_DUPLICATE',
        conversationId: existing.daraja?.conversationId,
        originatorConversationId: existing.daraja?.originatorConversationId,
        darajaResponseCode: existing.daraja?.responseCode,
        darajaResponseDesc: reason,
      });

      continue;
    }

    // 5. Submit to Safaricom Daraja M-PESA B2C API
    try {
      const darajaResponse = await executeDarajaB2CDisbursement({
        phone: tx.phone,
        amountKes: tx.amountKes,
        reference,
        remarks: `Cocoon Payout - ${tx.farmerName.slice(0, 20)}`,
      });

      // 6. Update ledger with Daraja Conversation IDs
      await updatePayoutDarajaSubmission(reference, {
        conversationId: darajaResponse.ConversationID,
        originatorConversationId: darajaResponse.OriginatorConversationID,
        responseCode: darajaResponse.ResponseCode,
        responseDescription: darajaResponse.ResponseDescription,
      });

      results.push({
        offlineId: tx.offlineId,
        reference,
        phone: tx.phone,
        amountKes: tx.amountKes,
        status: 'PENDING',
        conversationId: darajaResponse.ConversationID,
        originatorConversationId: darajaResponse.OriginatorConversationID,
        darajaResponseCode: darajaResponse.ResponseCode,
        darajaResponseDesc: darajaResponse.ResponseDescription,
      });

      totalDisbursed++;
      totalAmountKes += tx.amountKes;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Daraja API disbursement failure';
      console.error(`[Disburse Route] Safaricom submission failed for ${reference}:`, errorMessage);

      await markPayoutFailed(reference, errorMessage);

      results.push({
        offlineId: tx.offlineId,
        reference,
        phone: tx.phone,
        amountKes: tx.amountKes,
        status: 'FAILED',
        errorMessage,
      });

      totalFailed++;
    }
  }

  // 7. Assemble Structured Response Payload
  const responsePayload: DisburseResponseBody = {
    success: totalFailed === 0,
    summary: {
      totalReceived: transactions.length,
      totalDisbursed,
      totalFailed,
      totalSkippedDuplicate,
      totalAmountKes,
    },
    results,
    timestamp: new Date().toISOString(),
  };

  return NextResponse.json(responsePayload, {
    status: 200,
    headers: {
      'X-RateLimit-Limit': String(rateLimitInfo.limit),
      'X-RateLimit-Remaining': String(rateLimitInfo.remaining),
      'X-RateLimit-Reset': String(rateLimitInfo.resetSeconds),
    },
  });
});

/**
 * GET /api/payout/disburse
 * Diagnostic status endpoint for station telemetry & recent ledger inspection
 */
export const GET = withErrorHandler(async (): Promise<NextResponse> => {
  const recent = await getRecentPayouts(25);
  return NextResponse.json({
    status: 'active',
    service: 'KALRO Sericulture M-PESA B2C Payout Engine',
    environment: process.env.DARAJA_ENVIRONMENT || 'sandbox',
    shortcode: process.env.DARAJA_SHORTCODE || '600999',
    recentPayoutsCount: recent.length,
    recentPayouts: recent,
    timestamp: new Date().toISOString(),
  });
});
