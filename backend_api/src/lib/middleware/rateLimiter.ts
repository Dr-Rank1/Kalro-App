import { NextRequest } from 'next/server';
import { RateLimitError } from '../errors/AppError';

interface RateLimitRecord {
  timestamps: number[];
}

// In-memory sliding window store
const rateLimitMap = new Map<string, RateLimitRecord>();

// Periodic garbage collection every 5 minutes to prevent memory leaks
const GC_INTERVAL_MS = 5 * 60 * 1000;
let lastGcTime = Date.now();

function cleanupExpiredEntries(windowMs: number): void {
  const now = Date.now();
  if (now - lastGcTime < GC_INTERVAL_MS) return;
  lastGcTime = now;

  const threshold = now - windowMs;
  for (const [key, record] of rateLimitMap.entries()) {
    record.timestamps = record.timestamps.filter((ts) => ts > threshold);
    if (record.timestamps.length === 0) {
      rateLimitMap.delete(key);
    }
  }
}

export interface RateLimitOptions {
  windowMs?: number;
  maxRequests?: number;
  keyPrefix?: string;
}

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  resetSeconds: number;
}

/**
 * Extracts client identification (IP or station code) for rate limiting.
 */
export function getClientIdentifier(req: NextRequest, customKey?: string): string {
  if (customKey) return customKey;
  const forwardedFor = req.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  const realIp = req.headers.get('x-real-ip');
  if (realIp) return realIp.trim();
  return '127.0.0.1';
}

/**
 * Checks sliding window rate limit for the client.
 * Throws RateLimitError if limit is exceeded.
 */
export function checkRateLimit(
  req: NextRequest,
  options: RateLimitOptions = {}
): RateLimitInfo {
  const windowMs = options.windowMs || 60_000; // 1 minute
  const maxRequests = options.maxRequests || 60; // 60 req/min
  const prefix = options.keyPrefix || 'payout';

  cleanupExpiredEntries(windowMs);

  const clientKey = `${prefix}:${getClientIdentifier(req)}`;
  const now = Date.now();
  const windowStart = now - windowMs;

  let record = rateLimitMap.get(clientKey);
  if (!record) {
    record = { timestamps: [] };
    rateLimitMap.set(clientKey, record);
  }

  // Remove timestamps older than current window
  record.timestamps = record.timestamps.filter((ts) => ts > windowStart);

  if (record.timestamps.length >= maxRequests) {
    const oldestTimestamp = record.timestamps[0];
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((oldestTimestamp + windowMs - now) / 1000)
    );
    throw new RateLimitError(
      `Rate limit exceeded. Maximum ${maxRequests} requests per minute allowed.`,
      retryAfterSeconds
    );
  }

  // Record this request
  record.timestamps.push(now);

  const remaining = Math.max(0, maxRequests - record.timestamps.length);
  const resetSeconds = Math.ceil(windowMs / 1000);

  return {
    limit: maxRequests,
    remaining,
    resetSeconds,
  };
}

/**
 * Resets rate limit for testing purposes.
 */
export function resetRateLimitStore(): void {
  rateLimitMap.clear();
}
