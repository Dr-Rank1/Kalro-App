# KALRO Sericulture Cloud Backend API (Next.js 15, Vercel Serverless)

The secure cloud counterpart for the offline M-PESA B2C calculator in the KALRO Sericulture Farm Management Flutter mobile application. When rural cellular connectivity is restored, queued offline transactions are synced to this API to execute live Safaricom Daraja 2.0 B2C payment disbursements and update a central MongoDB Atlas ledger.

---

## Architecture Overview

```
┌─────────────────────────────────┐
│     KALRO Flutter App (lib/)    │
│  - Offline M-Pesa B2C Calculator│
│  - Local SQLite FFI Queue       │
└────────────────┬────────────────┘
                 │ (When Cellular Restored)
                 ▼ POST /api/payout/disburse
┌────────────────────────────────────────────────────────┐
│     KALRO Backend API (Next.js 15 Serverless)          │
│                                                        │
│  1. Idempotency Check against MongoDB Atlas            │
│  2. Generate Reference: KALRO-B2C-YYYYMMDD-XXXX        │
│  3. Fetch/Cache OAuth Token (Safaricom Daraja)         │
│  4. Dispatch Daraja B2C Payment Request                │
│  5. Store PENDING Record in MongoDB Atlas Ledger       │
└────────────────┬───────────────────────────────────────┘
                 │
                 ▼ Safaricom Daraja B2C Engine
                 │
                 ▼ POST /api/payout/callback (Async Webhook)
┌────────────────────────────────────────────────────────┐
│  6. Validate ResultCode (0 = Success)                  │
│  7. Extract M-PESA Receipt (e.g. QJ89XZ3411)           │
│  8. Update Ledger: PENDING -> COMPLETED / FAILED       │
└────────────────────────────────────────────────────────┘
```

---

## Endpoints

### 1. `POST /api/payout/disburse`
Accepts a JSON payload containing an array of queued offline transactions from the Flutter mobile app.

#### Request Body
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

#### Response
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
        { "Key": "TransactionCompletedDateTime", "Value": "15.11.2026 14:15:30" },
        { "Key": "B2CWorkingAccountAvailableFunds", "Value": 420000.0 },
        { "Key": "B2CUtilityAccountAvailableFunds", "Value": 15000.0 }
      ]
    }
  }
}
```

#### Callback Response
```json
{
  "ResultCode": 0,
  "ResultDesc": "Callback accepted successfully"
}
```

---

## Features

1. **Strict Reference Format (`KALRO-B2C-YYYYMMDD-XXXX`)**:
   - Every disbursement receives a standard KALRO institutional reference containing an 8-digit date string and a 4-character cryptographic alphanumeric suffix.
2. **Safaricom Daraja OAuth Token Caching**:
   - `getDarajaAccessToken()` fetches OAuth credentials with Basic Base64 auth and caches the token in-memory with a 60-second safety expiry margin.
   - Automatically handles 401 token invalidation and token refresh retries.
3. **MongoDB Atlas Ledger**:
   - Connection pool optimized for Vercel Serverless runtimes (`global._mongoClientPromise`).
   - Idempotency protection prevents double payouts for the same `offlineId`.
   - Complete audit trail of submitted Daraja requests and webhook outcomes.
4. **Development Simulation Mode**:
   - Set `DARAJA_SIMULATION=true` to test full end-to-end disbursement workflows and status transitions without requiring live Safaricom API credentials.

---

## Environment Variables

Copy `.env.example` to `.env.local` to configure:

```env
DARAJA_ENVIRONMENT=sandbox
DARAJA_CONSUMER_KEY=your_daraja_consumer_key
DARAJA_CONSUMER_SECRET=your_daraja_consumer_secret
DARAJA_SHORTCODE=600999
DARAJA_INITIATOR_NAME=testapi
DARAJA_SECURITY_CREDENTIAL=your_security_credential
DARAJA_CALLBACK_URL=https://your-domain.vercel.app/api/payout/callback
MONGODB_URI=mongodb+srv://...
MONGODB_DB_NAME=kalro_sericulture
```

---

## Running Locally & Testing

```bash
# Install dependencies
npm install

# Run unit and integration tests
npm test

# Run Next.js 15 dev server
npm run dev

# Build for production
npm run build
```
