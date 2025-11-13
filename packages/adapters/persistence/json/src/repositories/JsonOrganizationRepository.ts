import { JsonStorage } from '../storage/JsonStorage';
import { OrganizationMapper } from '../mappers/OrganizationMapper';
import { OrganizationJsonData } from '../storage/schemas';
import { join } from 'path';
import type { OperationContext } from '@multitenantkit/domain-contracts/shared';
import { Organization, OrganizationRepository } from '@multitenantkit/domain-contracts';

/**
 * JSON-based implementation of OrganizationRepository
 * Stores organizations in a JSON file for development/testing
 *
 * Generic support for custom fields:
 * @template TCustomFields - Custom fields added to Organization
 */
export class JsonOrganizationRepository<TCustomFields = {}>
    implements OrganizationRepository<TCustomFields>
{
    private readonly storage: JsonStorage<OrganizationJsonData>;

    constructor(dataDir: string = './data') {
        const filePath = join(dataDir, 'organizations.json');
        this.storage = new JsonStorage<OrganizationJsonData>(filePath);
    }

    async findById(id: string): Promise<(Organization & TCustomFields) | null> {
        const jsonData = await this.storage.findOne((organization) => organization.id === id);
        return jsonData ? (OrganizationMapper.toDomain(jsonData) as any) : null;
    }

    async findByOwner(ownerId: string): Promise<(Organization & TCustomFields)[]> {
        const jsonDataArray = await this.storage.findMany(
            (organization) => organization.ownerUserId === ownerId
        );
        return OrganizationMapper.toDomainArray(jsonDataArray) as any;
    }

    async insert(organization: Organization, context?: OperationContext): Promise<void> {
        // Note: JSON adapter ignores audit context as it doesn't support audit logging
        const jsonData = OrganizationMapper.toJson(organization);

        await this.storage.update((organizations) => {
            const existingIndex = organizations.findIndex((t) => t.id === organization.id);

            if (existingIndex >= 0) {
                // Update existing organization
                organizations[existingIndex] = jsonData;
            } else {
                // Add new organization
                organizations.push(jsonData);
            }

            return organizations;
        });
    }

    async update(organization: Organization, context?: OperationContext): Promise<void> {
        // Note: JSON adapter ignores audit context as it doesn't support audit logging
        const jsonData = OrganizationMapper.toJson(organization);

        await this.storage.update((organizations) => {
            const existingIndex = organizations.findIndex((t) => t.id === organization.id);

            if (existingIndex >= 0) {
                organizations[existingIndex] = jsonData;
            }
            // If organization doesn't exist, we don't add it (update only)

            return organizations;
        });
    }

    async delete(id: string, context?: OperationContext): Promise<void> {
        // Note: JSON adapter ignores audit context as it doesn't support audit logging
        await this.storage.update((organizations) =>
            organizations.filter((organization) => organization.id !== id)
        );
    }

    async findByIds(ids: string[]): Promise<(Organization & TCustomFields)[]> {
        const jsonDataArray = await this.storage.findMany((organization) =>
            ids.includes(organization.id)
        );
        return OrganizationMapper.toDomainArray(jsonDataArray) as any;
    }

    async count(): Promise<number> {
        return await this.storage.count();
    }

    async findMany(options?: {
        limit?: number;
        offset?: number;
        status?: 'active' | 'archived';
        ownerUserId?: string;
    }): Promise<(Organization & TCustomFields)[]> {
        let jsonDataArray = await this.storage.findMany((organization) => {
            // Filter by status (archived maps to deletedAt in new model)
            if (options?.status) {
                const isDeleted = organization.deletedAt !== null;
                if (options.status === 'active' && isDeleted) {
                    return false;
                }
                if (options.status === 'archived' && !isDeleted) {
                    return false;
                }
            }

            // Filter by owner
            if (options?.ownerUserId && organization.ownerUserId !== options.ownerUserId) {
                return false;
            }

            return true;
        });

        // Apply pagination
        if (options?.offset) {
            jsonDataArray = jsonDataArray.slice(options.offset);
        }

        if (options?.limit) {
            jsonDataArray = jsonDataArray.slice(0, options.limit);
        }

        return OrganizationMapper.toDomainArray(jsonDataArray) as any;
    }
}
