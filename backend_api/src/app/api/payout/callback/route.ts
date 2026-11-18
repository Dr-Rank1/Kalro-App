import { NextRequest, NextResponse } from 'next/server';
import { recordDarajaCallback } from '@/lib/idempotency';
import { withErrorHandler } from '@/lib/middleware/errorHandler';
import { BadRequestError } from '@/lib/errors/AppError';
import { darajaCallbackSchema } from '@/lib/validation';

export const dynamic = 'force-dynamic';

/**
 * POST /api/payout/callback
 * Safaricom Daraja B2C Webhook Callback Endpoint
 *
 * Receives asynchronous transaction results from Safaricom M-PESA B2C engine:
 * 1. Validates callback payload structure strictly via Zod (darajaCallbackSchema).
 * 2. Extracts TransactionReceipt (e.g., QJ89XZ3411) from ResultParameters or TransactionID.
 * 3. Idempotently transitions the MongoDB ledger record from PENDING to COMPLETED (ResultCode === 0)
 *    or FAILED (ResultCode !== 0).
 * 4. Returns standard Safaricom Daraja acknowledgment response.
 */
export const POST = withErrorHandler(async (request: NextRequest): Promise<NextResponse> => {
  const isTimeout = request.nextUrl.searchParams.get('timeout') === 'true';

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    throw new BadRequestError('Invalid JSON callback payload from Safaricom webhook.');
  }

  // 1. Strict Zod validation of Safaricom Daraja Webhook Payload
  const parseResult = darajaCallbackSchema.safeParse(rawBody);
  if (!parseResult.success) {
    throw new BadRequestError(
      'Malformed Safaricom Daraja webhook callback payload structure.',
      parseResult.error.issues
    );
  }

  const { Result } = parseResult.data;
  const {
    ResultCode,
    ResultDesc,
    OriginatorConversationID,
    ConversationID,
    TransactionID,
  } = Result;

  console.log(
    `[Daraja Callback] Webhook received: ConversationID=${ConversationID}, ` +
      `OriginatorConversationID=${OriginatorConversationID}, ` +
      `ResultCode=${ResultCode} (${ResultDesc}), Receipt=${TransactionID || 'N/A'}, Timeout=${isTimeout}`
  );

  // 2. Idempotently update MongoDB Atlas ledger record
  const updatedLedgerDoc = await recordDarajaCallback(Result as any);

  if (!updatedLedgerDoc) {
    console.warn(
      `[Daraja Callback] No matching ledger record found for ` +
        `OriginatorConversationID="${OriginatorConversationID}" or ConversationID="${ConversationID}". ` +
        `Callback may be for external or expired transaction.`
    );
  } else {
    console.log(
      `[Daraja Callback] Ledger updated successfully for reference="${updatedLedgerDoc.reference}" ` +
        `to status="${updatedLedgerDoc.status}" with receipt="${updatedLedgerDoc.callback?.transactionId || 'N/A'}"`
    );
  }

  // 3. Safaricom Daraja acknowledgment response
  return NextResponse.json(
    {
      ResultCode: 0,
      ResultDesc: 'Callback accepted and processed successfully.',
    },
    { status: 200 }
  );
});

/**
 * GET /api/payout/callback
 * Health check endpoint for webhook tunnel verification
 */
export const GET = withErrorHandler(async (): Promise<NextResponse> => {
  return NextResponse.json({
    service: 'KALRO Sericulture Daraja B2C Callback Webhook',
    status: 'listening',
    acceptedMethod: 'POST',
    timestamp: new Date().toISOString(),
  });
});
