import type { User } from '@multitenantkit/domain-contracts';

/**
 * Maps between User domain entity and PostgreSQL database format
 *
 * Note: This mapper ONLY handles type conversions (Date ↔ string).
 * Field name mapping is handled by UserRepositoryConfigHelper using columnMapping.
 */

// biome-ignore lint/complexity/noStaticOnlyClass: ignore
export class UserMapper {
    /**
     * Convert database row to User entity with custom fields
     * Returns null if conversion fails (invalid data)
     *
     * @param dbRow - Database row with columns mapped via columnMapping
     * @param columnMap - Column mapping from configHelper
     * @param customMapper - Custom fields mapper from configHelper
     */
    static toDomainWithCustom<TCustomFields>(
        dbRow: Record<string, any>,
        columnMap: Record<string, string>,
        customMapper?: (dbRow: Record<string, any>) => TCustomFields
    ): (User & TCustomFields) | null {
        try {
            // Extract base fields using column mapping
            const id = dbRow[columnMap.id];
            const externalId = dbRow[columnMap.externalId];
            const username = dbRow[columnMap.username];
            const createdAtStr = dbRow[columnMap.createdAt];
            const updatedAtStr = dbRow[columnMap.updatedAt];
            const deletedAtStr = dbRow[columnMap.deletedAt];

            // Parse dates
            const createdAt = new Date(createdAtStr);
            const updatedAt = new Date(updatedAtStr);
            const deletedAt = deletedAtStr ? new Date(deletedAtStr) : undefined;

            // Validate dates
            if (Number.isNaN(createdAt.getTime()) || Number.isNaN(updatedAt.getTime())) {
                console.warn(`Invalid dates in database row for user ${id}`);
                return null;
            }

            // Create base User entity
            const baseUser: User = {
                id,
                externalId,
                username,
                createdAt,
                updatedAt,
                deletedAt
            };

            // Add custom fields if mapper provided
            if (customMapper) {
                const customFields = customMapper(dbRow);
                return { ...baseUser, ...customFields } as User & TCustomFields;
            }

            return baseUser as User & TCustomFields;
        } catch (error) {
            console.warn(`Error converting database row to User domain entity:`, error);
            return null;
        }
    }

    /**
     * Convert array of database rows to array of User entities with custom fields
     * Filters out invalid entries
     */
    static toDomainArrayWithCustom<TCustomFields>(
        dbRows: Record<string, any>[],
        columnMap: Record<string, string>,
        customMapper?: (dbRow: Record<string, any>) => TCustomFields
    ): (User & TCustomFields)[] {
        return dbRows
            .map((row) => UserMapper.toDomainWithCustom(row, columnMap, customMapper))
            .filter((user): user is User & TCustomFields => user !== null);
    }
}
