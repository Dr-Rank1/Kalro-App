import { NextRequest, NextResponse } from 'next/server';
import { DarajaB2CCallbackPayload } from '@/lib/types/daraja';
import { recordDarajaCallback } from '@/lib/db/ledger';

export const dynamic = 'force-dynamic';

/**
 * POST /api/payout/callback
 * Safaricom Daraja B2C Webhook Callback Endpoint
 *
 * Receives asynchronous transaction results from Safaricom M-PESA B2C engine,
 * verifies the transaction status (ResultCode === 0), and updates the MongoDB Atlas ledger.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const isTimeout = request.nextUrl.searchParams.get('timeout') === 'true';

  try {
    let payload: DarajaB2CCallbackPayload;
    try {
      payload = (await request.json()) as DarajaB2CCallbackPayload;
    } catch {
      console.error('[Daraja Callback] Failed to parse JSON body');
      return NextResponse.json(
        { ResultCode: 1, ResultDesc: 'Invalid JSON callback payload' },
        { status: 400 }
      );
    }

    if (!payload?.Result) {
      console.warn('[Daraja Callback] Malformed payload missing Result object:', payload);
      return NextResponse.json(
        { ResultCode: 1, ResultDesc: 'Payload missing Result root attribute' },
        { status: 400 }
      );
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
      `[Daraja Callback] Received callback for ConversationID=${ConversationID}, ` +
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

    // Safaricom Daraja expects standard acknowledgment
    return NextResponse.json(
      {
        ResultCode: 0,
        ResultDesc: 'Callback accepted successfully',
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('[Daraja Callback] Fatal error handling callback:', error);
    // Safaricom expects ResultCode 0 acknowledgment to stop retries if processed
    return NextResponse.json(
      {
        ResultCode: 0,
        ResultDesc: 'Callback received with internal logging notice',
      },
      { status: 200 }
    );
  }
}

/**
 * GET /api/payout/callback
 * Health check endpoint for webhook tunnel verification
 */
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    service: 'KALRO Sericulture Daraja B2C Callback Webhook',
    status: 'listening',
    acceptedMethod: 'POST',
    timestamp: new Date().toISOString(),
  });
}
