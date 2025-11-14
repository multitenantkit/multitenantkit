import {
    createPrincipal,
    type FrameworkConfig,
    type Principal,
    type User,
    UserSchema
} from '@multitenantkit/domain-contracts';
import type { z } from 'zod';

/**
 * Builder pattern for creating User test instances (contracts-based)
 * Supports extending with custom fields using the framework config custom schema
 */

// biome-ignore lint/complexity/noBannedTypes: ignore
export class UserBuilder<TUserCustomFields = {}> {
    private id: string = '00000001-0000-4000-8000-000000010000';
    private externalId: string = '00000001-0000-4000-8000-000000010001'; // Auth provider ID
    private username: string = 'testuser@example.com'; // Default username
    private createdAt: Date = new Date('2025-01-01T10:00:00.000Z');
    private updatedAt: Date = this.createdAt;
    private deletedAt: Date | undefined = undefined;
    private customFields: TUserCustomFields = {} as TUserCustomFields;

    withId(id: string): this {
        this.id = id;
        return this;
    }

    withExternalId(externalId: string): this {
        this.externalId = externalId;
        return this;
    }

    withUsername(username: string): this {
        this.username = username;
        return this;
    }

    withCreatedAt(createdAt: Date): this {
        this.createdAt = createdAt;
        // Keep updatedAt in sync by default in tests
        this.updatedAt = createdAt;
        return this;
    }

    withUpdatedAt(updatedAt: Date): this {
        this.updatedAt = updatedAt;
        return this;
    }

    withDeletedAt(deletedAt: Date | undefined): this {
        this.deletedAt = deletedAt ?? undefined;
        return this;
    }

    withCustomFields(customFields: TUserCustomFields): this {
        this.customFields = customFields;
        return this;
    }

    /**
     * Build a plain User object validated against the contracts schema, optionally
     * merged with a custom schema from the framework config.
     */
    build(
        frameworkConfig?: FrameworkConfig<TUserCustomFields, any, any>
    ): User & TUserCustomFields {
        const customSchema = frameworkConfig?.users?.customFields?.customSchema as
            | z.ZodObject<any>
            | undefined;

        const outputSchema = (customSchema
            ? UserSchema.merge(customSchema)
            : UserSchema) as unknown as z.ZodType<User & TUserCustomFields>;

        const candidate: unknown = {
            id: this.id,
            externalId: this.externalId,
            username: this.username,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
            deletedAt: this.deletedAt,
            ...(this.customFields as Record<string, unknown>)
        };

        const parsed = outputSchema.safeParse(candidate);
        if (!parsed.success) {
            const issues = parsed.error.issues.map((i) => i.message).join(', ');
            throw new Error(`Failed to build User: ${issues}`);
        }
        return parsed.data;
    }
}

/**
 * Builder pattern for creating Principal test instances
 */
export class PrincipalBuilder {
    private authProviderId: string = '00000001-0000-4000-8000-000000010001'; // Auth provider ID

    withAuthProviderId(authProviderId: string): PrincipalBuilder {
        this.authProviderId = authProviderId;
        return this;
    }

    // Deprecated: Use withAuthProviderId instead
    withUserId(userId: string): PrincipalBuilder {
        this.authProviderId = userId;
        return this;
    }

    build(): Principal {
        return createPrincipal(this.authProviderId);
    }
}

/**
 * Convenience functions for common test scenarios
 */
export const TestData = {
    // biome-ignore lint/complexity/noBannedTypes: ignore
    user: <TUserCustomFields = {}>() => new UserBuilder<TUserCustomFields>(),
    principal: () => new PrincipalBuilder(),

    // Common scenarios
    ownerUser: () =>
        new UserBuilder()
            .withId('00000005-0000-4000-8000-000000050000')
            .withExternalId('00000005-0000-4000-8000-000000050001')
            .withCreatedAt(new Date('2025-01-01T10:00:00.000Z')),
    adminUser: () =>
        new UserBuilder()
            .withId('00000007-0000-4000-8000-000000070000')
            .withExternalId('00000007-0000-4000-8000-000000070001'),
    memberUser: () =>
        new UserBuilder()
            .withId('00000008-0000-4000-8000-000000080000')
            .withExternalId('00000008-0000-4000-8000-000000080001')
};
