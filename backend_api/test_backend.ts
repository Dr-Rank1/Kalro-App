/**
 * Comprehensive Architectural & Security Test Suite for KALRO Sericulture Backend API
 * Validates compliance with Node Best Practices & Safaricom Daraja Financial Standards.
 */
import assert from 'node:assert';
import {
  generateB2CReference,
  isValidB2CReference,
  normalizeKenyanPhoneNumber,
  isValidKenyanPhoneNumber,
  getDarajaAccessToken,
  clearDarajaTokenCache,
  executeDarajaB2CDisbursement,
} from './src/lib/daraja';
import {
  reservePayoutIdempotency,
  findPayoutByReference,
  findPayoutByOfflineId,
  updatePayoutDarajaSubmission,
  recordDarajaCallback,
  getRecentPayouts,
  clearInMemoryLedger,
  DEFAULT_PENDING_LEASE_TIMEOUT_MS,
} from './src/lib/idempotency';
import { validateEnv } from './src/lib/env';
import {
  AppError,
  BadRequestError,
  ConflictError,
  RateLimitError,
  formatErrorResponse,
} from './src/lib/errors';
import {
  checkRateLimit,
  resetRateLimitStore,
} from './src/lib/rate-limiter';
import {
  disburseRequestSchema,
  queuedPayoutItemSchema,
  darajaCallbackSchema,
  normalizeDisburseInput,
} from './src/lib/validation';

async function runTests() {
  console.log('=================================================================');
  console.log('🚀 RUNNING KALRO SERICULTURE BACKEND API SECURITY & ARCHITECTURE TESTS');
  console.log('=================================================================\n');

  // --------------------------------------------------------------------------
  // SECTION 1: Secrets Guard & Environment Variable Validation (Zod Boot-up)
  // --------------------------------------------------------------------------
  console.log('▶ [TEST GROUP 1] Secrets Guard: Environment Variable Boot-Up Validation');

  // Test 1.1: Missing DARAJA_CONSUMER_KEY
  assert.throws(
    () => {
      validateEnv({
        NODE_ENV: 'production',
        DARAJA_CONSUMER_SECRET: 'secret',
        MONGODB_URI: 'mongodb://localhost:27017/test',
      });
    },
    (err: any) => err.message.includes('DARAJA_CONSUMER_KEY'),
    'Must throw fatal compilation error when DARAJA_CONSUMER_KEY is missing'
  );
  console.log('  ✔ Throws fatal error on missing DARAJA_CONSUMER_KEY');

  // Test 1.2: Missing DARAJA_CONSUMER_SECRET
  assert.throws(
    () => {
      validateEnv({
        NODE_ENV: 'production',
        DARAJA_CONSUMER_KEY: 'key',
        MONGODB_URI: 'mongodb://localhost:27017/test',
      });
    },
    (err: any) => err.message.includes('DARAJA_CONSUMER_SECRET'),
    'Must throw fatal compilation error when DARAJA_CONSUMER_SECRET is missing'
  );
  console.log('  ✔ Throws fatal error on missing DARAJA_CONSUMER_SECRET');

  // Test 1.3: Missing MONGODB_URI
  assert.throws(
    () => {
      validateEnv({
        NODE_ENV: 'production',
        DARAJA_CONSUMER_KEY: 'key',
        DARAJA_CONSUMER_SECRET: 'secret',
      });
    },
    (err: any) => err.message.includes('MONGODB_URI'),
    'Must throw fatal compilation error when MONGODB_URI is missing'
  );
  console.log('  ✔ Throws fatal error on missing MONGODB_URI');

  // Test 1.4: Malformed MONGODB_URI (not starting with mongodb:// or mongodb+srv://)
  assert.throws(
    () => {
      validateEnv({
        NODE_ENV: 'production',
        DARAJA_CONSUMER_KEY: 'key',
        DARAJA_CONSUMER_SECRET: 'secret',
        MONGODB_URI: 'postgres://user:pass@localhost:5432/db',
      });
    },
    (err: any) => err.message.includes('MONGODB_URI'),
    'Must reject invalid database protocol URI for MongoDB'
  );
  console.log('  ✔ Rejects malformed MONGODB_URI protocol');

  // Test 1.5: Valid environment passes with defaults
  const validParsed = validateEnv({
    DARAJA_CONSUMER_KEY: 'valid_key_test',
    DARAJA_CONSUMER_SECRET: 'valid_secret_test',
    MONGODB_URI: 'mongodb+srv://user:pass@cluster0.mongodb.net/test',
  });
  assert.strictEqual(validParsed.DARAJA_CONSUMER_KEY, 'valid_key_test');
  assert.strictEqual(validParsed.DARAJA_SHORTCODE, '600999');
  assert.strictEqual(validParsed.DARAJA_COMMAND_ID, 'BusinessPayment');
  assert.strictEqual(validParsed.PENDING_LEASE_TIMEOUT_MS, 600000);
  console.log('  ✔ Successfully validates and applies defaults on valid configuration\n');

  // --------------------------------------------------------------------------
  // SECTION 2: Centralized Error Handling & Stack Trace Leaks
  // --------------------------------------------------------------------------
  console.log('▶ [TEST GROUP 2] Centralized Error Handling & Information Leak Prevention');

  // Test 2.1: Operational AppError Formatting
  const badReq = new BadRequestError('Invalid transaction request body', { field: 'amount' });
  const formattedBadReq = formatErrorResponse(badReq);
  assert.strictEqual(formattedBadReq.statusCode, 400);
  assert.strictEqual(formattedBadReq.response.error.code, 'BAD_REQUEST');
  assert.strictEqual(formattedBadReq.response.error.message, 'Invalid transaction request body');
  assert.deepStrictEqual(formattedBadReq.response.error.details, { field: 'amount' });
  console.log('  ✔ Formats custom operational AppError into standardized JSON response');

  // Test 2.2: Stack Trace Concealment in Production Mode (Node Best Practice 2.6)
  (process.env as any).NODE_ENV = 'production';
  const prodErr = new Error('Sensitive MongoDB query failed at /var/www/internal.ts:45');
  const prodFormatted = formatErrorResponse(prodErr);
  assert.strictEqual(prodFormatted.statusCode, 500);
  assert.strictEqual(prodFormatted.response.error.code, 'INTERNAL_SERVER_ERROR');
  assert.strictEqual(
    prodFormatted.response.error.stack,
    undefined,
    'Stack trace must NEVER be included in production responses'
  );
  assert.strictEqual(
    prodFormatted.response.error.message.includes('/var/www'),
    false,
    'Internal system paths must NEVER be leaked in production'
  );
  console.log('  ✔ Strictly conceals stack traces and system paths in production mode');

  // Test 2.3: Zero-Leak Redaction of MongoDB internals and paths in operational errors
  const sensitiveAppErr = new AppError('Database connection to mongodb://admin:secret@cluster0.db.net/prod failed at /home/ian/app.ts', 500, 'DB_LEAK');
  const sanitizedErr = formatErrorResponse(sensitiveAppErr);
  assert.strictEqual(
    sanitizedErr.response.error.message.includes('secret@'),
    false,
    'Database passwords must be redacted in production'
  );
  assert.strictEqual(
    sanitizedErr.response.error.message.includes('/home/ian'),
    false,
    'Absolute server paths must be redacted in production'
  );
  console.log('  ✔ Strips MongoDB credentials and file paths from operational errors');

  // Test 2.4: Stack trace preservation in development mode
  (process.env as any).NODE_ENV = 'development';
  const devErr = new Error('Developer debug notice');
  const devFormatted = formatErrorResponse(devErr);
  assert.ok(devFormatted.response.error.stack, 'Stack trace should be available for developers in dev mode');
  console.log('  ✔ Preserves debugging stack trace in development mode\n');

  // --------------------------------------------------------------------------
  // SECTION 3: Strict Zod Payload Validation & Sanitization
  // --------------------------------------------------------------------------
  console.log('▶ [TEST GROUP 3] Strict Zod Payload Validation (/api/payout/disburse)');

  // Test 3.1: Rejects missing or invalid offlineId
  const invalidIdResult = queuedPayoutItemSchema.safeParse({
    offlineId: 'bad', // too short (< 5)
    farmerName: 'John Kamau',
    phone: '0712345678',
    amountKes: 1500,
    offlineTimestamp: new Date().toISOString(),
  });
  assert.strictEqual(invalidIdResult.success, false);
  console.log('  ✔ Rejects offlineId under 5 characters');

  // Test 3.2: Rejects offlineId with illegal characters / script tags
  const scriptIdResult = queuedPayoutItemSchema.safeParse({
    offlineId: 'tx<script>alert(1)</script>',
    farmerName: 'John Kamau',
    phone: '0712345678',
    amountKes: 1500,
    offlineTimestamp: new Date().toISOString(),
  });
  assert.strictEqual(scriptIdResult.success, false);
  console.log('  ✔ Rejects offlineId containing malicious/special characters');

  // Test 3.3: Rejects invalid Kenyan phone numbers
  const badPhones = ['12345', '0612345678', '+15551234567', 'abcdef'];
  for (const bp of badPhones) {
    const res = queuedPayoutItemSchema.safeParse({
      offlineId: 'valid-tx-001',
      farmerName: 'John Kamau',
      phone: bp,
      amountKes: 1500,
      offlineTimestamp: new Date().toISOString(),
    });
    assert.strictEqual(res.success, false, `Phone "${bp}" should be rejected`);
  }
  console.log('  ✔ Rejects invalid Kenyan phone number formats');

  // Test 3.4: Normalizes valid Kenyan phone numbers (07... and 01...) to 254XXXXXXXXX
  const phoneTestCases = [
    { input: '0712345678', expected: '254712345678' },
    { input: '0112345678', expected: '254112345678' },
    { input: '+254722123456', expected: '254722123456' },
    { input: '254110998877', expected: '254110998877' },
  ];
  for (const tc of phoneTestCases) {
    const validPhoneResult = queuedPayoutItemSchema.safeParse({
      offlineId: 'valid-tx-001',
      farmerName: 'Grace Wanjiku',
      phone: tc.input,
      amountKes: 2500,
      offlineTimestamp: new Date().toISOString(),
    });
    assert.strictEqual(validPhoneResult.success, true);
    if (validPhoneResult.success) {
      assert.strictEqual(validPhoneResult.data.phone, tc.expected);
    }
  }
  console.log('  ✔ Canonicalizes local 07... and 01... phone formats to 254...');

  // Test 3.5: Rejects amountKes below Daraja B2C minimum (KES 10)
  const lowAmountResult = queuedPayoutItemSchema.safeParse({
    offlineId: 'valid-tx-002',
    farmerName: 'Grace Wanjiku',
    phone: '0712345678',
    amountKes: 9.99, // Below KES 10
    offlineTimestamp: new Date().toISOString(),
  });
  assert.strictEqual(lowAmountResult.success, false);
  console.log('  ✔ Enforces Safaricom Daraja B2C minimum disbursement limit (KES 10.00)');

  // Test 3.6: Rejects amountKes exceeding single B2C transaction ceiling (KES 150,000)
  const highAmountResult = queuedPayoutItemSchema.safeParse({
    offlineId: 'valid-tx-003',
    farmerName: 'Grace Wanjiku',
    phone: '0712345678',
    amountKes: 150000.50,
    offlineTimestamp: new Date().toISOString(),
  });
  assert.strictEqual(highAmountResult.success, false);
  console.log('  ✔ Enforces Safaricom Daraja B2C maximum single transaction ceiling (KES 150,000.00)');

  // Test 3.7: Prohibits unknown keys via .strict() (Mass Assignment / Injection Guard)
  const injectedResult = queuedPayoutItemSchema.safeParse({
    offlineId: 'valid-tx-004',
    farmerName: 'Grace Wanjiku',
    phone: '0712345678',
    amountKes: 5000,
    offlineTimestamp: new Date().toISOString(),
    __proto__: { isAdmin: true },
    injectedField: 'malicious',
  });
  assert.strictEqual(injectedResult.success, false);
  console.log('  ✔ Rejects unexpected injected object keys via strict schema');

  // Test 3.8: Normalizes Batch Envelope Input
  const normalizedRaw = normalizeDisburseInput([
    {
      offlineId: 'valid-tx-005',
      farmerName: 'Peter Ochieng',
      phone: '0722000000',
      amountKes: 4500,
      offlineTimestamp: new Date().toISOString(),
    },
  ]);
  const parsedBatch = disburseRequestSchema.safeParse(normalizedRaw);
  assert.strictEqual(parsedBatch.success, true);
  console.log('  ✔ Normalizes and validates batch envelope structure\n');

  // --------------------------------------------------------------------------
  // SECTION 4: Rate Limiting
  // --------------------------------------------------------------------------
  console.log('▶ [TEST GROUP 4] Sliding-Window Rate Limiting');
  resetRateLimitStore();

  const mockReq = {
    headers: new Headers({ 'x-forwarded-for': '192.168.1.100' }),
  } as any;

  // Perform 5 allowed requests with limit = 5
  for (let i = 0; i < 5; i++) {
    const info = checkRateLimit(mockReq, { maxRequests: 5, windowMs: 10000 });
    assert.strictEqual(info.limit, 5);
    assert.strictEqual(info.remaining, 4 - i);
  }
  console.log('  ✔ Successfully passes requests under rate limit threshold');

  // 6th request must trigger HTTP 429 RateLimitError
  assert.throws(
    () => {
      checkRateLimit(mockReq, { maxRequests: 5, windowMs: 10000 });
    },
    (err: any) => err instanceof RateLimitError && err.statusCode === 429,
    'Must throw RateLimitError when requests exceed threshold'
  );
  console.log('  ✔ Throws RateLimitError (HTTP 429) when rate limit exceeded\n');

  // --------------------------------------------------------------------------
  // SECTION 5: Idempotency & Double-Disbursement Prevention
  // --------------------------------------------------------------------------
  console.log('▶ [TEST GROUP 5] Idempotency & Double-Disbursement Prevention');
  clearInMemoryLedger();

  const testOfflineId = `harvest-tx-${Date.now()}`;
  const testRef = generateB2CReference();

  // First Attempt: Fresh offline payout arriving from mobile extension app
  const reservation1 = await reservePayoutIdempotency({
    offlineId: testOfflineId,
    reference: testRef,
    farmerName: 'Fatuma Hassan',
    phoneNumber: '254712345678',
    amountKes: 18500,
    grade: 'Grade A',
    weightKg: 20.0,
    batchTag: 'BATCH-THIKA-001',
    farmOrgName: 'KALRO Thika Sericulture Station',
  });

  assert.strictEqual(reservation1.isNew, true);
  assert.strictEqual(reservation1.action, 'PROCEED');
  console.log('  ✔ Initial payout reservation succeeds with action: PROCEED');

  // Mark transaction as PENDING with Safaricom Conversation ID
  await updatePayoutDarajaSubmission(testRef, {
    conversationId: 'AG_SIMULATED_123456',
    originatorConversationId: 'ORIG_SIMULATED_654321',
    responseCode: '0',
    responseDescription: 'Accept the service request successfully.',
  });

  // Second Attempt: Rural network drops ACK. Mobile app retries with SAME offlineId!
  const retryReservation = await reservePayoutIdempotency({
    offlineId: testOfflineId,
    reference: generateB2CReference(), // Even if client or route generated a new ref
    farmerName: 'Fatuma Hassan',
    phoneNumber: '254712345678',
    amountKes: 18500,
  });

  assert.strictEqual(retryReservation.isNew, false);
  assert.strictEqual(retryReservation.action, 'SKIP_PENDING');
  assert.strictEqual(retryReservation.doc.reference, testRef);
  assert.strictEqual(retryReservation.doc.daraja?.conversationId, 'AG_SIMULATED_123456');
  console.log('  ✔ Network retry safely intercepted by Idempotency Key (SKIP_PENDING)');

  // Safaricom sends Webhook Callback marking payment COMPLETED
  const callbackRes = await recordDarajaCallback({
    ResultType: 0,
    ResultCode: 0,
    ResultDesc: 'The service request is processed successfully.',
    OriginatorConversationID: 'ORIG_SIMULATED_654321',
    ConversationID: 'AG_SIMULATED_123456',
    TransactionID: 'QJ99XX55AA',
    ResultParameters: {
      ResultParameter: [
        { Key: 'TransactionAmount', Value: 18500.0 },
        { Key: 'TransactionReceipt', Value: 'QJ99XX55AA' },
        { Key: 'ReceiverPartyPublicName', Value: '254712345678 - Fatuma Hassan' },
        { Key: 'TransactionCompletedDateTime', Value: '16.11.2026 10:30:00' },
      ],
    },
  });

  assert.ok(callbackRes);
  assert.strictEqual(callbackRes?.status, 'COMPLETED');
  assert.strictEqual(callbackRes?.callback?.transactionId, 'QJ99XX55AA');
  console.log('  ✔ Webhook callback successfully updates status to COMPLETED with M-PESA receipt');

  // Third Attempt: Farmer taps retry hours later. Must return SKIP_COMPLETED!
  const postCompletedRetry = await reservePayoutIdempotency({
    offlineId: testOfflineId,
    reference: generateB2CReference(),
    farmerName: 'Fatuma Hassan',
    phoneNumber: '254712345678',
    amountKes: 18500,
  });

  assert.strictEqual(postCompletedRetry.isNew, false);
  assert.strictEqual(postCompletedRetry.action, 'SKIP_COMPLETED');
  assert.strictEqual(postCompletedRetry.doc.callback?.transactionId, 'QJ99XX55AA');
  console.log('  ✔ Post-completion retry strictly intercepted (SKIP_COMPLETED - Zero Double Spend)');

  // Verify full ledger retrieval
  const recent = await getRecentPayouts(10);
  assert.ok(recent.length > 0);
  console.log(`  ✔ Ledger retrieval verified (${recent.length} records found)\n`);

  // --------------------------------------------------------------------------
  // SECTION 6: High-Concurrency Burst Idempotency & Stuck Pending Recovery
  // --------------------------------------------------------------------------
  console.log('▶ [TEST GROUP 6] High-Concurrency Burst Idempotency & Stuck Pending Recovery');

  // Test 6.1: Concurrent duplicate burst (10 simultaneous claims for identical offlineId)
  clearInMemoryLedger();
  const burstOfflineId = `burst-tx-${Date.now()}`;
  const burstPromises = Array.from({ length: 10 }).map((_, idx) =>
    reservePayoutIdempotency({
      offlineId: burstOfflineId,
      reference: `KALRO-BURST-${idx}`,
      farmerName: 'Kiprono Koech',
      phoneNumber: '254712000000',
      amountKes: 12000,
    })
  );

  const burstResults = await Promise.all(burstPromises);
  const proceedCount = burstResults.filter((r) => r.action === 'PROCEED').length;
  const lockedCount = burstResults.filter((r) => r.action === 'LOCKED_IN_PROGRESS').length;

  assert.strictEqual(proceedCount, 1, 'Strictly ONE burst attempt must receive PROCEED');
  assert.strictEqual(lockedCount, 9, 'All 9 concurrent duplicate attempts must be LOCKED_IN_PROGRESS');
  console.log('  ✔ Concurrent burst of 10 identical claims yields strictly 1 PROCEED and 9 LOCKED_IN_PROGRESS');

  // Test 6.2: Stuck PENDING lease recovery after timeout
  clearInMemoryLedger();
  const stuckOfflineId = `stuck-tx-${Date.now()}`;
  const stuckRef = generateB2CReference();

  // 1. Initial reservation
  const stuckInit = await reservePayoutIdempotency({
    offlineId: stuckOfflineId,
    reference: stuckRef,
    farmerName: 'Mama Jane',
    phoneNumber: '254711223344',
    amountKes: 5000,
  });
  assert.strictEqual(stuckInit.action, 'PROCEED');

  // 2. Submit to Daraja -> marked PENDING
  await updatePayoutDarajaSubmission(stuckRef, {
    conversationId: 'AG_STUCK_111',
    originatorConversationId: 'ORIG_STUCK_111',
    responseCode: '0',
    responseDescription: 'Accept the service request successfully.',
  });

  // Verify recent pending blocks retries
  const freshRetry = await reservePayoutIdempotency({
    offlineId: stuckOfflineId,
    reference: generateB2CReference(),
    farmerName: 'Mama Jane',
    phoneNumber: '254711223344',
    amountKes: 5000,
  });
  assert.strictEqual(freshRetry.action, 'SKIP_PENDING');

  // 3. Simulate stuck pending lease: updatedAt set to 15 minutes ago (> 10m threshold)
  const stuckDoc = await findPayoutByOfflineId(stuckOfflineId);
  assert.ok(stuckDoc);
  if (stuckDoc) {
    stuckDoc.updatedAt = new Date(Date.now() - 15 * 60 * 1000);
  }

  // 4. Farmer retries now that the upstream network dropped the callback
  const recoveredLease = await reservePayoutIdempotency({
    offlineId: stuckOfflineId,
    reference: generateB2CReference(),
    farmerName: 'Mama Jane',
    phoneNumber: '254711223344',
    amountKes: 5000,
  });
  assert.strictEqual(recoveredLease.action, 'PROCEED', 'Stuck PENDING lease must be recovered for retry');
  assert.strictEqual(recoveredLease.isNew, true);
  console.log('  ✔ Stuck PENDING lease automatically recovered after upstream timeout\n');

  // --------------------------------------------------------------------------
  // SECTION 7: Daraja 2.0 OAuth Anti-Stampede & Webhook Resilience
  // --------------------------------------------------------------------------
  console.log('▶ [TEST GROUP 7] Daraja 2.0 OAuth Anti-Stampede & Webhook Callback Resilience');

  // Test 7.1: Concurrent OAuth token requests do not stampede
  clearDarajaTokenCache();
  process.env.DARAJA_SIMULATION = 'true';

  const concurrentAuth = await Promise.all([
    getDarajaAccessToken(),
    getDarajaAccessToken(),
    getDarajaAccessToken(),
    getDarajaAccessToken(),
    getDarajaAccessToken(),
  ]);

  const firstToken = concurrentAuth[0];
  assert.ok(firstToken.startsWith('simulated_daraja_b2c_token'));
  for (const t of concurrentAuth) {
    assert.strictEqual(t, firstToken, 'All concurrent token callers must share the exact same access token');
  }
  console.log('  ✔ Concurrent token requests safely share in-flight promise (zero stampede)');

  // Test 7.2: Webhook callback strict Zod validation
  const validCallbackPayload = {
    Result: {
      ResultType: 0,
      ResultCode: 0,
      ResultDesc: 'The service request is processed successfully.',
      OriginatorConversationID: 'ORIG_CONV_9999',
      ConversationID: 'CONV_8888',
      TransactionID: 'QJ89XZ3411',
      ResultParameters: {
        ResultParameter: [
          { Key: 'TransactionAmount', Value: 3500 },
          { Key: 'TransactionReceipt', Value: 'QJ89XZ3411' },
          { Key: 'ReceiverPartyPublicName', Value: '254712345678 - Peter' },
        ],
      },
    },
  };
  const validCallbackResult = darajaCallbackSchema.safeParse(validCallbackPayload);
  assert.strictEqual(validCallbackResult.success, true);
  console.log('  ✔ Safaricom Daraja webhook callback strictly validates valid schema');

  // Test 7.3: Webhook callback rejects malformed payloads (missing ConversationID)
  const invalidCallbackPayload = {
    Result: {
      ResultCode: 0,
      ResultDesc: 'Missing IDs',
      // Missing OriginatorConversationID and ConversationID
    },
  };
  const invalidCallbackResult = darajaCallbackSchema.safeParse(invalidCallbackPayload);
  assert.strictEqual(invalidCallbackResult.success, false);
  console.log('  ✔ Malformed webhook callback is strictly rejected by Zod schema\n');

  console.log('=================================================================');
  console.log('🎉 ALL BACKEND API SECURITY & ARCHITECTURAL TESTS PASSED (100%)');
  console.log('=================================================================');
}

runTests().catch((err) => {
  console.error('\n❌ TEST RUNNER FATAL FAILURE:', err);
  process.exit(1);
});
