/**
 * Integration & Unit Verification Test for KALRO Sericulture Backend API
 */
import assert from 'node:assert';
import {
  generateB2CReference,
  isValidB2CReference,
  normalizeKenyanPhoneNumber,
  isValidKenyanPhoneNumber,
} from './src/lib/daraja/reference';
import { getDarajaAccessToken, clearDarajaTokenCache } from './src/lib/daraja/auth';
import { executeDarajaB2CDisbursement } from './src/lib/daraja/client';
import {
  recordPendingPayout,
  findPayoutByReference,
  findPayoutByOfflineId,
  recordDarajaCallback,
  getRecentPayouts,
} from './src/lib/db/ledger';

async function runTests() {
  console.log('--- Starting KALRO Backend API Tests ---');

  // Test 1: Reference format KALRO-B2C-YYYYMMDD-XXXX
  console.log('[Test 1] Testing KALRO-B2C-YYYYMMDD-XXXX reference generator and validator...');
  const today = new Date();
  const ref = generateB2CReference(today);
  console.log(`  Generated Reference: ${ref}`);
  assert.ok(isValidB2CReference(ref), `Generated reference ${ref} should be valid`);

  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  assert.ok(ref.startsWith(`KALRO-B2C-${yyyy}${mm}${dd}-`), 'Reference must match current date segment');
  assert.strictEqual(ref.length, 23, 'Reference must have exactly 23 characters');

  assert.strictEqual(isValidB2CReference('INVALID-REF'), false);
  assert.strictEqual(isValidB2CReference('KALRO-B2C-2026111-XXXX'), false);
  console.log('  Passed Test 1!');

  // Test 2: Phone number normalization
  console.log('[Test 2] Testing Kenyan phone number normalization...');
  assert.strictEqual(normalizeKenyanPhoneNumber('0712345678'), '254712345678');
  assert.strictEqual(normalizeKenyanPhoneNumber('+254712345678'), '254712345678');
  assert.strictEqual(normalizeKenyanPhoneNumber('254712345678'), '254712345678');
  assert.strictEqual(normalizeKenyanPhoneNumber('0112345678'), '254112345678');
  assert.ok(isValidKenyanPhoneNumber('0712345678'));
  assert.ok(isValidKenyanPhoneNumber('0112345678'));
  assert.strictEqual(isValidKenyanPhoneNumber('12345'), false);
  console.log('  Passed Test 2!');

  // Test 3: Daraja OAuth token caching
  console.log('[Test 3] Testing Daraja OAuth Token Caching...');
  process.env.DARAJA_SIMULATION = 'true';
  clearDarajaTokenCache();
  const token1 = await getDarajaAccessToken();
  assert.ok(token1, 'Token 1 must not be empty');
  const token2 = await getDarajaAccessToken();
  assert.strictEqual(token1, token2, 'Token must be cached and identical across invocations');
  console.log(`  Cached Token: ${token1.slice(0, 30)}...`);
  console.log('  Passed Test 3!');

  // Test 4: Daraja B2C Disbursement
  console.log('[Test 4] Testing Daraja B2C Disbursement Request...');
  const disburseRes = await executeDarajaB2CDisbursement({
    phone: '0712345678',
    amountKes: 25500,
    reference: ref,
    remarks: 'Cocoon Harvest Payout',
  });
  assert.ok(disburseRes.ConversationID, 'Must return ConversationID');
  assert.ok(disburseRes.OriginatorConversationID, 'Must return OriginatorConversationID');
  assert.strictEqual(disburseRes.ResponseCode, '0', 'ResponseCode must be 0');
  console.log(`  ConversationID: ${disburseRes.ConversationID}`);
  console.log('  Passed Test 4!');

  // Test 5: MongoDB Ledger & Callback Flow
  console.log('[Test 5] Testing MongoDB Ledger & Webhook Callback Processing...');
  const offlineId = `offline-tx-${Date.now()}`;
  const testRef = generateB2CReference();

  const pending = await recordPendingPayout({
    reference: testRef,
    offlineId,
    farmerName: 'Grace Wanjiku',
    phoneNumber: '254712345678',
    amountKes: 25500,
    grade: 'Grade A',
    weightKg: 30.0,
    batchTag: 'BATCH-2026-001',
    farmOrgName: 'KALRO Thika Sericulture Station',
    daraja: {
      conversationId: disburseRes.ConversationID,
      originatorConversationId: disburseRes.OriginatorConversationID,
      responseCode: '0',
      responseDescription: 'Accept the service request successfully.',
    },
  });
  assert.strictEqual(pending.status, 'PENDING');

  // Verify findPayoutByOfflineId
  const foundByOffline = await findPayoutByOfflineId(offlineId);
  assert.ok(foundByOffline, 'Should find payout by offline ID');
  assert.strictEqual(foundByOffline?.reference, testRef);

  // Simulate incoming Safaricom Daraja Webhook Callback
  const callbackPayload = {
    ResultType: 0,
    ResultCode: 0,
    ResultDesc: 'The service request is processed successfully.',
    OriginatorConversationID: disburseRes.OriginatorConversationID,
    ConversationID: disburseRes.ConversationID,
    TransactionID: 'QJ89XZ3411',
    ResultParameters: {
      ResultParameter: [
        { Key: 'TransactionAmount', Value: 25500.0 },
        { Key: 'TransactionReceipt', Value: 'QJ89XZ3411' },
        { Key: 'ReceiverPartyPublicName', Value: '254712345678 - Grace Wanjiku' },
        { Key: 'TransactionCompletedDateTime', Value: '15.11.2026 14:15:30' },
        { Key: 'B2CWorkingAccountAvailableFunds', Value: 420000.0 },
        { Key: 'B2CUtilityAccountAvailableFunds', Value: 15000.0 },
      ],
    },
  };

  const completed = await recordDarajaCallback(callbackPayload);
  assert.ok(completed, 'Callback record must return updated doc');
  assert.strictEqual(completed.status, 'COMPLETED', 'Status must transition to COMPLETED');
  assert.strictEqual(completed.callback?.transactionId, 'QJ89XZ3411');
  assert.strictEqual(completed.callback?.resultCode, 0);

  const finalCheck = await findPayoutByReference(testRef);
  assert.strictEqual(finalCheck?.status, 'COMPLETED');
  console.log(`  Updated Payout Reference: ${finalCheck?.reference}, Status: ${finalCheck?.status}, Receipt: ${finalCheck?.callback?.transactionId}`);
  console.log('  Passed Test 5!');

  // Test 6: Recent payouts ledger retrieval
  console.log('[Test 6] Testing Ledger Retrieval...');
  const recent = await getRecentPayouts(10);
  assert.ok(recent.length > 0, 'Recent payouts must contain records');
  console.log(`  Retrieved ${recent.length} recent payout records.`);
  console.log('  Passed Test 6!');

  console.log('--- All Tests Passed Successfully! ---');
}

runTests().catch((err) => {
  console.error('Test Failed:', err);
  process.exit(1);
});
