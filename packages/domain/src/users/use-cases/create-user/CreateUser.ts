import { z } from 'zod';
import type {
    CreateUserInput,
    CreateUserOutput,
    ICreateUser,
    User
} from '@multitenantkit/domain-contracts/users';
import {
    CreateUserInputSchema,
    CreateUserOutputSchema,
    UserSchema
} from '@multitenantkit/domain-contracts/users';
import { Result } from '../../../shared/result/Result';
import {
    DomainError,
    ValidationError,
    ConflictError
} from '@multitenantkit/domain-contracts/shared/errors/index';
import type { OperationContext, FrameworkConfig } from '@multitenantkit/domain-contracts/shared';
import { Adapters } from '@multitenantkit/domain-contracts';
import { BaseUseCase } from '../../../shared/use-case';

/**
 * CreateUser use case
 * Handles the business logic for creating a new user
 *
 * Generic support for custom fields:
 * @template TUserCustomFields - Custom fields added to User
 * @template TOrganizationCustomFields - Custom fields added to Organization (for framework config compatibility)
 * @template TOrganizationMembershipCustomFields - Custom fields added to OrganizationMembership (for framework config compatibility)
 */
export class CreateUser<
        TUserCustomFields = {},
        TOrganizationCustomFields = {},
        TOrganizationMembershipCustomFields = {}
    >
    extends BaseUseCase<
        CreateUserInput & TUserCustomFields,
        CreateUserOutput,
        DomainError,
        TUserCustomFields,
        TOrganizationCustomFields,
        TOrganizationMembershipCustomFields
    >
    implements ICreateUser
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
        const customSchema = frameworkConfig?.users?.customFields?.customSchema as
            | z.ZodObject<any>
            | undefined;

        // Build input schema with custom fields if provided
        const inputSchema = (customSchema
            ? CreateUserInputSchema.and(customSchema.partial())
            : CreateUserInputSchema) as unknown as z.ZodType<CreateUserInput & TUserCustomFields>;

        // Output is a User; merge custom fields if provided
        const outputSchema = (customSchema
            ? CreateUserOutputSchema.merge(customSchema)
            : CreateUserOutputSchema) as unknown as z.ZodType<CreateUserOutput>;

        super(
            'user-createUser',
            adapters,
            frameworkConfig,
            inputSchema,
            outputSchema,
            'Failed to create user'
        );

        this.customSchema = customSchema;
    }

    protected async executeBusinessLogic(
        input: CreateUserInput & TUserCustomFields,
        context: OperationContext
    ): Promise<Result<CreateUserOutput, DomainError>> {
        if (input.externalId) {
            const existingUser = await this.adapters.persistence.userRepository.findByExternalId(
                input.externalId
            );
            if (existingUser) {
                return Result.fail(
                    new ConflictError('User', input.externalId, {
                        reason: 'External ID already registered'
                    })
                );
            }
        }

        // 2. Generate ID, externalId and timestamp
        const userId = input.id ?? this.adapters.system.uuid.generate();
        const externalId = input.externalId ?? userId; // If externalId is not provided, use userId as externalId
        const now = this.adapters.system.clock.now();

        // 3. Create User data with custom fields
        const user: User & TUserCustomFields = {
            ...(input as any),
            id: userId,
            externalId,
            username: input.username, // username is required in input
            createdAt: now,
            updatedAt: now
        };

        // 4. Validate the user data with custom schema if provided
        const validationSchema = this.customSchema
            ? UserSchema.strip().and(this.customSchema.strip())
            : UserSchema.strip();
        const validationResult = validationSchema.safeParse(user);
        if (!validationResult.success) {
            const firstError = validationResult.error.errors[0];
            return Result.fail(new ValidationError(firstError.message, firstError.path.join('.')));
        }
        const validatedUser = validationResult.data as User & TUserCustomFields;

        // 5. Persist the user using Unit of Work (transaction) with audit context
        const auditContext: OperationContext = {
            ...context,
            organizationId: undefined, // Users don't belong directly to a organization
            auditAction: 'CREATE_USER'
        };

        try {
            await this.adapters.persistence.uow.transaction(async (repos) => {
                await repos.users.insert(validatedUser, auditContext);
            });
        } catch (error) {
            return Result.fail(
                new ValidationError('Failed to save user', undefined, {
                    originalError: error
                })
            );
        }

        // 6. Return success response; BaseUseCase will parse output
        return Result.ok({ ...(validatedUser as any) } as CreateUserOutput);
    }
}
