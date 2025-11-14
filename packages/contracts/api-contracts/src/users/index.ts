import { UserSchema } from '@multitenantkit/domain-contracts';
import { z } from 'zod';

// Create User
export const CreateUserRequestSchema = z.object({
    body: UserSchema.pick({
        externalId: true,
        username: true
    })
});

// Update User Profile
export const UpdateUserRequestSchema = z.object({
    body: UserSchema.pick({})
});

// List User Organizations
export const ListUserOrganizationsRequestSchema = z.object({});

// Delete User (soft delete)
export const DeleteUserRequestSchema = z.object({});

// Type exports
export type CreateUserRequest = z.infer<typeof CreateUserRequestSchema>;
export type UpdateUserRequest = z.infer<typeof UpdateUserRequestSchema>;
export type ListUserOrganizationsRequest = z.infer<typeof ListUserOrganizationsRequestSchema>;
export type DeleteUserRequest = z.infer<typeof DeleteUserRequestSchema>;
