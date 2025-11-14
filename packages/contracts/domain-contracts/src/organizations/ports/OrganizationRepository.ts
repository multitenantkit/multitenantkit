import type { OperationContext } from '../../shared/OperationContext';
import type { Organization } from '../entities';

/**
 * Repository port for Organization entity
 * Defines the contract that adapters must implement
 *
 * Generic support for custom fields:
 * @template TCustomFields - Additional fields beyond the base Organization
 *                           Default is empty object for backward compatibility
 */
// biome-ignore lint/complexity/noBannedTypes: ignore
export interface OrganizationRepository<TCustomFields = {}> {
    /**
     * Find a organization by its ID
     */
    findById(id: string): Promise<(Organization & TCustomFields) | null>;

    /**
     * Find all organizations owned by a specific user
     */
    findByOwner(ownerUserId: string): Promise<(Organization & TCustomFields)[]>;

    /**
     * Insert a organization (create)
     * @param organization The organization entity to insert (with optional custom fields)
     * @param context Optional operation context for audit logging
     */
    insert(organization: Organization & TCustomFields, context?: OperationContext): Promise<void>;

    /**
     * Update an existing organization
     * @param organization The organization entity to update (with optional custom fields)
     * @param context Optional operation context for audit logging
     */
    update(organization: Organization & TCustomFields, context?: OperationContext): Promise<void>;

    /**
     * Delete a organization by ID
     * @param id The organization ID to delete
     * @param context Optional operation context for audit logging
     */
    delete(id: string, context?: OperationContext): Promise<void>;

    /**
     * Find multiple organizations by their IDs
     */
    findByIds(ids: string[]): Promise<(Organization & TCustomFields)[]>;

    /**
     * Count total number of organizations
     */
    count(): Promise<number>;

    /**
     * Find organizations with pagination and filtering
     */
    findMany(options?: {
        limit?: number;
        offset?: number;
        status?: 'active' | 'archived';
        ownerUserId?: string;
    }): Promise<(Organization & TCustomFields)[]>;
}
