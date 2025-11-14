import type { Organization, OrganizationRepository } from '@multitenantkit/domain-contracts';

/**
 * Mock implementation of OrganizationRepository for testing
 */
export class MockOrganizationRepository implements OrganizationRepository {
    public readonly organizations = new Map<string, Organization>();
    public saveCallCount = 0;
    public lastSavedOrganization: Organization | null = null;
    private saveError: Error | null = null;

    async insert(organization: Organization): Promise<void> {
        this.saveCallCount++;
        this.lastSavedOrganization = organization;

        if (this.saveError) {
            throw this.saveError;
        }

        this.organizations.set(organization.id, organization);
    }

    async findById(id: string): Promise<Organization | null> {
        return this.organizations.get(id) || null;
    }

    async findByOwner(ownerUserId: string): Promise<Organization[]> {
        const result: Organization[] = [];
        for (const organization of this.organizations.values()) {
            if (organization.ownerUserId === ownerUserId) {
                result.push(organization);
            }
        }
        return result;
    }

    async update(organization: Organization): Promise<void> {
        this.organizations.set(organization.id, organization);
    }

    async delete(id: string): Promise<void> {
        this.organizations.delete(id);
    }

    async findByIds(ids: string[]): Promise<Organization[]> {
        const result: Organization[] = [];
        for (const id of ids) {
            const organization = this.organizations.get(id);
            if (organization) {
                result.push(organization);
            }
        }
        return result;
    }

    async count(): Promise<number> {
        return this.organizations.size;
    }

    async findMany(options?: {
        limit?: number;
        offset?: number;
        status?: 'active' | 'archived';
        ownerUserId?: string;
    }): Promise<Organization[]> {
        let result = Array.from(this.organizations.values());

        if (options?.status) {
            if (options.status === 'active') {
                result = result.filter((organization) => organization.deletedAt === null);
            } else if (options.status === 'archived') {
                result = result.filter((organization) => organization.deletedAt !== null);
            }
        }

        if (options?.ownerUserId) {
            result = result.filter(
                (organization) => organization.ownerUserId === options.ownerUserId
            );
        }

        if (options?.offset) {
            result = result.slice(options.offset);
        }

        if (options?.limit) {
            result = result.slice(0, options.limit);
        }

        return result;
    }

    async findAll(): Promise<Organization[]> {
        return Array.from(this.organizations.values());
    }

    // Test helper methods
    setSaveError(error: Error | null): void {
        this.saveError = error;
    }

    reset(): void {
        this.organizations.clear();
        this.saveCallCount = 0;
        this.lastSavedOrganization = null;
        this.saveError = null;
    }
}
