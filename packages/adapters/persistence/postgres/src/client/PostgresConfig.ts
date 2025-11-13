import { z } from 'zod';

/**
 * Allowed DB SSL modes coming from environment variables.
 */
export type DbSslMode = 'true' | 'false' | 'rejectUnauthorized';

/**
 * Strongly-typed environment input.
 * Only includes the variables this module actually cares about.
 */
export interface PostgresDBEnvVars {
    DATABASE_URL?: string;
    DB_HOST?: string;
    DB_PORT?: string; // numeric string
    DB_NAME?: string;
    DB_USER?: string;
    DB_PASSWORD?: string;
    DB_SSL?: DbSslMode;
    DB_POOL_SIZE?: string; // numeric string
}

/**
 * Final normalized DB configuration that a postgres client can consume.
 */
export type DatabaseConfig = z.infer<typeof DatabaseConfigSchema>;

/**
 * Valid output shape consumed by the DB client.
 * - ssl can be boolean or an object with `rejectUnauthorized`
 * - max is the pool size
 */
const DatabaseConfigSchema = z.object({
    host: z.string().min(1, 'Database host is required'),
    port: z.number().int().min(1).max(65535),
    database: z.string().min(1, 'Database name is required'),
    username: z.string().min(1, 'Database username is required'),
    password: z.string().min(1, 'Database password is required'),
    ssl: z.union([z.boolean(), z.object({ rejectUnauthorized: z.boolean() })]),
    max: z.number().int().min(1).default(10)
});

/**
 * Input shape #1: using a connection string.
 */
const EnvViaUrlSchema = z.object({
    DATABASE_URL: z.string().url('DATABASE_URL must be a valid URL')
});

/**
 * Input shape #2: using discrete fields.
 * DB_PORT is optional (defaults to 5432).
 */
const EnvViaPartsSchema = z.object({
    DB_HOST: z.string().min(1, 'DB_HOST is required'),
    DB_NAME: z.string().min(1, 'DB_NAME is required'),
    DB_USER: z.string().min(1, 'DB_USER is required'),
    DB_PASSWORD: z.string().min(1, 'DB_PASSWORD is required'),
    DB_PORT: z.string().regex(/^\d+$/, 'DB_PORT must be a number').optional()
});

/**
 * Common optional controls.
 */
const EnvCommonSchema = z.object({
    DB_SSL: z.enum(['true', 'false', 'rejectUnauthorized']).optional(),
    DB_POOL_SIZE: z.string().regex(/^\d+$/, 'DB_POOL_SIZE must be a number').optional()
});

/**
 * The accepted input is either:
 * - URL variant (DATABASE_URL present), or
 * - Parts variant (DB_HOST/DB_NAME/DB_USER/DB_PASSWORD present)
 * plus the common optional controls.
 */
const InputEnvSchema = z.intersection(
    EnvCommonSchema,
    z.union([EnvViaUrlSchema, EnvViaPartsSchema])
);

/**
 * Helper: parse a numeric string into an integer with fallback.
 */
function parseIntOr<TFallback extends number>(
    value: string | undefined,
    fallback: TFallback
): number {
    const n = Number.parseInt(value ?? '', 10);
    return Number.isFinite(n) ? n : fallback;
}

/**
 * Helper: normalize DB SSL option from env-friendly values.
 *
 * - "false" => false
 * - "true" => { rejectUnauthorized: false }  (require SSL but do not verify CA)
 * - "rejectUnauthorized" => { rejectUnauthorized: true } (strict verification)
 * - undefined => false (local-friendly default)
 */
function parseDbSsl(mode: DbSslMode | undefined): boolean | { rejectUnauthorized: boolean } {
    switch ((mode ?? 'false').toLowerCase() as DbSslMode) {
        case 'false':
            return false;
        case 'true':
            return { rejectUnauthorized: false };
        case 'rejectUnauthorized':
            return { rejectUnauthorized: true };
        default:
            // TypeScript won't reach here due to the union,
            // but keep a safe default in case of runtime drift.
            return false;
    }
}

/**
 * Create a DatabaseConfig from environment variables.
 * Accepts either DATABASE_URL or discrete DB_* variables.
 *
 * - Validates the input shape with Zod (safeParse).
 * - Builds a normalized config.
 * - Validates the final config with DatabaseConfigSchema (safeParse).
 *
 * Throws a descriptive Error if validation fails at any stage.
 */
export function createDatabaseConfig(env: PostgresDBEnvVars): DatabaseConfig {
    // First step: validate that we have either DATABASE_URL or the parts.
    const inputCheck = InputEnvSchema.safeParse(env);
    if (!inputCheck.success) {
        const issues = inputCheck.error.issues
            .map((i) => `${i.path.join('.') || 'root'}: ${i.message}`)
            .join(', ');
        throw new Error(
            `Invalid environment input. Provide either DATABASE_URL or the set {DB_HOST, DB_NAME, DB_USER, DB_PASSWORD}. Details: ${issues}`
        );
    }

    const parsed = inputCheck.data;

    // Resolve the source: URL or parts.
    let intermediate: Omit<DatabaseConfig, 'ssl' | 'max'> & {
        ssl?: DatabaseConfig['ssl'];
        max?: number;
    };

    if ('DATABASE_URL' in parsed) {
        // From DATABASE_URL
        const url = new URL(parsed.DATABASE_URL);

        // Use standard fields; defaults kept simple and explicit.
        intermediate = {
            host: url.hostname,
            port: url.port ? Number(url.port) : 5432,
            database: url.pathname.replace(/^\//, ''), // strip leading slash
            username: url.username,
            password: url.password
        };
    } else {
        // From discrete parts
        intermediate = {
            host: parsed.DB_HOST,
            port: parseIntOr(parsed.DB_PORT, 5432),
            database: parsed.DB_NAME,
            username: parsed.DB_USER,
            password: parsed.DB_PASSWORD
        };
    }

    // Apply common controls (SSL + pool size).
    const ssl = parseDbSsl(parsed.DB_SSL);
    const max = parseIntOr(parsed.DB_POOL_SIZE, 10);

    const finalCandidate: DatabaseConfig = {
        ...intermediate,
        ssl,
        max
    };

    // Final shape validation.
    const finalCheck = DatabaseConfigSchema.safeParse(finalCandidate);
    if (!finalCheck.success) {
        const issues = finalCheck.error.issues
            .map((i) => `${i.path.join('.') || 'root'}: ${i.message}`)
            .join(', ');
        throw new Error(`Invalid database configuration: ${issues}`);
    }

    return finalCheck.data;
}
