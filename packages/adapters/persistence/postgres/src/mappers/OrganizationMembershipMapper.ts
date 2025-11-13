import { OrganizationMembership } from '@multitenantkit/domain-contracts';

/**
 * Maps between OrganizationMembership domain entity and Postgres database format
 *
 * Note: This mapper ONLY handles type conversions (Date ↔ string).
 * Field name mapping is handled by OrganizationMembershipRepositoryConfigHelper using columnMapping.
 */
export class OrganizationMembershipMapper {
    /**
     * Convert database row to OrganizationMembership entity with custom fields
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
    ): (OrganizationMembership & TCustomFields) | null {
        try {
            // Extract base fields using column mapping
            const id = dbRow[columnMap.id];
            const userId = dbRow[columnMap.userId];
            const username = dbRow[columnMap.username];
            const organizationId = dbRow[columnMap.organizationId];
            const roleCode = dbRow[columnMap.roleCode];
            const invitedAtStr = dbRow[columnMap.invitedAt];
            const joinedAtStr = dbRow[columnMap.joinedAt];
            const leftAtStr = dbRow[columnMap.leftAt];
            const createdAtStr = dbRow[columnMap.createdAt];
            const updatedAtStr = dbRow[columnMap.updatedAt];
            const deletedAtStr = dbRow[columnMap.deletedAt];

            // Parse dates
            const createdAt = new Date(createdAtStr);
            const updatedAt = new Date(updatedAtStr);
            const invitedAt = invitedAtStr ? new Date(invitedAtStr) : undefined;
            const joinedAt = joinedAtStr ? new Date(joinedAtStr) : undefined;
            const leftAt = leftAtStr ? new Date(leftAtStr) : undefined;
            const deletedAt = deletedAtStr ? new Date(deletedAtStr) : undefined;

            // Validate required dates
            if (isNaN(createdAt.getTime()) || isNaN(updatedAt.getTime())) {
                console.warn(`Invalid dates in database row for membership ${id}`);
                return null;
            }

            // Validate optional dates
            if (invitedAt && isNaN(invitedAt.getTime())) {
                console.warn(`Invalid invitedAt date in database row for membership ${id}`);
                return null;
            }

            if (joinedAt && isNaN(joinedAt.getTime())) {
                console.warn(`Invalid joinedAt date in database row for membership ${id}`);
                return null;
            }

            if (leftAt && isNaN(leftAt.getTime())) {
                console.warn(`Invalid leftAt date in database row for membership ${id}`);
                return null;
            }

            if (deletedAt && isNaN(deletedAt.getTime())) {
                console.warn(`Invalid deletedAt date in database row for membership ${id}`);
                return null;
            }

            // Create base OrganizationMembership entity
            const baseMembership: OrganizationMembership = {
                id,
                userId,
                username,
                organizationId,
                roleCode,
                invitedAt,
                joinedAt,
                leftAt,
                createdAt,
                updatedAt,
                deletedAt
            };

            // Add custom fields if mapper provided
            if (customMapper) {
                const customFields = customMapper(dbRow);
                return { ...baseMembership, ...customFields };
            }

            return baseMembership as OrganizationMembership & TCustomFields;
        } catch (error) {
            console.warn(
                `Error converting database row to OrganizationMembership domain entity:`,
                error
            );
            return null;
        }
    }

    /**
     * Convert array of database rows to array of OrganizationMembership entities with custom fields
     * Filters out invalid entries
     */
    static toDomainArrayWithCustom<TCustomFields>(
        dbRows: Record<string, any>[],
        columnMap: Record<string, string>,
        customMapper?: (dbRow: Record<string, any>) => TCustomFields
    ): (OrganizationMembership & TCustomFields)[] {
        return dbRows
            .map((row) => this.toDomainWithCustom(row, columnMap, customMapper))
            .filter(
                (membership): membership is OrganizationMembership & TCustomFields =>
                    membership !== null
            );
    }
}
