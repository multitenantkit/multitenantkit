import { Organization } from '@multitenantkit/domain-contracts';

/**
 * Maps between Organization domain entity and Postgres database format
 *
 * Note: This mapper ONLY handles type conversions (Date ↔ string).
 * Field name mapping is handled by OrganizationRepositoryConfigHelper using columnMapping.
 */
export class OrganizationMapper {
    /**
     * Convert database row to Organization entity with custom fields
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
    ): (Organization & TCustomFields) | null {
        try {
            // Extract base fields using column mapping
            const id = dbRow[columnMap.id];
            const ownerUserId = dbRow[columnMap.ownerUserId];
            const createdAtStr = dbRow[columnMap.createdAt];
            const updatedAtStr = dbRow[columnMap.updatedAt];
            const archivedAtStr = dbRow[columnMap.archivedAt];
            const deletedAtStr = dbRow[columnMap.deletedAt];

            // Parse dates
            const createdAt = new Date(createdAtStr);
            const updatedAt = new Date(updatedAtStr);
            const archivedAt = archivedAtStr ? new Date(archivedAtStr) : undefined;
            const deletedAt = deletedAtStr ? new Date(deletedAtStr) : undefined;

            // Validate dates
            if (isNaN(createdAt.getTime()) || isNaN(updatedAt.getTime())) {
                console.warn(`Invalid dates in database row for organization ${id}`);
                return null;
            }

            if (archivedAt && isNaN(archivedAt.getTime())) {
                console.warn(`Invalid archivedAt date in database row for organization ${id}`);
                return null;
            }

            if (deletedAt && isNaN(deletedAt.getTime())) {
                console.warn(`Invalid deletedAt date in database row for organization ${id}`);
                return null;
            }

            // Create base Organization entity
            const baseOrganization: Organization = {
                id,
                ownerUserId,
                createdAt,
                updatedAt,
                archivedAt,
                deletedAt
            };

            // Add custom fields if mapper provided
            if (customMapper) {
                const customFields = customMapper(dbRow);
                return { ...baseOrganization, ...customFields } as Organization & TCustomFields;
            }

            return baseOrganization as Organization & TCustomFields;
        } catch (error) {
            console.warn(`Error converting database row to Organization domain entity:`, error);
            return null;
        }
    }

    /**
     * Convert array of database rows to array of Organization entities with custom fields
     * Filters out invalid entries
     */
    static toDomainArrayWithCustom<TCustomFields>(
        dbRows: Record<string, any>[],
        columnMap: Record<string, string>,
        customMapper?: (dbRow: Record<string, any>) => TCustomFields
    ): (Organization & TCustomFields)[] {
        return dbRows
            .map((row) => this.toDomainWithCustom(row, columnMap, customMapper))
            .filter(
                (organization): organization is Organization & TCustomFields =>
                    organization !== null
            );
    }
}
