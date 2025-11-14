import type {
    FrameworkConfig,
    IUpdateUser,
    OperationContext,
    UpdateUserInput,
    User
} from '@multitenantkit/domain-contracts';
import {
    type Adapters,
    type ConflictError,
    type NotFoundError,
    UpdateUserInputSchema,
    UserSchema,
    ValidationError
} from '@multitenantkit/domain-contracts';
import { z } from 'zod';
import { Result } from '../../../shared/result';
import { BaseUseCase, UseCaseHelpers } from '../../../shared/use-case';

/**
 * UpdateUser use case
 * Handles the business logic for updating a user's profile
 *
 * Generic support for custom fields:
 * @template TUserCustomFields - Custom fields added to User
 * @template TOrganizationCustomFields - Custom fields added to Organization (for framework config compatibility)
 * @template TOrganizationMembershipCustomFields - Custom fields added to OrganizationMembership (for framework config compatibility)
 */
export class UpdateUser<
        // biome-ignore lint/complexity/noBannedTypes: ignore
        TUserCustomFields = {},
        // biome-ignore lint/complexity/noBannedTypes: ignore
        TOrganizationCustomFields = {},
        // biome-ignore lint/complexity/noBannedTypes: ignore
        TOrganizationMembershipCustomFields = {}
    >
    extends BaseUseCase<
        UpdateUserInput & TUserCustomFields,
        User & TUserCustomFields,
        ValidationError | NotFoundError | ConflictError,
        TUserCustomFields,
        TOrganizationCustomFields,
        TOrganizationMembershipCustomFields
    >
    implements IUpdateUser
{
    private readonly customSchema?: z.ZodObject<any>;

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

        // Extend base input schema with custom fields if provided
        // Using .and() instead of .merge() because UpdateUserInputSchema uses .refine() (ZodEffects)
        const inputSchema = (
            (customSchema
                ? UpdateUserInputSchema.and(customSchema.partial())
                : UpdateUserInputSchema) as unknown as z.ZodType<
                UpdateUserInput & TUserCustomFields
            >
        ).refine(
            (data: any) => {
                // At least one field must be provided
                return Object.keys(data).length > 0;
            },
            {
                message: 'At least one field must be provided for update',
                path: ['root']
            }
        );

        super(
            'user-updateUser',
            adapters,
            frameworkConfig,
            inputSchema,
            z.any(), // No validation needed for output - domain entities are already type-safe
            'Failed to update user profile'
        );

        // Store custom schema for use in executeBusinessLogic
        this.customSchema = customSchema;
    }

    protected async executeBusinessLogic(
        input: UpdateUserInput & TUserCustomFields,
        context: OperationContext
    ): Promise<Result<User & TUserCustomFields, ValidationError | NotFoundError | ConflictError>> {
        // 2. Get existing user by externalId
        const getUserResult = await this.getUserFromExternalId(input.principalExternalId);
        if (getUserResult.isFailure) {
            return Result.fail(getUserResult.getError());
        }
        const existingUser = getUserResult.getValue();

        // 3. Build updated user data
        const now = this.adapters.system.clock.now();

        // Filter out undefined values from input to preserve existing values
        const definedInputFields = Object.fromEntries(
            Object.entries(input).filter(([_, value]) => value !== undefined)
        ) as Partial<UpdateUserInput & TUserCustomFields>;

        // Merge existing user with defined input fields
        const updatedUserData: User & TUserCustomFields = {
            ...existingUser,
            ...definedInputFields,
            updatedAt: now
        };

        // Validate the merged data with custom schema if provided
        const validationSchema = this.customSchema
            ? UserSchema.strip().and(this.customSchema.strip())
            : UserSchema.strip();

        const validationResult = validationSchema.safeParse(updatedUserData);
        if (!validationResult.success) {
            const firstError = validationResult.error.errors[0];
            return Result.fail(new ValidationError(firstError.message, firstError.path.join('.')));
        }

        // Use validated and potentially transformed data from Zod
        const updatedUser = validationResult.data as User & TUserCustomFields;

        // 4. Persist the updated user using Unit of Work (transaction) with audit context
        const auditContext = UseCaseHelpers.enrichAuditContext(
            context,
            'UPDATE_USER_PROFILE',
            undefined // Users don't belong directly to a organization
        );

        await this.adapters.persistence.uow.transaction(async (repos) => {
            await repos.users.update(updatedUser, auditContext);
        });

        // 5. Return updated user
        return Result.ok(updatedUser);
    }
}
