import { DarajaEnvironment, DarajaOAuthResponse } from '../types/daraja';

interface CachedToken {
  token: string;
  expiresAt: number; // Unix epoch ms
}

let cachedToken: CachedToken | null = null;

/**
 * Resolves the Daraja OAuth base URL based on environment.
 */
export function getDarajaBaseUrl(env?: string): string {
  const environment = (env || process.env.DARAJA_ENVIRONMENT || 'sandbox').toLowerCase();
  return environment === 'production'
    ? 'https://api.safaricom.co.ke'
    : 'https://sandbox.safaricom.co.ke';
}

/**
 * Fetches and caches the Safaricom Daraja OAuth access token.
 * Reuses active token until 60 seconds before expiration.
 */
export async function getDarajaAccessToken(options?: {
  consumerKey?: string;
  consumerSecret?: string;
  environment?: DarajaEnvironment;
  forceRefresh?: boolean;
}): Promise<string> {
  const consumerKey = options?.consumerKey || process.env.DARAJA_CONSUMER_KEY || '';
  const consumerSecret = options?.consumerSecret || process.env.DARAJA_CONSUMER_SECRET || '';
  const environment = options?.environment || (process.env.DARAJA_ENVIRONMENT as DarajaEnvironment) || 'sandbox';
  const forceRefresh = options?.forceRefresh || false;

  // Check in-memory cache with 60-second buffer
  const now = Date.now();
  if (!forceRefresh && cachedToken && cachedToken.expiresAt > now + 60_000) {
    return cachedToken.token;
  }

  // Handle simulation mode if explicitly enabled or if credentials are dummy/missing in development
  const isSimulation =
    process.env.DARAJA_SIMULATION === 'true' ||
    (!consumerKey && process.env.NODE_ENV !== 'production');

  if (isSimulation) {
    const mockToken = `simulated_daraja_b2c_token_${Date.now()}`;
    cachedToken = {
      token: mockToken,
      expiresAt: now + 3599 * 1000,
    };
    return mockToken;
  }

  if (!consumerKey || !consumerSecret) {
    throw new Error(
      'Missing Safaricom Daraja credentials. Set DARAJA_CONSUMER_KEY and DARAJA_CONSUMER_SECRET in environment.'
    );
  }

  const credentials = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');
  const authUrl = `${getDarajaBaseUrl(environment)}/oauth/v1/generate?grant_type=client_credentials`;

  const response = await fetch(authUrl, {
    method: 'GET',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => '');
    throw new Error(
      `Failed to authenticate with Safaricom Daraja API (${response.status} ${response.statusText}): ${errorBody}`
    );
  }

  const data = (await response.json()) as DarajaOAuthResponse;
  const expiresInSeconds = parseInt(data.expires_in, 10) || 3599;

  cachedToken = {
    token: data.access_token,
    expiresAt: now + expiresInSeconds * 1000,
  };

  return cachedToken.token;
}

/**
 * Manually evicts the cached token (useful in tests or when Daraja returns 401).
 */
export function clearDarajaTokenCache(): void {
  cachedToken = null;
}
