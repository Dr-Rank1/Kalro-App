import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { AppError } from '../errors/AppError';

// Ensure global process rejection listeners are registered once
let processListenersRegistered = false;

export function registerGlobalProcessListeners(): void {
  if (processListenersRegistered) return;
  processListenersRegistered = true;

  process.on('unhandledRejection', (reason: unknown) => {
    console.error(
      '[FATAL: Unhandled Promise Rejection]',
      reason instanceof Error ? { message: reason.message, stack: reason.stack } : reason
    );
  });

  process.on('uncaughtException', (error: Error) => {
    console.error('[FATAL: Uncaught Exception]', {
      name: error.name,
      message: error.message,
      stack: error.stack,
    });
    // For non-operational programmer bugs in Node best practices, exit gracefully
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  });
}

// Auto-register upon module load
registerGlobalProcessListeners();

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
    stack?: string;
  };
  timestamp: string;
}

/**
 * Formats any caught exception into a standardized, safe API error response.
 * Strictly hides stack traces and internal architecture details in production.
 */
export function formatErrorResponse(
  error: unknown,
  req?: NextRequest
): { response: ApiErrorResponse; statusCode: number; headers: Record<string, string> } {
  const isProduction = process.env.NODE_ENV === 'production';
  const timestamp = new Date().toISOString();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // Case 1: Custom AppError (Operational)
  if (error instanceof AppError) {
    if (error.statusCode >= 500) {
      console.error(`[AppError: ${error.errorCode}] ${error.message}`, {
        url: req?.url,
        stack: error.stack,
        details: error.details,
      });
    }

    const payload: ApiErrorResponse = {
      success: false,
      error: {
        code: error.errorCode,
        message: error.message,
        ...(error.details !== undefined ? { details: error.details } : {}),
        ...(!isProduction && error.stack ? { stack: error.stack } : {}),
      },
      timestamp,
    };

    return { response: payload, statusCode: error.statusCode, headers };
  }

  // Case 2: Zod Validation Errors
  if (error instanceof ZodError) {
    const issues = error.issues || (error as any).errors || [];
    const formattedIssues = issues.map((issue: any) => ({
      field: Array.isArray(issue.path) ? issue.path.join('.') : String(issue.path),
      rule: issue.code,
      message: issue.message,
    }));

    const payload: ApiErrorResponse = {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request payload. Please verify required fields.',
        details: formattedIssues,
      },
      timestamp,
    };

    return { response: payload, statusCode: 422, headers };
  }

  // Case 3: MongoDB Duplicate Key (E11000) Idempotency Conflict
  if (typeof error === 'object' && error !== null && 'code' in error && (error as any).code === 11000) {
    const payload: ApiErrorResponse = {
      success: false,
      error: {
        code: 'IDEMPOTENCY_CONFLICT',
        message: 'A transaction with this offlineId or reference already exists.',
        details: (error as any).keyValue,
      },
      timestamp,
    };

    return { response: payload, statusCode: 409, headers };
  }

  // Case 4: Syntax / Bad JSON body
  if (error instanceof SyntaxError && 'body' in (error as any)) {
    const payload: ApiErrorResponse = {
      success: false,
      error: {
        code: 'INVALID_JSON',
        message: 'Malformed JSON in request body.',
      },
      timestamp,
    };

    return { response: payload, statusCode: 400, headers };
  }

  // Case 5: Unexpected Programmer Errors (500)
  const err = error instanceof Error ? error : new Error(String(error));
  console.error('[Unhandled Internal Error]', {
    url: req?.url,
    method: req?.method,
    message: err.message,
    stack: err.stack,
  });

  const payload: ApiErrorResponse = {
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: isProduction
        ? 'An unexpected server error occurred while processing the financial transaction.'
        : err.message,
      ...(!isProduction && err.stack ? { stack: err.stack } : {}),
    },
    timestamp,
  };

  return { response: payload, statusCode: 500, headers };
}

/**
 * Route Handler Middleware wrapper for Next.js 15 App Router.
 * Ensures all synchronous and asynchronous promise rejections are caught centrally.
 */
export function withErrorHandler(
  handler: (request: NextRequest, context?: any) => Promise<NextResponse>
) {
  return async (request: NextRequest, context?: any): Promise<NextResponse> => {
    try {
      return await handler(request, context);
    } catch (error: unknown) {
      const { response, statusCode, headers } = formatErrorResponse(error, request);
      return NextResponse.json(response, {
        status: statusCode,
        headers,
      });
    }
  };
}
