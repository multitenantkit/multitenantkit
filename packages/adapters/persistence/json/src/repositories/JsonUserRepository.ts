import { UserRepository } from '@multitenantkit/domain-contracts/users';
import { JsonStorage } from '../storage/JsonStorage';
import { UserMapper } from '../mappers/UserMapper';
import { UserJsonData } from '../storage/schemas';
import { join } from 'path';
import type { OperationContext } from '@multitenantkit/domain-contracts/shared';
import { User } from '@multitenantkit/domain-contracts';

/**
 * JSON-based implementation of UserRepository
 * Stores users in a JSON file for development/testing
 */
export class JsonUserRepository implements UserRepository {
    private readonly storage: JsonStorage<UserJsonData>;

    constructor(dataDir: string = './data') {
        const filePath = join(dataDir, 'users.json');
        this.storage = new JsonStorage<UserJsonData>(filePath);
    }

    async findById(id: string): Promise<User | null> {
        const jsonData = await this.storage.findOne((user) => user.id === id);
        return jsonData ? UserMapper.toDomain(jsonData) : null;
    }

    async findByUsername(username: string): Promise<User | null> {
        const jsonData = await this.storage.findOne((user) => user.username === username);
        return jsonData ? UserMapper.toDomain(jsonData) : null;
    }

    /**
     * Find user by external ID (auth provider ID)
     */
    async findByExternalId(externalId: string): Promise<User | null> {
        const jsonData = await this.storage.findOne((user) => user.externalId === externalId);
        return jsonData ? UserMapper.toDomain(jsonData) : null;
    }

    async insert(user: User, context?: OperationContext): Promise<void> {
        // Note: JSON adapter ignores audit context as it doesn't support audit logging
        const jsonData = UserMapper.toJson(user);

        await this.storage.update((users) => {
            const existingIndex = users.findIndex((u) => u.id === user.id);

            if (existingIndex >= 0) {
                // Update existing user
                users[existingIndex] = jsonData;
            } else {
                // Add new user
                users.push(jsonData);
            }

            return users;
        });
    }

    async update(user: User, context?: OperationContext): Promise<void> {
        // Note: JSON adapter ignores audit context as it doesn't support audit logging
        await this.insert(user, context);
    }

    async delete(id: string, context?: OperationContext): Promise<void> {
        // Note: JSON adapter ignores audit context as it doesn't support audit logging
        await this.storage.update((users) => users.filter((user) => user.id !== id));
    }
}
