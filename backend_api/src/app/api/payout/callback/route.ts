import { NextRequest, NextResponse } from 'next/server';
import { DarajaB2CCallbackPayload } from '@/lib/types/daraja';
import { recordDarajaCallback } from '@/lib/db/ledger';
import { withErrorHandler } from '@/lib/middleware/errorHandler';
import { BadRequestError } from '@/lib/errors/AppError';

export const dynamic = 'force-dynamic';

/**
 * POST /api/payout/callback
 * Safaricom Daraja B2C Webhook Callback Endpoint
 *
 * Receives asynchronous transaction results from Safaricom M-PESA B2C engine,
 * verifies the transaction status (ResultCode === 0), and updates the MongoDB Atlas ledger.
 */
export const POST = withErrorHandler(async (request: NextRequest): Promise<NextResponse> => {
  const isTimeout = request.nextUrl.searchParams.get('timeout') === 'true';

  let payload: DarajaB2CCallbackPayload;
  try {
    payload = (await request.json()) as DarajaB2CCallbackPayload;
  } catch {
    throw new BadRequestError('Invalid JSON callback payload from Safaricom webhook.');
  }

  if (!payload?.Result) {
    throw new BadRequestError('Webhook payload missing Result root attribute.');
  }

  const { Result } = payload;
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
      `ResultCode=${ResultCode} (${ResultDesc}), Receipt=${TransactionID}, Timeout=${isTimeout}`
  );

  // Update MongoDB Atlas ledger with transaction result
  const updatedLedgerDoc = await recordDarajaCallback(Result);

  if (!updatedLedgerDoc) {
    console.warn(
      `[Daraja Callback] No matching ledger record found for ` +
        `OriginatorConversationID="${OriginatorConversationID}" or ConversationID="${ConversationID}"`
    );
  } else {
    console.log(
      `[Daraja Callback] Ledger updated successfully for reference="${updatedLedgerDoc.reference}" ` +
        `to status="${updatedLedgerDoc.status}"`
    );
  }

  // Safaricom Daraja expects standard acknowledgment format
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
