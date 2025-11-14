import type { Organization } from '@multitenantkit/domain-contracts';
import type { OrganizationJsonData } from '../storage/schemas';

/**
 * Maps between Organization domain entity and JSON storage format
 *
 * Note: This mapper handles type conversions (Date ↔ string).
 * For advanced field mapping, use toDomainWithCustom with columnMapping.
 */
// biome-ignore lint/complexity/noStaticOnlyClass: ignore
export class OrganizationMapper {
    /**
     * Convert Organization entity to JSON data for storage
     * Note: Keeps domain field names (no transformation)
     */
    static toJson(organization: Organization): OrganizationJsonData {
        return {
            id: organization.id,
            ownerUserId: organization.ownerUserId,
            createdAt: organization.createdAt.toISOString(),
            updatedAt: organization.updatedAt.toISOString(),
            archivedAt: organization.archivedAt,
            deletedAt: organization.deletedAt?.toISOString() ?? null
        };
    }

    /**
     * Convert JSON data to Organization entity
     * Returns null if conversion fails (invalid data)
     * Note: Expects domain field names (no transformation)
     */
    static toDomain(jsonData: OrganizationJsonData): Organization | null {
        try {
            const createdAt = new Date(jsonData.createdAt);
            const updatedAt = new Date(jsonData.updatedAt);
            const archivedAt = jsonData.archivedAt ? new Date(jsonData.archivedAt) : undefined;
            const deletedAt = jsonData.deletedAt ? new Date(jsonData.deletedAt) : undefined;

            if (Number.isNaN(createdAt.getTime()) || Number.isNaN(updatedAt.getTime())) {
                console.warn(`Invalid dates in JSON data for organization ${jsonData.id}`);
                return null;
            }

            if (archivedAt && Number.isNaN(archivedAt.getTime())) {
                console.warn(
                    `Invalid archivedAt date in JSON data for organization ${jsonData.id}`
                );
                return null;
            }

            if (deletedAt && Number.isNaN(deletedAt.getTime())) {
                console.warn(`Invalid deletedAt date in JSON data for organization ${jsonData.id}`);
                return null;
            }

            const organizationResult: Organization = {
                ...jsonData,
                createdAt,
                updatedAt,
                archivedAt,
                deletedAt
            };

            return organizationResult;
        } catch (error) {
            console.warn(`Error converting JSON data to Organization domain entity:`, error);
            return null;
        }
    }

    /**
     * Convert array of JSON data to array of Organization entities
     */
    static toDomainArray(jsonDataArray: OrganizationJsonData[]): Organization[] {
        return jsonDataArray
            .map(OrganizationMapper.toDomain)
            .filter((organization): organization is Organization => organization !== null);
    }

    /**
     * Convert array of Organization entities to array of JSON data
     */
    static toJsonArray(organizations: Organization[]): OrganizationJsonData[] {
        return organizations.map(OrganizationMapper.toJson);
    }

    /**
     * Convert JSON data to Organization entity with custom fields (advanced)
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
    ): (Organization & TCustomFields) | null {
        try {
            // Extract base fields using column mapping
            const id = jsonData[columnMap.id];
            const ownerUserId = jsonData[columnMap.ownerUserId];
            const createdAtStr = jsonData[columnMap.createdAt];
            const updatedAtStr = jsonData[columnMap.updatedAt];
            const archivedAtStr = jsonData[columnMap.archivedAt];
            const deletedAtStr = jsonData[columnMap.deletedAt];

            // Parse dates
            const createdAt = new Date(createdAtStr);
            const updatedAt = new Date(updatedAtStr);
            const archivedAt = archivedAtStr ? new Date(archivedAtStr) : undefined;
            const deletedAt = deletedAtStr ? new Date(deletedAtStr) : undefined;

            // Validate dates
            if (Number.isNaN(createdAt.getTime()) || Number.isNaN(updatedAt.getTime())) {
                console.warn(`Invalid dates in JSON data for organization ${id}`);
                return null;
            }

            if (archivedAt && Number.isNaN(archivedAt.getTime())) {
                console.warn(`Invalid archivedAt date in JSON data for organization ${id}`);
                return null;
            }

            if (deletedAt && Number.isNaN(deletedAt.getTime())) {
                console.warn(`Invalid deletedAt date in JSON data for organization ${id}`);
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
                const customFields = customMapper(jsonData);
                return { ...baseOrganization, ...customFields } as Organization & TCustomFields;
            }

            return baseOrganization as Organization & TCustomFields;
        } catch (error) {
            console.warn(`Error converting JSON data to Organization domain entity:`, error);
            return null;
        }
    }

    /**
     * Convert array of JSON data to array of Organization entities with custom fields
     * Filters out invalid entries
     */
    static toDomainArrayWithCustom<TCustomFields>(
        jsonDataArray: Record<string, any>[],
        columnMap: Record<string, string>,
        customMapper?: (jsonData: Record<string, any>) => TCustomFields
    ): (Organization & TCustomFields)[] {
        return jsonDataArray
            .map((data) => OrganizationMapper.toDomainWithCustom(data, columnMap, customMapper))
            .filter(
                (organization): organization is Organization & TCustomFields =>
                    organization !== null
            );
    }
}
