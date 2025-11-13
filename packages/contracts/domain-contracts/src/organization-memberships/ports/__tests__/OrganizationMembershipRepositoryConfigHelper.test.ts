import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { OrganizationMembershipRepositoryConfigHelper } from '../OrganizationMembershipRepositoryConfigHelper';
import type { OrganizationMembershipCustomFieldsConfig } from '../OrganizationMembershipCustomFieldsConfig';

describe('OrganizationMembershipRepositoryConfigHelper - namingStrategy', () => {
    describe('Default behavior (snake_case)', () => {
        it('should use snake_case by default (SQL database convention)', () => {
            const schema = z.object({
                invitedBy: z.string().uuid(),
                invitationMessage: z.string().optional()
            });

            const config: OrganizationMembershipCustomFieldsConfig<any> = {
                customSchema: schema
            };

            const helper = new OrganizationMembershipRepositoryConfigHelper(config);

            expect(helper.namingStrategy).toBe('snake_case');
            expect(helper.hasCustomFields).toBe(true);

            const fields: any = {
                invitedBy: '123e4567-e89b-12d3-a456-426614174000',
                invitationMessage: 'Welcome!'
            };

            const dbFields = helper.customFieldsToDb(fields);

            expect(dbFields).toEqual({
                invited_by: '123e4567-e89b-12d3-a456-426614174000',
                invitation_message: 'Welcome!'
            });
        });
    });

    describe('snake_case transformation', () => {
        it('should transform to snake_case when specified', () => {
            const schema = z.object({
                invitedBy: z.string().uuid(),
                invitationMessage: z.string().optional(),
                department: z.string().optional()
            });

            const config: OrganizationMembershipCustomFieldsConfig<any> = {
                customSchema: schema
            };

            const helper = new OrganizationMembershipRepositoryConfigHelper(config, 'snake_case'); // database.namingStrategy

            const fields: any = {
                invitedBy: '123e4567-e89b-12d3-a456-426614174000',
                invitationMessage: 'Welcome to the team!',
                department: 'Engineering'
            };

            const dbFields = helper.customFieldsToDb(fields);

            expect(dbFields).toEqual({
                invited_by: '123e4567-e89b-12d3-a456-426614174000',
                invitation_message: 'Welcome to the team!',
                department: 'Engineering'
            });
        });

        it('should reverse transform from snake_case to camelCase (toDomain)', () => {
            const schema = z.object({
                invitedBy: z.string().uuid(),
                invitationMessage: z.string().optional()
            });

            const config: OrganizationMembershipCustomFieldsConfig<any> = {
                customSchema: schema
            };

            const helper = new OrganizationMembershipRepositoryConfigHelper(config, 'snake_case'); // database.namingStrategy

            const dbRow = {
                invited_by: '123e4567-e89b-12d3-a456-426614174000',
                invitation_message: 'Welcome!'
            };

            const domainFields = helper.customFieldsToDomain(dbRow);

            expect(domainFields).toEqual({
                invitedBy: '123e4567-e89b-12d3-a456-426614174000',
                invitationMessage: 'Welcome!'
            });
        });
    });

    describe('Combination: namingStrategy + customMapper', () => {
        it('should combine namingStrategy with customMapper for JSON serialization', () => {
            const schema = z.object({
                invitedBy: z.string().uuid(),
                invitationMessage: z.string().optional(),
                department: z.string().optional(),
                permissions: z.array(z.string())
            });

            const config: OrganizationMembershipCustomFieldsConfig<any> = {
                customSchema: schema,
                namingStrategy: 'camelCase', // Keep camelCase for most fields
                customMapper: {
                    toDb: (fields) => ({
                        // Serialize array to JSON
                        permissionsJson: JSON.stringify(fields.permissions)
                    }),
                    toDomain: (dbRow) => ({
                        invitedBy: dbRow.invitedBy,
                        invitationMessage: dbRow.invitationMessage,
                        department: dbRow.department,
                        permissions: JSON.parse(dbRow.permissionsJson || '[]')
                    })
                }
            };

            const helper = new OrganizationMembershipRepositoryConfigHelper(config);

            const fields: any = {
                invitedBy: '123e4567-e89b-12d3-a456-426614174000',
                invitationMessage: 'Welcome!',
                department: 'Engineering',
                permissions: ['read', 'write', 'admin']
            };

            const dbFields = helper.customFieldsToDb(fields);

            // customMapper has complete precedence (no merge with namingStrategy)
            // Only customMapper fields are returned
            expect(dbFields).toMatchObject({
                permissionsJson: '["read","write","admin"]'
            });
        });

        it('should deserialize JSON array in toDomain', () => {
            const schema = z.object({
                invitedBy: z.string().uuid(),
                permissions: z.array(z.string())
            });

            const config: OrganizationMembershipCustomFieldsConfig<any> = {
                customSchema: schema,
                customMapper: {
                    toDb: (fields) => ({
                        permissionsJson: JSON.stringify(fields.permissions)
                    }),
                    toDomain: (dbRow) => ({
                        invitedBy: dbRow.invitedBy,
                        permissions: JSON.parse(dbRow.permissionsJson || '[]')
                    })
                }
            };

            const helper = new OrganizationMembershipRepositoryConfigHelper(config);

            const dbRow = {
                invitedBy: '123e4567-e89b-12d3-a456-426614174000',
                invited_by: 'ignored', // If both exist, camelCase from schema is used
                permissionsJson: '["read","write"]'
            };

            const domainFields = helper.customFieldsToDomain(dbRow);

            expect(domainFields).toEqual({
                invitedBy: '123e4567-e89b-12d3-a456-426614174000',
                permissions: ['read', 'write']
            });
        });
    });

    describe('Optional fields', () => {
        it('should handle optional fields correctly', () => {
            const schema = z.object({
                invitedBy: z.string().uuid(),
                invitationMessage: z.string().optional(),
                department: z.string().optional()
            });

            const config: OrganizationMembershipCustomFieldsConfig<any> = {
                customSchema: schema
            };

            const helper = new OrganizationMembershipRepositoryConfigHelper(config, 'snake_case'); // database.namingStrategy

            // Without optional fields
            const fields: any = {
                invitedBy: '123e4567-e89b-12d3-a456-426614174000'
            };

            const dbFields = helper.customFieldsToDb(fields);
            expect(dbFields).toEqual({
                invited_by: '123e4567-e89b-12d3-a456-426614174000'
            });
            expect(dbFields).not.toHaveProperty('invitation_message');
            expect(dbFields).not.toHaveProperty('department');
        });
    });
});
