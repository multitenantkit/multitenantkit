import type { Adapters } from '@multitenantkit/domain-contracts';
import type { FindMembersOptions } from '@multitenantkit/domain-contracts/organization-memberships';
import { OrganizationMembershipSchema } from '@multitenantkit/domain-contracts/organization-memberships';
import type { IListOrganizationMembers } from '@multitenantkit/domain-contracts/organizations';
import {
    ListOrganizationMembersInputSchema,
    OrganizationSchema
} from '@multitenantkit/domain-contracts/organizations';
import type { OperationContext, ToolkitOptions } from '@multitenantkit/domain-contracts/shared';
import {
    type DomainError,
    NotFoundError,
    UnauthorizedError,
    ValidationError
} from '@multitenantkit/domain-contracts/shared/errors/index';
import { UserSchema } from '@multitenantkit/domain-contracts/users';
import { z } from 'zod';
import { Result } from '../../../shared/result/Result';
import { BaseUseCase } from '../../../shared/use-case';

/**
 * Helper to merge base Zod object with optional custom-fields Zod object.
 * If custom schema is provided, it merges with base schema (custom fields win on conflicts).
 * If custom schema is wrapped in ZodEffects, unwraps it first.
 */
const mergeCF = <S extends z.AnyZodObject>(base: S, cf?: z.AnyZodObject): z.AnyZodObject => {
    if (!cf) return base;

    // Unwrap ZodEffects if present
    const unwrapped = (cf as any)._def?.schema ?? cf;

    return base.merge(unwrapped) as z.AnyZodObject;
};

/**
 * ListOrganizationMembers use case
 * Handles business logic for listing organization members with optional status filter
 *
 * Generic support for custom fields:
 * @template UCF - Zod schema for User custom fields (default: empty object schema)
 * @template TCF - Zod schema for Organization custom fields (default: empty object schema)
 * @template MCF - Zod schema for OrganizationMembership custom fields (default: empty object schema)
 */
export class ListOrganizationMembers<
        // biome-ignore lint/complexity/noBannedTypes: ignore
        UCF extends z.AnyZodObject = z.ZodObject<{}>,
        // biome-ignore lint/complexity/noBannedTypes: ignore
        TCF extends z.AnyZodObject = z.ZodObject<{}>,
        // biome-ignore lint/complexity/noBannedTypes: ignore
        MCF extends z.AnyZodObject = z.ZodObject<{}>
    >
    extends BaseUseCase<
        // Input type
        z.infer<typeof ListOrganizationMembersInputSchema>,
        // Output type - paginated result with items and pagination metadata
        {
            items: Array<
                (z.infer<typeof OrganizationMembershipSchema> & z.infer<MCF>) & {
                    user: (z.infer<typeof UserSchema> & z.infer<UCF>) | null;
                    organization: z.infer<typeof OrganizationSchema> & z.infer<TCF>;
                }
            >;
            pagination: {
                total: number;
                page: number;
                pageSize: number;
                totalPages: number;
            };
        },
        DomainError,
        z.infer<UCF>,
        z.infer<TCF>,
        z.infer<MCF>
    >
    implements IListOrganizationMembers
{
    constructor(
        adapters: Adapters<z.infer<UCF>, z.infer<TCF>, z.infer<MCF>>,
        toolkitOptions?: ToolkitOptions<z.infer<UCF>, z.infer<TCF>, z.infer<MCF>>
    ) {
        // 1) Read optional custom-field schemas from toolkitOptions
        const userCF = toolkitOptions?.users?.customFields?.customSchema as UCF | undefined;
        const organizationCF = toolkitOptions?.organizations?.customFields?.customSchema as
            | TCF
            | undefined;
        const membershipCF = toolkitOptions?.organizationMemberships?.customFields?.customSchema as
            | MCF
            | undefined;

        // 2) Merge base + custom schemas (custom wins on conflicting keys)
        const UserWithCF = mergeCF(UserSchema, userCF);
        const OrganizationWithCF = mergeCF(OrganizationSchema, organizationCF);
        const MembershipWithCF = mergeCF(OrganizationMembershipSchema, membershipCF);

        // 3) Build the final member schema including nested user/organization with their customs
        const MemberWithAll = MembershipWithCF.extend({
            user: UserWithCF.nullable(),
            organization: OrganizationWithCF
        });

        // 4) Output schema is paginated result with items array and pagination metadata
        const OutputSchema = z.object({
            items: z.array(MemberWithAll),
            pagination: z.object({
                total: z.number().int().min(0),
                page: z.number().int().min(1),
                pageSize: z.number().int().min(1),
                totalPages: z.number().int().min(0)
            })
        });

        super(
            'organization-listOrganizationMembers',
            adapters,
            toolkitOptions,
            ListOrganizationMembersInputSchema as any,
            OutputSchema as any,
            'Failed to list organization members'
        );
    }

    protected async executeBusinessLogic(
        input: z.infer<typeof ListOrganizationMembersInputSchema>,
        _context: OperationContext
    ): Promise<
        Result<
            {
                items: Array<
                    (z.infer<typeof OrganizationMembershipSchema> & z.infer<MCF>) & {
                        user: z.infer<typeof UserSchema> & z.infer<UCF>;
                        organization: z.infer<typeof OrganizationSchema> & z.infer<TCF>;
                    }
                >;
                pagination: {
                    total: number;
                    page: number;
                    pageSize: number;
                    totalPages: number;
                };
            },
            DomainError
        >
    > {
        // 1. Validate organization exists
        const organization = await this.adapters.persistence.organizationRepository.findById(
            input.organizationId
        );
        if (!organization) {
            return Result.fail(new NotFoundError('Organization', input.organizationId));
        }

        const getUserResult = await this.getUserFromExternalId(input.principalExternalId);

        if (getUserResult.isFailure) {
            return Result.fail(getUserResult.getError());
        }

        const existingUser = getUserResult.getValue();

        // 2. Validate user has access to organization (must be a member or owner)
        const userMembership =
            await this.adapters.persistence.organizationMembershipRepository.findByUserIdAndOrganizationId(
                existingUser.id,
                input.organizationId
            );

        const isOwner = organization.ownerUserId === existingUser.id;
        const isAdmin =
            !!userMembership &&
            userMembership.roleCode === 'admin' &&
            !!userMembership.joinedAt &&
            !userMembership.leftAt &&
            !userMembership.deletedAt;
        const isActiveMember =
            !!userMembership &&
            !!userMembership.joinedAt &&
            !userMembership.leftAt &&
            !userMembership.deletedAt;

        if (!isOwner && !isActiveMember) {
            return Result.fail(
                new UnauthorizedError('Only organization members can view organization members')
            );
        }

        // 3. Apply role-based filtering
        // - Members: can only see active members
        // - Admins and Owners: can see all (active + pending + removed)
        const filterOptions: FindMembersOptions = { ...input.options };

        if (isOwner || isAdmin) {
            // Owners and admins can see all member statuses if not specified
            if (
                !filterOptions.includeActive &&
                !filterOptions.includePending &&
                !filterOptions.includeRemoved
            ) {
                filterOptions.includeActive = true;
                filterOptions.includePending = true;
                filterOptions.includeRemoved = true;
            }
        } else {
            // Regular members can only see active members
            filterOptions.includeActive = true;
            filterOptions.includePending = false;
            filterOptions.includeRemoved = false;
        }

        // 4. Get organization members with user information (paginated)
        try {
            const paginatedResult =
                await this.adapters.persistence.organizationMembershipRepository.findByOrganizationWithUserInfoPaginated(
                    input.organizationId,
                    filterOptions
                );

            // 4. Transform items and return paginated result
            // Note: membersWithUserInfo has flat structure with membership fields at root + nested user/organization
            const transformedItems = paginatedResult.items.map((memberInfo) => ({
                ...memberInfo, // Spread all fields (membership + user + organization + custom fields)
                joinedAt: memberInfo.joinedAt ?? undefined,
                leftAt: memberInfo.leftAt ?? undefined
            })) as any;

            const output = {
                items: transformedItems,
                pagination: {
                    total: paginatedResult.total,
                    page: paginatedResult.page,
                    pageSize: paginatedResult.pageSize,
                    totalPages: paginatedResult.totalPages
                }
            };

            return Result.ok(output);
        } catch (error) {
            return Result.fail(
                new ValidationError('Failed to list organization members', undefined, {
                    originalError: error
                })
            );
        }
    }
}
