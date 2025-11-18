import type {
    GetUserInput,
    IGetUser,
    OperationContext,
    ToolkitOptions,
    User
} from '@multitenantkit/domain-contracts';
import {
    type Adapters,
    type DomainError,
    GetUserInputSchema,
    UserSchema
} from '@multitenantkit/domain-contracts';
import type { z } from 'zod';
import type { Result } from '../../../shared/result/Result';
import { BaseUseCase } from '../../../shared/use-case';

/**
 * GetUser use case
 * Handles the business logic for retrieving a user by ID
 *
 * Generic support for custom fields:
 * @template TUserCustomFields - Custom fields added to User
 * @template TOrganizationCustomFields - Custom fields added to Organization (for toolkit options compatibility)
 * @template TOrganizationMembershipCustomFields - Custom fields added to OrganizationMembership (for toolkit options compatibility)
 */
export class GetUser<
        // biome-ignore lint/complexity/noBannedTypes: ignore
        TUserCustomFields = {},
        // biome-ignore lint/complexity/noBannedTypes: ignore
        TOrganizationCustomFields = {},
        // biome-ignore lint/complexity/noBannedTypes: ignore
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
        toolkitOptions?: ToolkitOptions<
            TUserCustomFields,
            TOrganizationCustomFields,
            TOrganizationMembershipCustomFields
        >
    ) {
        // Extract custom schema from toolkit options
        const customSchema = toolkitOptions?.users?.customFields?.customSchema as
            | z.ZodObject<any>
            | undefined;

        // Extend base schema with custom fields if provided
        const outputSchema = (customSchema
            ? UserSchema.merge(customSchema)
            : UserSchema) as unknown as z.ZodType<User & TUserCustomFields>;

        super(
            'user-getUser',
            adapters,
            toolkitOptions,
            GetUserInputSchema,
            outputSchema,
            'Failed to retrieve user'
        );
    }

    protected async executeBusinessLogic(
        input: GetUserInput,
        _context: OperationContext
    ): Promise<Result<User & TUserCustomFields, DomainError>> {
        // input.userId is actually an externalId from auth provider
        // Use helper to map externalId -> User entity
        const userResult = await this.getUserFromExternalId(input.principalExternalId);

        return userResult;
    }
}
