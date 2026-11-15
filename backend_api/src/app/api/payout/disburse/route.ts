import { NextRequest, NextResponse } from 'next/server';
import {
  DisburseRequestBody,
  DisburseResponseBody,
  PayoutDisbursementResultItem,
  QueuedOfflinePayoutItem,
} from '@/lib/types/payout';
import {
  generateB2CReference,
  isValidKenyanPhoneNumber,
  normalizeKenyanPhoneNumber,
} from '@/lib/daraja/reference';
import {
  findPayoutByOfflineId,
  recordPendingPayout,
  updatePayoutDarajaSubmission,
  getRecentPayouts,
} from '@/lib/db/ledger';
import { executeDarajaB2CDisbursement } from '@/lib/daraja/client';

export const dynamic = 'force-dynamic';

/**
 * POST /api/payout/disburse
 * Accepts queued offline M-PESA B2C payout transactions from the KALRO Flutter app
 * and executes Safaricom Daraja B2C payment requests with KALRO-B2C-YYYYMMDD-XXXX references.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON request payload' },
        { status: 400 }
      );
    }

    // Support both { transactions: [...] } and direct array [...]
    let rawTransactions: QueuedOfflinePayoutItem[] = [];
    if (Array.isArray(body)) {
      rawTransactions = body;
    } else if (Array.isArray(body?.transactions)) {
      rawTransactions = body.transactions;
    } else if (body?.offlineId && body?.amountKes) {
      // Single transaction object fallback
      rawTransactions = [body as QueuedOfflinePayoutItem];
    } else {
      return NextResponse.json(
        {
          success: false,
          error:
            'Missing "transactions" array in request body. Provide a list of offline payouts.',
        },
        { status: 400 }
      );
    }

    if (rawTransactions.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Transactions array is empty. No payouts to disburse.',
        },
        { status: 400 }
      );
    }

    const results: PayoutDisbursementResultItem[] = [];
    let totalDisbursed = 0;
    let totalFailed = 0;
    let totalSkippedDuplicate = 0;
    let totalAmountKes = 0;

    for (const tx of rawTransactions) {
      // 1. Validation
      if (!tx.offlineId) {
        results.push({
          offlineId: 'unknown',
          reference: '',
          phone: tx.phone || '',
          amountKes: tx.amountKes || 0,
          status: 'FAILED',
          errorMessage: 'Missing offlineId for transaction',
        });
        totalFailed++;
        continue;
      }

      if (!tx.phone || !isValidKenyanPhoneNumber(tx.phone)) {
        results.push({
          offlineId: tx.offlineId,
          reference: '',
          phone: tx.phone || '',
          amountKes: tx.amountKes || 0,
          status: 'FAILED',
          errorMessage: `Invalid Kenyan phone number format: "${tx.phone}". Expected 07... or 254...`,
        });
        totalFailed++;
        continue;
      }

      if (typeof tx.amountKes !== 'number' || tx.amountKes <= 0) {
        results.push({
          offlineId: tx.offlineId,
          reference: '',
          phone: tx.phone,
          amountKes: tx.amountKes || 0,
          status: 'FAILED',
          errorMessage: 'Amount in KES must be a positive number greater than 0',
        });
        totalFailed++;
        continue;
      }

      const normalizedPhone = normalizeKenyanPhoneNumber(tx.phone);

      // 2. Idempotency Check
      const existing = await findPayoutByOfflineId(tx.offlineId);
      if (existing) {
        results.push({
          offlineId: tx.offlineId,
          reference: existing.reference,
          phone: existing.phoneNumber,
          amountKes: existing.amountKes,
          status: 'SKIPPED_DUPLICATE',
          conversationId: existing.daraja?.conversationId,
          originatorConversationId: existing.daraja?.originatorConversationId,
          darajaResponseCode: existing.daraja?.responseCode,
          darajaResponseDesc: 'Transaction was already submitted previously.',
        });
        totalSkippedDuplicate++;
        continue;
      }

      // 3. Generate KALRO-B2C-YYYYMMDD-XXXX reference
      const reference = generateB2CReference();

      // 4. Record Pending Payout in MongoDB Atlas Ledger
      await recordPendingPayout({
        reference,
        offlineId: tx.offlineId,
        farmerName: tx.farmerName || 'KALRO Sericulture Farmer',
        phoneNumber: normalizedPhone,
        amountKes: tx.amountKes,
        grade: tx.grade,
        weightKg: tx.weightKg,
        batchTag: tx.batchTag,
        farmOrgName: tx.farmOrgName,
        operatorName: tx.operatorName,
      });

      // 5. Submit to Safaricom Daraja B2C API
      try {
        const darajaResponse = await executeDarajaB2CDisbursement({
          phone: normalizedPhone,
          amountKes: tx.amountKes,
          reference,
          remarks: `KALRO Cocoon Payout ${reference}`,
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
          phone: normalizedPhone,
          amountKes: tx.amountKes,
          status: 'PENDING',
          conversationId: darajaResponse.ConversationID,
          originatorConversationId: darajaResponse.OriginatorConversationID,
          darajaResponseCode: darajaResponse.ResponseCode,
          darajaResponseDesc: darajaResponse.ResponseDescription,
        });

        totalDisbursed++;
        totalAmountKes += tx.amountKes;
      } catch (err: any) {
        console.error(`[Disburse Route] Error submitting ${reference}:`, err);
        results.push({
          offlineId: tx.offlineId,
          reference,
          phone: normalizedPhone,
          amountKes: tx.amountKes,
          status: 'FAILED',
          errorMessage: err?.message || 'Daraja API disbursement failure',
        });
        totalFailed++;
      }
    }

    const responsePayload: DisburseResponseBody = {
      success: totalFailed === 0,
      summary: {
        totalReceived: rawTransactions.length,
        totalDisbursed,
        totalFailed,
        totalSkippedDuplicate,
        totalAmountKes,
      },
      results,
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(responsePayload, { status: 200 });
  } catch (error: any) {
    console.error('[Disburse Route] Unexpected fatal error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Internal server error processing disbursement',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/payout/disburse
 * Returns recent disbursements and API status for station diagnostics
 */
export async function GET(): Promise<NextResponse> {
  try {
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
  } catch (error: any) {
    return NextResponse.json(
      { status: 'error', message: error?.message },
      { status: 500 }
    );
  }
}
