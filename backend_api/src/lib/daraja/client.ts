import { getDarajaAccessToken, getDarajaBaseUrl, clearDarajaTokenCache } from './auth';
import {
  DarajaB2CAsyncResponse,
  DarajaB2CRequestPayload,
  DarajaCommandID,
} from '../types/daraja';
import { normalizeKenyanPhoneNumber } from './reference';

export interface DisburseB2COptions {
  phone: string;
  amountKes: number;
  reference: string; // KALRO-B2C-YYYYMMDD-XXXX
  remarks?: string;
  commandId?: DarajaCommandID;
}

/**
 * Executes a Safaricom Daraja B2C disbursement payment request.
 */
export async function executeDarajaB2CDisbursement(
  options: DisburseB2COptions
): Promise<DarajaB2CAsyncResponse> {
  const { phone, amountKes, reference, remarks } = options;
  const commandId: DarajaCommandID =
    options.commandId ||
    (process.env.DARAJA_COMMAND_ID as DarajaCommandID) ||
    'BusinessPayment';

  const shortCode = process.env.DARAJA_SHORTCODE || '600999';
  const initiatorName = process.env.DARAJA_INITIATOR_NAME || 'testapi';
  const securityCredential = process.env.DARAJA_SECURITY_CREDENTIAL || 'test_credential';
  const callbackUrl =
    process.env.DARAJA_CALLBACK_URL || 'https://example.com/api/payout/callback';
  const timeoutUrl =
    process.env.DARAJA_TIMEOUT_URL || `${callbackUrl}?timeout=true`;

  const normalizedPhone = normalizeKenyanPhoneNumber(phone);
  const roundedAmount = Math.round(amountKes);

  // Simulation mode check for local dev / staging without Daraja credentials
  const isSimulation =
    process.env.DARAJA_SIMULATION === 'true' ||
    (!process.env.DARAJA_CONSUMER_KEY && process.env.NODE_ENV !== 'production');

  if (isSimulation) {
    const simTimestamp = Date.now();
    return {
      ConversationID: `AG_${simTimestamp}_${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
      OriginatorConversationID: `ORIG_${simTimestamp}_${reference.replace(/[^a-zA-Z0-9]/g, '')}`,
      ResponseCode: '0',
      ResponseDescription: 'Accept the service request successfully. (Simulation Mode)',
    };
  }

  // Obtain cached or fresh OAuth access token
  let accessToken = await getDarajaAccessToken();

  const payload: DarajaB2CRequestPayload = {
    InitiatorName: initiatorName,
    SecurityCredential: securityCredential,
    CommandID: commandId,
    Amount: roundedAmount,
    PartyA: shortCode,
    PartyB: normalizedPhone,
    Remarks: remarks || `KALRO Cocoon Payout - ${reference}`,
    QueueTimeOutURL: timeoutUrl,
    ResultURL: callbackUrl,
    Occasion: reference,
  };

  const endpointUrl = `${getDarajaBaseUrl()}/mpesa/b2c/v1/paymentrequest`;

  let response = await fetch(endpointUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
    cache: 'no-store',
  });

  // If 401 Unauthorized, token might have expired on Daraja side: invalidate and retry once
  if (response.status === 401) {
    clearDarajaTokenCache();
    accessToken = await getDarajaAccessToken({ forceRefresh: true });
    response = await fetch(endpointUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      cache: 'no-store',
    });
  }

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(
      `Daraja B2C disbursement rejected (${response.status} ${response.statusText}): ${errorText}`
    );
  }

  const result = (await response.json()) as DarajaB2CAsyncResponse;
  return result;
}
