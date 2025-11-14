import type { OperationContext } from '../../shared';
import type { User } from '../entities';

/**
 * Repository port for User entity
 * Defines the contract that adapters must implement
 *
 * Generic support for custom fields:
 * @template TCustomFields - Additional fields beyond the base User
 *                           Default is empty object for backward compatibility
 */
// biome-ignore lint/complexity/noBannedTypes: ignore
export interface UserRepository<TCustomFields = {}> {
    /**
     * Find a user by their ID
     */
    findById(id: string): Promise<(User & TCustomFields) | null>;

    /**
     * Find a user by their username
     */
    findByUsername(username: string): Promise<(User & TCustomFields) | null>;

    /**
     * Find user by external ID (auth provider ID)
     *
     * @param externalId - The external ID from the authentication provider
     * @returns User if found, null otherwise
     */
    findByExternalId(externalId: string): Promise<(User & TCustomFields) | null>;

    /**
     * Insert a new user
     * @param user The user entity to insert (with optional custom fields)
     * @param context Optional operation context for audit logging
     */
    insert(user: User & TCustomFields, context?: OperationContext): Promise<void>;

    /**
     * Update an existing user
     * @param user The user entity to update (with optional custom fields)
     * @param context Optional operation context for audit logging
     */
    update(user: User & TCustomFields, context?: OperationContext): Promise<void>;

    /**
     * Delete a user by ID
     * @param id The user ID to delete
     * @param context Optional operation context for audit logging
     */
    delete(id: string, context?: OperationContext): Promise<void>;
}
