# KALRO Sericulture Cloud Backend API

[![Next.js](https://img.shields.io/badge/Next.js-15+-000000.svg?logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9+-3178C6.svg?logo=typescript)](https://www.typescriptlang.org)
[![Zod](https://img.shields.io/badge/Zod-Validation-3E67B1.svg?logo=zod)](https://zod.dev)
[![Node Best Practices](https://img.shields.io/badge/Node_Best_Practices-Compliant-brightgreen.svg)](https://github.com/goldbergyoni/nodebestpractices)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)

The **KALRO Sericulture Cloud Backend API** is a secure, serverless financial backend engineered using the **Next.js 15 App Router**. It executes live **Safaricom Daraja 2.0 B2C (Business to Customer)** mobile money payments to smallholder sericulture farmers for cocoon harvest deliveries, and synchronizes transactions to a central **MongoDB Atlas** ledger.

---

## Architecture & Security Enforcement (Node Best Practices)

The backend rigorously implements production security and architectural guidelines from [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices):

```
┌─────────────────────────────────┐
│     KALRO Flutter App (lib/)    │
│  - Offline M-Pesa B2C Calculator│
│  - Local SQLite FFI Queue       │
└────────────────┬────────────────┘
                 │ (When Cellular Restored)
                 ▼ POST /api/payout/disburse
┌────────────────────────────────────────────────────────┐
│     KALRO Backend API (Next.js 15 App Router)          │
│                                                        │
│  1. Secrets Guard: Zod Boot-Up Environment Validation  │
│  2. Rate Limiting: In-Memory Sliding-Window Guard      │
│  3. Payload Sanitization: Strict Zod Validation Schema │
│  4. Idempotency Guard: Prevents Double-Payment Retries │
│  5. Daraja 2.0 Client: In-Memory OAuth Token Caching   │
│  6. Central Error Handler: Standardized, No Leaks      │
└────────────────┬───────────────────────────────────────┘
                 │
                 ▼ Safaricom Daraja B2C Payment Request
                 │
                 ▼ POST /api/payout/callback (Async Webhook)
┌────────────────────────────────────────────────────────┐
│  7. Webhook Signature & ResultCode Verification        │
│  8. M-PESA Receipt Extraction (e.g. QJ89XZ3411)        │
│  9. Ledger Update: PENDING -> COMPLETED / FAILED       │
└────────────────────────────────────────────────────────┘
```

---

## Core Security Pillars

### 1. Strict Secrets Guard (`lib/env.ts`)
* Implements mandatory boot-up environment variable validation via Zod.
* If `DARAJA_CONSUMER_KEY`, `DARAJA_CONSUMER_SECRET`, or `MONGODB_URI` are missing or fail protocol formats (e.g. invalid MongoDB URI scheme), the application immediately fails fast with explicit configuration guidance before serving requests.

### 2. Centralized Error Handling (`lib/errors.ts`)
* Catches all synchronous exceptions and unhandled promise rejections through a centralized error formatter.
* Formats operational errors (`AppError`, `ValidationError`, `RateLimitError`) into consistent JSON responses.
* In production (`NODE_ENV === 'production'`), internal database errors, system file paths, and stack traces are strictly concealed from client responses to prevent reconnaissance attacks.

### 3. Strict Payload Sanitization (`lib/validation.ts`)
* All incoming disbursement requests to `POST /api/payout/disburse` pass through strict Zod schemas.
* Validates Kenyan mobile number formats (canonicalizing `07...` and `01...` to international `254...`).
* Enforces Safaricom B2C financial boundaries: Minimum **KES 10.00**, Maximum **KES 150,000.00** per transaction.
* Enforces strict object structures (`.strict()`) to reject unexpected injected keys.

### 4. Idempotency Key Engine (`lib/idempotency.ts`)
* Designed specifically for rural field connectivity where unstable cellular networks cause mobile apps to retry requests.
* Atomically claims transaction `offlineId` keys in MongoDB with a `PENDING` lease.
* If a duplicate request arrives while a payout is pending or completed, the engine intercepts the call and returns the existing transaction status without issuing a duplicate Safaricom disbursement.

### 5. Sliding-Window Rate Limiting (`lib/rate-limiter.ts`)
* Protects disbursement endpoints from burst abuse and DoS attacks using an in-memory sliding-window log algorithm.
* Automatically throttles excessive requests with HTTP 429 (`RateLimitError`) and standard `Retry-After` headers.

---

## API Endpoints

### 1. `POST /api/payout/disburse`
Accepts a JSON payload containing an array of queued offline transactions from the Flutter mobile app.

#### Request Body Example
```json
{
  "transactions": [
    {
      "offlineId": "offline-tx-1731682800",
      "farmerName": "Grace Wanjiku",
      "phone": "0712345678",
      "county": "Kiambu",
      "grade": "Grade A",
      "weightKg": 30.0,
      "ratePerKg": 850.0,
      "amountKes": 25500.0,
      "offlineTimestamp": "2026-11-15T10:14:00Z",
      "batchTag": "BATCH-2026-001",
      "farmOrgName": "KALRO Thika Sericulture Station",
      "operatorName": "Dr. Joyce Njuguna"
    }
  ],
  "stationSyncCode": "KALRO-SERI-KBU-001"
}
```

#### Response Example
```json
{
  "success": true,
  "summary": {
    "totalReceived": 1,
    "totalDisbursed": 1,
    "totalFailed": 0,
    "totalSkippedDuplicate": 0,
    "totalAmountKes": 25500.0
  },
  "results": [
    {
      "offlineId": "offline-tx-1731682800",
      "reference": "KALRO-B2C-20261115-9242",
      "phone": "254712345678",
      "amountKes": 25500.0,
      "status": "PENDING",
      "conversationId": "AG_1794755269521_42TFAX",
      "originatorConversationId": "ORIG_1794755269521_KALROB2C202611159242",
      "darajaResponseCode": "0",
      "darajaResponseDesc": "Accept the service request successfully."
    }
  ],
  "timestamp": "2026-11-15T14:15:00.000Z"
}
```

---

### 2. `POST /api/payout/callback`
Asynchronous webhook receiver invoked by Safaricom Daraja once the M-PESA B2C transaction settles.

#### Safaricom Daraja Callback Payload
```json
{
  "Result": {
    "ResultType": 0,
    "ResultCode": 0,
    "ResultDesc": "The service request is processed successfully.",
    "OriginatorConversationID": "ORIG_1794755269521_KALROB2C202611159242",
    "ConversationID": "AG_1794755269521_42TFAX",
    "TransactionID": "QJ89XZ3411",
    "ResultParameters": {
      "ResultParameter": [
        { "Key": "TransactionAmount", "Value": 25500.0 },
        { "Key": "TransactionReceipt", "Value": "QJ89XZ3411" },
        { "Key": "ReceiverPartyPublicName", "Value": "254712345678 - Grace Wanjiku" },
        { "Key": "TransactionCompletedDateTime", "Value": "15.11.2026 14:15:30" }
      ]
    }
  }
}
```

---

## Environment Variables

Copy `.env.example` to `.env.local`:

```env
DARAJA_ENVIRONMENT=sandbox
DARAJA_CONSUMER_KEY=your_daraja_consumer_key
DARAJA_CONSUMER_SECRET=your_daraja_consumer_secret
DARAJA_SHORTCODE=600999
DARAJA_INITIATOR_NAME=testapi
DARAJA_SECURITY_CREDENTIAL=your_security_credential
DARAJA_CALLBACK_URL=https://your-domain.vercel.app/api/payout/callback
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net
MONGODB_DB_NAME=kalro_sericulture
DARAJA_SIMULATION=true
```

---

## Quality Assurance & Automated Testing

The backend includes an exhaustive test suite (`test_backend.ts`) validating all 5 security test groups:

```bash
# Run security, rate-limiting, and idempotency tests
npm test
```

### Test Suite Output:
* **Secrets Guard**: Correctly fails on missing consumer keys and malformed MongoDB protocols.
* **Error Handling**: Verifies standardized JSON formatting and zero stack leaks in production.
* **Payload Validation**: Tests phone normalizations, boundaries (KES 10 - 150,000), and unknown key rejection.
* **Rate Limiting**: Verifies threshold adherence and HTTP 429 throttling.
* **Idempotency Engine**: Proves that subsequent network retries of the same cocoon batch are safely intercepted with **zero double spend**.
