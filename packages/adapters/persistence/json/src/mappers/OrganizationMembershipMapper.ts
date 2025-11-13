import { OrganizationMembership } from '@multitenantkit/domain-contracts';
import { OrganizationMembershipJsonData } from '../storage/schemas';

/**
 * Maps between OrganizationMembership domain entity and JSON storage format
 *
 * Note: This mapper handles type conversions (Date ↔ string).
 * For advanced field mapping, use toDomainWithCustom with columnMapping.
 */
export class OrganizationMembershipMapper {
    /**
     * Convert OrganizationMembership entity to JSON data for storage
     * Note: Keeps domain field names (no transformation)
     */
    static toJson(membership: OrganizationMembership): OrganizationMembershipJsonData {
        const snapshot = membership;
        return {
            ...snapshot,
            invitedAt: snapshot.invitedAt?.toISOString(),
            joinedAt: snapshot.joinedAt?.toISOString(),
            leftAt: snapshot.leftAt?.toISOString(),
            deletedAt: snapshot.deletedAt?.toISOString(),
            createdAt: snapshot.createdAt.toISOString(),
            updatedAt: snapshot.updatedAt.toISOString()
        };
    }

    /**
     * Convert JSON data to OrganizationMembership entity
     * Returns null if conversion fails (invalid data)
     * Note: Expects domain field names (no transformation)
     */
    static toDomain(jsonData: OrganizationMembershipJsonData): OrganizationMembership | null {
        try {
            const createdAt = new Date(jsonData.createdAt);
            const updatedAt = new Date(jsonData.updatedAt);
            const invitedAt = jsonData.invitedAt ? new Date(jsonData.invitedAt) : undefined;
            const joinedAt = jsonData.joinedAt ? new Date(jsonData.joinedAt) : undefined;
            const leftAt = jsonData.leftAt ? new Date(jsonData.leftAt) : undefined;
            const deletedAt = jsonData.deletedAt ? new Date(jsonData.deletedAt) : undefined;

            if (isNaN(createdAt.getTime()) || isNaN(updatedAt.getTime())) {
                console.warn(`Invalid dates in JSON data for membership ${jsonData.id}`);
                return null;
            }

            if (invitedAt && isNaN(invitedAt.getTime())) {
                return null;
            }

            if (joinedAt && isNaN(joinedAt.getTime())) {
                return null;
            }

            if (leftAt && isNaN(leftAt.getTime())) {
                return null;
            }

            if (deletedAt && isNaN(deletedAt.getTime())) {
                return null;
            }

            const membershipProps = {
                ...jsonData,
                createdAt,
                updatedAt,
                invitedAt,
                joinedAt,
                leftAt,
                deletedAt
            };

            return membershipProps;
        } catch (error) {
            console.warn(
                `Error converting JSON data to OrganizationMembership domain entity:`,
                error
            );
            return null;
        }
    }

    /**
     * Convert array of JSON data to array of OrganizationMembership entities
     */
    static toDomainArray(
        jsonDataArray: OrganizationMembershipJsonData[]
    ): OrganizationMembership[] {
        return jsonDataArray
            .map(this.toDomain)
            .filter((membership): membership is OrganizationMembership => membership !== null);
    }

    /**
     * Convert array of OrganizationMembership entities to array of JSON data
     */
    static toJsonArray(memberships: OrganizationMembership[]): OrganizationMembershipJsonData[] {
        return memberships.map(this.toJson);
    }

    /**
     * Convert JSON data to OrganizationMembership entity with custom fields (advanced)
     * Uses columnMapping for field name transformation
     *
     * @param jsonData - JSON data with fields mapped via columnMapping
     * @param columnMap - Column mapping from configHelper
     * @param customMapper - Custom fields mapper from configHelper
     */
    static toDomainWithCustom<TCustomFields>(
        jsonData: Record<string, any>,
        columnMap: Record<string, string>,
        customMapper?: (jsonData: Record<string, any>) => TCustomFields
    ): (OrganizationMembership & TCustomFields) | null {
        try {
            // Extract base fields using column mapping
            const id = jsonData[columnMap.id];
            const userId = jsonData[columnMap.userId];
            const username = jsonData[columnMap.username];
            const organizationId = jsonData[columnMap.organizationId];
            const roleCode = jsonData[columnMap.roleCode];
            const invitedAtStr = jsonData[columnMap.invitedAt];
            const joinedAtStr = jsonData[columnMap.joinedAt];
            const leftAtStr = jsonData[columnMap.leftAt];
            const createdAtStr = jsonData[columnMap.createdAt];
            const updatedAtStr = jsonData[columnMap.updatedAt];
            const deletedAtStr = jsonData[columnMap.deletedAt];

            // Parse dates
            const createdAt = new Date(createdAtStr);
            const updatedAt = new Date(updatedAtStr);
            const invitedAt = invitedAtStr ? new Date(invitedAtStr) : undefined;
            const joinedAt = joinedAtStr ? new Date(joinedAtStr) : undefined;
            const leftAt = leftAtStr ? new Date(leftAtStr) : undefined;
            const deletedAt = deletedAtStr ? new Date(deletedAtStr) : undefined;

            // Validate required dates
            if (isNaN(createdAt.getTime()) || isNaN(updatedAt.getTime())) {
                console.warn(`Invalid dates in JSON data for membership ${id}`);
                return null;
            }

            // Validate optional dates
            if (invitedAt && isNaN(invitedAt.getTime())) {
                return null;
            }

            if (joinedAt && isNaN(joinedAt.getTime())) {
                return null;
            }

            if (leftAt && isNaN(leftAt.getTime())) {
                return null;
            }

            if (deletedAt && isNaN(deletedAt.getTime())) {
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
                const customFields = customMapper(jsonData);
                return { ...baseMembership, ...customFields };
            }

            return baseMembership as OrganizationMembership & TCustomFields;
        } catch (error) {
            console.warn(
                `Error converting JSON data to OrganizationMembership domain entity:`,
                error
            );
            return null;
        }
    }

    /**
     * Convert array of JSON data to array of OrganizationMembership entities with custom fields
     * Filters out invalid entries
     */
    static toDomainArrayWithCustom<TCustomFields>(
        jsonDataArray: Record<string, any>[],
        columnMap: Record<string, string>,
        customMapper?: (jsonData: Record<string, any>) => TCustomFields
    ): (OrganizationMembership & TCustomFields)[] {
        return jsonDataArray
            .map((data) => this.toDomainWithCustom(data, columnMap, customMapper))
            .filter(
                (membership): membership is OrganizationMembership & TCustomFields =>
                    membership !== null
            );
    }
}
