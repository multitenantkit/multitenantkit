import { z } from 'zod';
import type {
    OperationContext,
    GetUserInput,
    IGetUser,
    User,
    FrameworkConfig
} from '@multitenantkit/domain-contracts';
import {
    Adapters,
    UserSchema,
    GetUserInputSchema,
    DomainError
} from '@multitenantkit/domain-contracts';
import { Result } from '../../../shared/result/Result';
import { BaseUseCase } from '../../../shared/use-case';

/**
 * GetUser use case
 * Handles the business logic for retrieving a user by ID
 *
 * Generic support for custom fields:
 * @template TUserCustomFields - Custom fields added to User
 * @template TOrganizationCustomFields - Custom fields added to Organization (for framework config compatibility)
 * @template TOrganizationMembershipCustomFields - Custom fields added to OrganizationMembership (for framework config compatibility)
 */
export class GetUser<
        TUserCustomFields = {},
        TOrganizationCustomFields = {},
        TOrganizationMembershipCustomFields = {}
    >
    extends BaseUseCase<
        GetUserInput,
        User & TUserCustomFields,
        DomainError,
        TUserCustomFields,
        TOrganizationCustomFields,
        TOrganizationMembershipCustomFields
    >
    implements IGetUser
{
    constructor(
        adapters: Adapters<
            TUserCustomFields,
            TOrganizationCustomFields,
            TOrganizationMembershipCustomFields
        >,
        frameworkConfig?: FrameworkConfig<
            TUserCustomFields,
            TOrganizationCustomFields,
            TOrganizationMembershipCustomFields
        >
    ) {
        // Extract custom schema from framework config
        const customSchema = frameworkConfig?.users?.customFields?.customSchema as
            | z.ZodObject<any>
            | undefined;

        // Extend base schema with custom fields if provided
        const outputSchema = (customSchema
            ? UserSchema.merge(customSchema)
            : UserSchema) as unknown as z.ZodType<User & TUserCustomFields>;

        super(
            'user-getUser',
            adapters,
            frameworkConfig,
            GetUserInputSchema,
            outputSchema,
            'Failed to retrieve user'
        );
    }

    protected async executeBusinessLogic(
        input: GetUserInput,
        context: OperationContext
    ): Promise<Result<User & TUserCustomFields, DomainError>> {
        // input.userId is actually an externalId from auth provider
        // Use helper to map externalId -> User entity
        const userResult = await this.getUserFromExternalId(input.principalExternalId);

        if (userResult.isSuccess) {
            const user = userResult.getValue();

            // Fire-and-forget: Link any pending memberships to this user
            // This happens asynchronously without blocking the response
            this.adapters.persistence.organizationMembershipRepository
                .linkUsernameMembershipsToUserId(user.username, user.id, context)
                .catch((error) => {
                    // Log error but don't fail the request
                    console.warn('Failed to link pending memberships:', error);
                });
        }

        return userResult;
    }
}
