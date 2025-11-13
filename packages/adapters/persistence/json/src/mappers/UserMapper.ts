import { User } from '@multitenantkit/domain-contracts';
import { UserJsonData } from '../storage/schemas';

/**
 * Maps between User domain entity and JSON storage format
 *
 * Note: This mapper handles type conversions (Date ↔ string).
 * For advanced field mapping, use toDomainWithCustom with columnMapping.
 */
export class UserMapper {
    /**
     * Convert User entity to JSON data for storage
     * Note: Keeps domain field names (no transformation)
     */
    static toJson(user: User): UserJsonData {
        return {
            ...user,
            createdAt: user.createdAt.toISOString(),
            updatedAt: user.updatedAt.toISOString(),
            deletedAt: user.deletedAt?.toISOString() ?? null
        };
    }

    /**
     * Convert JSON data to User entity
     * Returns null if conversion fails (invalid data)
     * Note: Expects domain field names (no transformation)
     */
    static toDomain(jsonData: UserJsonData): User | null {
        try {
            const createdAt = new Date(jsonData.createdAt);
            const updatedAt = new Date(jsonData.updatedAt);
            const deletedAt = jsonData.deletedAt ? new Date(jsonData.deletedAt) : undefined;

            if (isNaN(createdAt.getTime()) || isNaN(updatedAt.getTime())) {
                console.warn(`Invalid dates in JSON data for user ${jsonData.id}`);
                return null;
            }

            const userResult: User = {
                ...jsonData,
                createdAt,
                updatedAt,
                deletedAt
            };

            return userResult;
        } catch (error) {
            console.warn(`Error converting JSON data to User domain entity:`, error);
            return null;
        }
    }

    /**
     * Convert array of JSON data to array of User entities
     */
    static toDomainArray(jsonDataArray: UserJsonData[]): User[] {
        return jsonDataArray.map(this.toDomain).filter((user): user is User => user !== null);
    }

    /**
     * Convert array of User entities to array of JSON data
     */
    static toJsonArray(users: User[]): UserJsonData[] {
        return users.map(this.toJson);
    }

    /**
     * Convert JSON data to User entity with custom fields (advanced)
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
    ): (User & TCustomFields) | null {
        try {
            // Extract base fields using column mapping
            const id = jsonData[columnMap.id];
            const externalId = jsonData[columnMap.externalId];
            const username = jsonData[columnMap.username];
            const createdAtStr = jsonData[columnMap.createdAt];
            const updatedAtStr = jsonData[columnMap.updatedAt];
            const deletedAtStr = jsonData[columnMap.deletedAt];

            // Parse dates
            const createdAt = new Date(createdAtStr);
            const updatedAt = new Date(updatedAtStr);
            const deletedAt = deletedAtStr ? new Date(deletedAtStr) : undefined;

            // Validate dates
            if (isNaN(createdAt.getTime()) || isNaN(updatedAt.getTime())) {
                console.warn(`Invalid dates in JSON data for user ${id}`);
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
                const customFields = customMapper(jsonData);
                return { ...baseUser, ...customFields } as User & TCustomFields;
            }

            return baseUser as User & TCustomFields;
        } catch (error) {
            console.warn(`Error converting JSON data to User domain entity:`, error);
            return null;
        }
    }

    /**
     * Convert array of JSON data to array of User entities with custom fields
     * Filters out invalid entries
     */
    static toDomainArrayWithCustom<TCustomFields>(
        jsonDataArray: Record<string, any>[],
        columnMap: Record<string, string>,
        customMapper?: (jsonData: Record<string, any>) => TCustomFields
    ): (User & TCustomFields)[] {
        return jsonDataArray
            .map((data) => this.toDomainWithCustom(data, columnMap, customMapper))
            .filter((user): user is User & TCustomFields => user !== null);
    }
}
