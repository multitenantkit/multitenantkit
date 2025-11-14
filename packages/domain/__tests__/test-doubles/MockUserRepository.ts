import type { User, UserRepository } from '@multitenantkit/domain-contracts';

/**
 * Mock implementation of UserRepository for testing
 */

// biome-ignore lint/complexity/noBannedTypes: ignore
export class MockUserRepository<TCustomFields = {}> implements UserRepository<TCustomFields> {
    public readonly users = new Map<string, User & TCustomFields>();
    public shouldThrowOnSave = false;
    public shouldThrowOnFindById = false;
    public shouldThrowOnFindByExternalId = false;
    public shouldThrowOnFindByEmail = false;
    public shouldThrowOnExistsByEmail = false;
    public shouldThrowOnDelete = false;
    public shouldThrowOnFindByIds = false;
    public shouldThrowOnCount = false;
    public shouldThrowOnFindMany = false;

    async insert(user: User & TCustomFields): Promise<void> {
        if (this.shouldThrowOnSave) {
            throw new Error('Repository save error');
        }
        this.users.set(user.id, user);
    }

    async update(user: User & TCustomFields): Promise<void> {
        if (this.shouldThrowOnSave) {
            throw new Error('Repository save error');
        }
        this.users.set(user.id, user);
    }

    async findById(id: string): Promise<(User & TCustomFields) | null> {
        if (this.shouldThrowOnFindById) {
            throw new Error('Repository findById error');
        }
        return this.users.get(id) || null;
    }

    async findByExternalId(externalId: string): Promise<(User & TCustomFields) | null> {
        if (this.shouldThrowOnFindByExternalId) {
            throw new Error('Repository findByExternalId error');
        }

        for (const user of this.users.values()) {
            if (user.externalId === externalId) {
                return user;
            }
        }
        return null;
    }

    async findByUsername(username: string): Promise<(User & TCustomFields) | null> {
        for (const user of this.users.values()) {
            if (user.username === username) {
                return user;
            }
        }
        return null;
    }

    async delete(id: string): Promise<void> {
        if (this.shouldThrowOnDelete) {
            throw new Error('Repository delete error');
        }
        this.users.delete(id);
    }

    async findByIds(ids: string[]): Promise<(User & TCustomFields)[]> {
        if (this.shouldThrowOnFindByIds) {
            throw new Error('Repository findByIds error');
        }

        const foundUsers: (User & TCustomFields)[] = [];
        for (const id of ids) {
            const user = this.users.get(id);
            if (user) {
                foundUsers.push(user);
            }
        }
        return foundUsers;
    }

    async count(): Promise<number> {
        if (this.shouldThrowOnCount) {
            throw new Error('Repository count error');
        }
        return this.users.size;
    }

    async findMany(options?: {
        limit?: number;
        offset?: number;
    }): Promise<(User & TCustomFields)[]> {
        if (this.shouldThrowOnFindMany) {
            throw new Error('Repository findMany error');
        }

        let users = Array.from(this.users.values());

        // Apply offset
        if (options?.offset) {
            users = users.slice(options.offset);
        }

        // Apply limit
        if (options?.limit) {
            users = users.slice(0, options.limit);
        }

        return users;
    }

    // Helper methods for testing
    clear(): void {
        this.users.clear();
    }

    getUser(id: string): (User & TCustomFields) | undefined {
        return this.users.get(id);
    }

    getAllUsers(): (User & TCustomFields)[] {
        return Array.from(this.users.values());
    }

    getUserCount(): number {
        return this.users.size;
    }
}
