import postgres from 'postgres';
import type { DatabaseConfig } from './PostgresConfig';

/**
 * PostgreSQL database client wrapper
 * Manages direct connection to PostgreSQL database using postgres.js
 *
 * IMPORTANT: This adapter is completely independent of authentication.
 * It only handles database operations using direct SQL queries.
 */
export class DatabaseClient {
    private readonly sql: postgres.Sql;

    constructor(config: DatabaseConfig) {
        this.sql = postgres({
            host: config.host,
            port: config.port,
            database: config.database,
            username: config.username,
            password: config.password,
            ssl: config.ssl,
            max: config.max,
            idle_timeout: 20,
            max_lifetime: 60 * 30 // 30 minutes
            // transform: {
            //     // Convert PostgreSQL column names to camelCase
            //     column: {
            //         from: postgres.toCamel,
            //         to: postgres.toKebab,
            //     },
            // },
        });
    }

    /**
     * Gets the configured postgres SQL client
     * @returns Postgres SQL client for database operations
     */
    getSql(): postgres.Sql {
        return this.sql;
    }

    /**
     * Tests the connection to PostgreSQL
     * @returns Promise that resolves if connection is successful
     */
    async testConnection(): Promise<void> {
        try {
            await this.sql`SELECT 1 as test`;
        } catch (error: any) {
            throw new Error(`Failed to connect to database: ${error.message}`);
        }
    }

    /**
     * Closes the connection pool
     */
    async close(): Promise<void> {
        await this.sql.end();
    }

    /**
     * Execute a transaction
     * @param callback - Transaction callback that receives the SQL client
     * @returns Promise with transaction result
     */
    async transaction<T>(callback: (sql: postgres.Sql) => Promise<T>): Promise<T> {
        return (await this.sql.begin(callback)) as Promise<T>;
    }

    /**
     * Check if a table exists
     * @param tableName - Name of the table to check
     * @returns Promise that resolves to true if table exists
     */
    async tableExists(tableName: string): Promise<boolean> {
        try {
            const result = await this.sql`
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_schema = 'public' 
                    AND table_name = ${tableName}
                )
            `;
            return result[0]?.exists || false;
        } catch (error: any) {
            throw new Error(`Failed to check if table exists: ${error.message}`);
        }
    }

    /**
     * Get database health information
     * @returns Database health status
     */
    async getHealthInfo(): Promise<{
        isHealthy: boolean;
        version: string;
        tables: string[];
        errors: string[];
    }> {
        const errors: string[] = [];
        let version = 'unknown';
        let tables: string[] = [];

        try {
            // Get PostgreSQL version
            const versionResult = await this.sql`SELECT version()`;
            version = versionResult[0]?.version || 'unknown';

            // Get list of tables
            const tablesResult = await this.sql`
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public'
                ORDER BY table_name
            `;
            tables = tablesResult.map((row: any) => row.tableName);
        } catch (error: any) {
            errors.push(`Health check failed: ${error.message}`);
        }

        return {
            isHealthy: errors.length === 0,
            version,
            tables,
            errors
        };
    }
}
