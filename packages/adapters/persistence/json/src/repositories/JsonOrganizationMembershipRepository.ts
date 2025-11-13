import { JsonStorage } from '../storage/JsonStorage';
import { OrganizationMembershipMapper } from '../mappers/OrganizationMembershipMapper';
import { OrganizationMembershipJsonData } from '../storage/schemas';
import { join } from 'path';
import type { OperationContext } from '@multitenantkit/domain-contracts/shared';
import {
    OrganizationMembership,
    OrganizationMemberWithUserInfo,
    OrganizationMembershipRepository,
    UserRepository,
    OrganizationRepository,
    FindMembersOptions,
    PaginatedResult
} from '@multitenantkit/domain-contracts';

/**
 * JSON-based implementation of OrganizationMembershipRepository
 * Stores organization memberships in a JSON file for development/testing
 *
 * Generic support for custom fields:
 * @template TUserCustomFields - Custom fields added to User
 * @template TOrganizationCustomFields - Custom fields added to Organization
 * @template TOrganizationMembershipCustomFields - Custom fields added to OrganizationMembership
 *
 * Note: JSON adapter doesn't actually use custom fields types,
 * but maintains the same signature for consistency with other adapters
 */
export class JsonOrganizationMembershipRepository<
    TUserCustomFields = {},
    TOrganizationCustomFields = {},
    TOrganizationMembershipCustomFields = {}
> implements
        OrganizationMembershipRepository<
            TUserCustomFields,
            TOrganizationCustomFields,
            TOrganizationMembershipCustomFields
        >
{
    private readonly storage: JsonStorage<OrganizationMembershipJsonData>;
    private readonly userRepository: UserRepository<TUserCustomFields>;
    private readonly organizationRepository: OrganizationRepository<TOrganizationCustomFields>;

    constructor(
        userRepository: UserRepository<TUserCustomFields>,
        organizationRepository: OrganizationRepository<TOrganizationCustomFields>,
        dataDir: string = './data'
    ) {
        this.userRepository = userRepository;
        this.organizationRepository = organizationRepository;
        const filePath = join(dataDir, 'organization-memberships.json');
        this.storage = new JsonStorage<OrganizationMembershipJsonData>(filePath);
    }

    async insert(
        membership: OrganizationMembership & TOrganizationMembershipCustomFields,
        context?: OperationContext
    ): Promise<void> {
        // Note: JSON adapter ignores audit context as it doesn't support audit logging
        const jsonData = OrganizationMembershipMapper.toJson(membership);

        await this.storage.update((memberships) => {
            const existingIndex = memberships.findIndex((m) => m.id === membership.id);

            if (existingIndex >= 0) {
                // Update existing membership
                memberships[existingIndex] = jsonData;
            } else {
                // Add new membership
                memberships.push(jsonData);
            }

            return memberships;
        });
    }

    async findById(
        id: string
    ): Promise<(OrganizationMembership & TOrganizationMembershipCustomFields) | null> {
        const jsonData = await this.storage.findOne((membership) => membership.id === id);
        return jsonData
            ? (OrganizationMembershipMapper.toDomain(jsonData) as OrganizationMembership &
                  TOrganizationMembershipCustomFields)
            : null;
    }

    async findByUserIdAndOrganizationId(
        userId: string,
        organizationId: string
    ): Promise<(OrganizationMembership & TOrganizationMembershipCustomFields) | null> {
        const jsonData = await this.storage.findOne(
            (membership) =>
                membership.userId === userId && membership.organizationId === organizationId
        );
        return jsonData
            ? (OrganizationMembershipMapper.toDomain(jsonData) as OrganizationMembership &
                  TOrganizationMembershipCustomFields)
            : null;
    }

    async findByUsernameAndOrganizationId(
        username: string,
        organizationId: string
    ): Promise<(OrganizationMembership & TOrganizationMembershipCustomFields) | null> {
        const jsonData = await this.storage.findOne(
            (membership) =>
                membership.username === username && membership.organizationId === organizationId
        );
        return jsonData
            ? (OrganizationMembershipMapper.toDomain(jsonData) as OrganizationMembership &
                  TOrganizationMembershipCustomFields)
            : null;
    }

    async findByOrganization(
        organizationId: string,
        activeOnly?: boolean
    ): Promise<(OrganizationMembership & TOrganizationMembershipCustomFields)[]> {
        const jsonDataArray = await this.storage.findMany((membership) => {
            if (membership.organizationId !== organizationId) {
                return false;
            }

            if (activeOnly) {
                const joinedAt = membership.joinedAt ? new Date(membership.joinedAt) : undefined;
                const leftAt = membership.leftAt ? new Date(membership.leftAt) : undefined;
                const deletedAt = (membership as any).deletedAt
                    ? new Date((membership as any).deletedAt as any)
                    : undefined;
                const isActive = !!joinedAt && !leftAt && !deletedAt;
                if (!isActive) return false;
            }

            return true;
        });
        return OrganizationMembershipMapper.toDomainArray(
            jsonDataArray
        ) as (OrganizationMembership & TOrganizationMembershipCustomFields)[];
    }

    async findByUser(
        userId: string
    ): Promise<(OrganizationMembership & TOrganizationMembershipCustomFields)[]> {
        const jsonDataArray = await this.storage.findMany(
            (membership) => membership.userId === userId
        );
        return OrganizationMembershipMapper.toDomainArray(
            jsonDataArray
        ) as (OrganizationMembership & TOrganizationMembershipCustomFields)[];
    }

    async update(
        membership: OrganizationMembership & TOrganizationMembershipCustomFields,
        context?: OperationContext
    ): Promise<void> {
        // Note: JSON adapter ignores audit context as it doesn't support audit logging
        const jsonData = OrganizationMembershipMapper.toJson(membership);

        await this.storage.update((memberships) => {
            const existingIndex = memberships.findIndex((m) => m.id === membership.id);

            if (existingIndex >= 0) {
                memberships[existingIndex] = jsonData;
            }
            // If membership doesn't exist, we don't add it (update only)

            return memberships;
        });
    }

    async delete(id: string, context?: OperationContext): Promise<void> {
        // Note: JSON adapter ignores audit context as it doesn't support audit logging
        await this.storage.update((memberships) =>
            memberships.filter((membership) => membership.id !== id)
        );
    }

    async findByOrganizationWithUserInfo(
        organizationId: string,
        activeOnly?: boolean
    ): Promise<
        OrganizationMemberWithUserInfo<
            TUserCustomFields,
            TOrganizationCustomFields,
            TOrganizationMembershipCustomFields
        >[]
    > {
        // 1. Get memberships for the organization
        const jsonDataArray = await this.storage.findMany((membership) => {
            if (membership.organizationId !== organizationId) {
                return false;
            }

            if (activeOnly) {
                const joinedAt = membership.joinedAt ? new Date(membership.joinedAt) : undefined;
                const leftAt = membership.leftAt ? new Date(membership.leftAt) : undefined;
                const deletedAt = (membership as any).deletedAt
                    ? new Date((membership as any).deletedAt as any)
                    : undefined;
                const isActive = !!joinedAt && !leftAt && !deletedAt;
                if (!isActive) return false;
            }

            return true;
        });

        const memberships = OrganizationMembershipMapper.toDomainArray(jsonDataArray);

        // 2. Get user and organization information for each membership
        const membersWithUserInfo: OrganizationMemberWithUserInfo<
            TUserCustomFields,
            TOrganizationCustomFields,
            TOrganizationMembershipCustomFields
        >[] = [];

        for (const membership of memberships) {
            const user = await this.userRepository.findByUsername(membership.username);
            const organization = await this.organizationRepository.findById(
                membership.organizationId
            );

            if (user && organization) {
                // Return flat structure with membership fields spread at root
                membersWithUserInfo.push({
                    ...membership,
                    user,
                    organization
                } as OrganizationMemberWithUserInfo<
                    TUserCustomFields,
                    TOrganizationCustomFields,
                    TOrganizationMembershipCustomFields
                >);
            }
        }

        return membersWithUserInfo;
    }

    async findByOrganizationWithUserInfoPaginated(
        organizationId: string,
        options?: FindMembersOptions
    ): Promise<
        PaginatedResult<
            OrganizationMemberWithUserInfo<
                TUserCustomFields,
                TOrganizationCustomFields,
                TOrganizationMembershipCustomFields
            >
        >
    > {
        // Set defaults
        const page = options?.page || 1;
        const pageSize = options?.pageSize || 20;

        // Handle filter options
        const includeActive = options?.includeActive ?? false;
        const includePending = options?.includePending ?? false;
        const includeRemoved = options?.includeRemoved ?? false;

        // 1. Get memberships for the organization (all matching the filter)
        const allJsonDataArray = await this.storage.findMany((membership) => {
            if (membership.organizationId !== organizationId) {
                return false;
            }

            // Parse dates
            const invitedAt = membership.invitedAt ? new Date(membership.invitedAt) : undefined;
            const joinedAt = membership.joinedAt ? new Date(membership.joinedAt) : undefined;
            const leftAt = membership.leftAt ? new Date(membership.leftAt) : undefined;
            const deletedAt = (membership as any).deletedAt
                ? new Date((membership as any).deletedAt as any)
                : undefined;

            // Check combinable filter conditions
            if (includeActive || includePending || includeRemoved) {
                let matches = false;

                // Active members: joinedAt NOT NULL, leftAt NULL, deletedAt NULL
                if (includeActive && !!joinedAt && !leftAt && !deletedAt) {
                    matches = true;
                }

                // Pending invitations: invitedAt NOT NULL, joinedAt NULL, leftAt NULL, deletedAt NULL
                if (includePending && !!invitedAt && !joinedAt && !leftAt && !deletedAt) {
                    matches = true;
                }

                // Removed members: leftAt NOT NULL OR deletedAt NOT NULL
                if (includeRemoved && (!!leftAt || !!deletedAt)) {
                    matches = true;
                }

                return matches;
            }

            return true;
        });

        // Get total count before pagination
        const total = allJsonDataArray.length;
        const totalPages = Math.ceil(total / pageSize);

        // Apply pagination
        const offset = (page - 1) * pageSize;
        const paginatedJsonData = allJsonDataArray.slice(offset, offset + pageSize);

        const memberships = OrganizationMembershipMapper.toDomainArray(paginatedJsonData);

        // 2. Get user and organization information for each membership
        const items: OrganizationMemberWithUserInfo<
            TUserCustomFields,
            TOrganizationCustomFields,
            TOrganizationMembershipCustomFields
        >[] = [];

        for (const membership of memberships) {
            // For pending invitations without userId, create a minimal user object with username
            const user =
                (await this.userRepository.findByUsername(membership.username)) ||
                ({
                    id: membership.userId || '',
                    externalId: '',
                    username: membership.username,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    deletedAt: undefined
                } as any);

            const organization = await this.organizationRepository.findById(
                membership.organizationId
            );

            if (user && organization) {
                items.push({
                    ...membership,
                    user,
                    organization
                } as OrganizationMemberWithUserInfo<
                    TUserCustomFields,
                    TOrganizationCustomFields,
                    TOrganizationMembershipCustomFields
                >);
            }
        }

        return {
            items,
            total,
            page,
            pageSize,
            totalPages
        };
    }

    async findAll(): Promise<(OrganizationMembership & TOrganizationMembershipCustomFields)[]> {
        const jsonDataArray = await this.storage.findMany(() => true);
        return OrganizationMembershipMapper.toDomainArray(
            jsonDataArray
        ) as (OrganizationMembership & TOrganizationMembershipCustomFields)[];
    }

    /**
     * Link pending memberships (with username but no userId) to a registered user
     * Updates all memberships where username matches and userId is null
     */
    async linkUsernameMembershipsToUserId(
        username: string,
        userId: string,
        context?: OperationContext
    ): Promise<void> {
        // Note: JSON adapter ignores audit context as it doesn't support audit logging
        try {
            // Update all memberships with matching username and null userId
            await this.storage.update((memberships) =>
                memberships.map((membership) => {
                    // Only update if username matches and userId is null/undefined
                    if (
                        membership.username === username &&
                        (membership.userId === null || membership.userId === undefined)
                    ) {
                        return {
                            ...membership,
                            userId,
                            updatedAt: new Date().toISOString()
                        };
                    }
                    return membership;
                })
            );
        } catch (error: any) {
            throw new Error(`Failed to link username memberships to userId: ${error.message}`);
        }
    }
}
