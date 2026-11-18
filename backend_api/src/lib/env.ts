import { z } from 'zod';

/**
 * Strict Environment Variable Schema using Zod
 * Adheres to Node Best Practices (fail-fast on startup, secrets guard).
 */
export const envSchema = z.object({
  // Runtime Environment
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),

  // Safaricom Daraja API Credentials (M-PESA B2C)
  DARAJA_ENVIRONMENT: z
    .enum(['sandbox', 'production'])
    .default('sandbox'),

  DARAJA_CONSUMER_KEY: z
    .string()
    .min(1, 'DARAJA_CONSUMER_KEY is required and cannot be empty for Safaricom Daraja API authentication.'),

  DARAJA_CONSUMER_SECRET: z
    .string()
    .min(1, 'DARAJA_CONSUMER_SECRET is required and cannot be empty for Safaricom Daraja API authentication.'),

  // MongoDB Atlas Database URI
  MONGODB_URI: z
    .string()
    .min(1, 'MONGODB_URI is required and cannot be empty for financial transaction ledger persistence.')
    .regex(
      /^mongodb(?:\+srv)?:\/\/.+/,
      'MONGODB_URI must be a valid MongoDB connection string starting with mongodb:// or mongodb+srv://'
    ),

  MONGODB_DB_NAME: z
    .string()
    .min(1)
    .default('kalro_sericulture'),

  // Daraja B2C Configuration
  DARAJA_SHORTCODE: z
    .string()
    .min(1)
    .default('600999'),

  DARAJA_INITIATOR_NAME: z
    .string()
    .min(1)
    .default('testapi'),

  DARAJA_SECURITY_CREDENTIAL: z
    .string()
    .min(1)
    .default('test_security_credential'),

  DARAJA_COMMAND_ID: z
    .enum(['BusinessPayment', 'SalaryPayment', 'PromotionPayment'])
    .default('BusinessPayment'),

  DARAJA_CALLBACK_URL: z
    .string()
    .url('DARAJA_CALLBACK_URL must be a valid absolute URL.')
    .default('https://api.kalro-nsrc.go.ke/api/payout/callback'),

  DARAJA_TIMEOUT_URL: z
    .string()
    .url('DARAJA_TIMEOUT_URL must be a valid absolute URL.')
    .optional(),

  DARAJA_SIMULATION: z
    .union([z.boolean(), z.enum(['true', 'false'])])
    .transform((val) => val === true || val === 'true')
    .default(false),

  // Idempotency & Lease Timeout Configuration
  PENDING_LEASE_TIMEOUT_MS: z
    .coerce
    .number()
    .int()
    .positive()
    .default(600000), // 10 minutes default for stuck pending transactions

  // Rate Limiting Configuration
  RATE_LIMIT_WINDOW_MS: z
    .coerce
    .number()
    .int()
    .positive()
    .default(60000), // 1 minute

  RATE_LIMIT_MAX_REQUESTS: z
    .coerce
    .number()
    .int()
    .positive()
    .default(60), // 60 requests per minute
});

export type Env = z.infer<typeof envSchema>;

/**
 * Validates process.env against envSchema.
 * Throws a fatal, descriptive compilation/boot-up error if any secret is missing or malformed.
 */
export function validateEnv(customEnv?: Record<string, string | undefined>): Env {
  if (process.env.SKIP_ENV_VALIDATION === 'true' && !customEnv) {
    return process.env as unknown as Env;
  }

  const rawEnv = customEnv || process.env;
  const result = envSchema.safeParse(rawEnv);

  if (!result.success) {
    const issues = result.error.issues || (result.error as any).errors || [];
    const errorDetails = issues.map((issue: any) => {
      return `  - [${issue.path.join('.')}]: ${issue.message}`;
    }).join('\n');

    const errorMessage =
      '\n=================================================================\n' +
      '❌ [KALRO BACKEND API SECRETS GUARD] FATAL CONFIGURATION ERROR\n' +
      'Missing or malformed required environment variables at boot-up:\n' +
      errorDetails +
      '\n=================================================================\n' +
      'The application will not start without valid Daraja and MongoDB secrets.\n' +
      'Check your .env / .env.local file or deployment environment variables.\n';

    console.error(errorMessage);
    throw new Error(errorMessage);
  }

  return result.data;
}

// Global cached validated env
let _env: Env | null = null;

export function getEnv(): Env {
  if (!_env) {
    _env = validateEnv();
  }
  return _env;
}

/**
 * Type-safe proxy to validated environment variables.
 * Triggers validation on first access if not already validated at boot.
 */
export const env: Env = new Proxy({} as Env, {
  get(_target, prop: string | symbol) {
    const validated = getEnv();
    return (validated as any)[prop];
  },
});
