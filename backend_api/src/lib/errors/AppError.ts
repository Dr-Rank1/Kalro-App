/**
 * Operational Error Hierarchy for KALRO Sericulture Backend API
 * Follows Node Best Practices (Section 2: Error Handling)
 * Distinguishes operational (predictable) errors from unexpected programmer bugs.
 */

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly errorCode: string;
  public readonly isOperational: boolean;
  public readonly details?: unknown;
  public readonly timestamp: string;

  constructor(
    message: string,
    statusCode = 500,
    errorCode = 'INTERNAL_SERVER_ERROR',
    isOperational = true,
    details?: unknown
  ) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.isOperational = isOperational;
    this.details = details;
    this.timestamp = new Date().toISOString();

    // Capture standard V8 stack trace excluding constructor call
    Error.captureStackTrace(this, this.constructor);
  }
}

export class BadRequestError extends AppError {
  constructor(message = 'Invalid request payload or parameters', details?: unknown) {
    super(message, 400, 'BAD_REQUEST', true, details);
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Validation failed for request payload', details?: unknown) {
    super(message, 422, 'VALIDATION_ERROR', true, details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required or invalid credentials', details?: unknown) {
    super(message, 401, 'UNAUTHORIZED', true, details);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Access denied for the requested resource', details?: unknown) {
    super(message, 403, 'FORBIDDEN', true, details);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Requested resource not found', details?: unknown) {
    super(message, 404, 'NOT_FOUND', true, details);
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Resource conflict or duplicate operation', details?: unknown) {
    super(message, 409, 'CONFLICT', true, details);
  }
}

export class IdempotencyConflictError extends AppError {
  public readonly offlineId: string;
  public readonly reference?: string;

  constructor(
    message: string,
    offlineId: string,
    reference?: string,
    details?: unknown
  ) {
    super(message, 409, 'IDEMPOTENCY_CONFLICT', true, details);
    this.offlineId = offlineId;
    this.reference = reference;
  }
}

export class RateLimitError extends AppError {
  public readonly retryAfterSeconds: number;

  constructor(
    message = 'Too many requests. Please slow down and try again later.',
    retryAfterSeconds = 60
  ) {
    super(message, 429, 'RATE_LIMIT_EXCEEDED', true, { retryAfterSeconds });
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

export class BadGatewayError extends AppError {
  constructor(
    message = 'Safaricom Daraja API gateway returned an error or invalid response',
    details?: unknown
  ) {
    super(message, 502, 'DARAJA_GATEWAY_ERROR', true, details);
  }
}

export class GatewayTimeoutError extends AppError {
  constructor(
    message = 'Safaricom Daraja API gateway timed out while processing disbursement',
    details?: unknown
  ) {
    super(message, 504, 'DARAJA_GATEWAY_TIMEOUT', true, details);
  }
}
