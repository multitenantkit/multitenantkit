import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import type { User } from '../../entities';
import type { UserCustomFieldsConfig } from '../UserCustomFieldsConfig';
import { UserRepositoryConfigHelper } from '../UserRepositoryConfigHelper';

describe('UserRepositoryConfigHelper - namingStrategy', () => {
    describe('Default behavior (snake_case)', () => {
        it('should use snake_case by default (SQL database convention)', () => {
            const schema = z.object({
                firstName: z.string(),
                lastName: z.string(),
                phoneNumber: z.string().optional()
            });

            const config: UserCustomFieldsConfig<any> = {
                customSchema: schema
            };

            const helper = new UserRepositoryConfigHelper(config);

            expect(helper.namingStrategy).toBe('snake_case');
            expect(helper.hasCustomFields).toBe(true);

            // Test toDb transformation
            const fields = {
                id: '123',
                externalId: 'ext-123',
                username: 'testuser',
                firstName: 'John',
                lastName: 'Doe',
                phoneNumber: '555-1234',
                createdAt: new Date(),
                updatedAt: new Date()
            };

            const dbFields = helper.customFieldsToDb(fields);

            // snake_case: transforms camelCase to snake_case
            expect(dbFields).toEqual({
                first_name: 'John',
                last_name: 'Doe',
                phone_number: '555-1234'
            });
        });

        it('should handle fields not in schema', () => {
            const schema = z.object({
                firstName: z.string(),
                lastName: z.string()
            });

            const config: UserCustomFieldsConfig<any> = {
                customSchema: schema
            };

            const helper = new UserRepositoryConfigHelper(config);

            const fields = {
                id: '123',
                externalId: 'ext-123',
                username: 'testuser',
                firstName: 'John',
                lastName: 'Doe',
                unknownField: 'should not appear', // Not in schema
                createdAt: new Date(),
                updatedAt: new Date()
            };

            const dbFields = helper.customFieldsToDb(fields);

            expect(dbFields).toEqual({
                first_name: 'John',
                last_name: 'Doe'
            });
            expect(dbFields).not.toHaveProperty('unknownField');
        });
    });

    describe('snake_case transformation', () => {
        it('should transform to snake_case when specified', () => {
            const schema = z.object({
                firstName: z.string(),
                lastName: z.string(),
                phoneNumber: z.string().optional()
            });

            const config: UserCustomFieldsConfig<any> = {
                customSchema: schema
            };

            const helper = new UserRepositoryConfigHelper(config, 'snake_case'); // database.namingStrategy

            expect(helper.namingStrategy).toBe('snake_case');

            const fields = {
                id: '123',
                externalId: 'ext-123',
                username: 'testuser',
                firstName: 'John',
                lastName: 'Doe',
                phoneNumber: '555-1234',
                createdAt: new Date(),
                updatedAt: new Date()
            };

            const dbFields = helper.customFieldsToDb(fields);

            // snake_case transformation
            expect(dbFields).toEqual({
                first_name: 'John',
                last_name: 'Doe',
                phone_number: '555-1234'
            });
        });

        it('should reverse transform from snake_case to camelCase (toDomain)', () => {
            const schema = z.object({
                firstName: z.string(),
                lastName: z.string(),
                phoneNumber: z.string().optional()
            });

            const config: UserCustomFieldsConfig<any> = {
                customSchema: schema
            };

            const helper = new UserRepositoryConfigHelper(config, 'snake_case'); // database.namingStrategy

            const dbRow = {
                id: '123',
                external_id: 'ext-123',
                username: 'testuser',
                first_name: 'John',
                last_name: 'Doe',
                phone_number: '555-1234',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            const domainFields = helper.customFieldsToDomain(dbRow);

            expect(domainFields).toEqual({
                firstName: 'John',
                lastName: 'Doe',
                phoneNumber: '555-1234'
            });
        });
    });

    describe('kebab-case transformation', () => {
        it('should transform to kebab-case when specified', () => {
            const schema = z.object({
                firstName: z.string(),
                lastName: z.string(),
                phoneNumber: z.string().optional()
            });

            const config: UserCustomFieldsConfig<any> = {
                customSchema: schema
            };

            const helper = new UserRepositoryConfigHelper(config, 'kebab-case'); // database.namingStrategy

            expect(helper.namingStrategy).toBe('kebab-case');

            const fields: Partial<User & any> = {
                firstName: 'John',
                lastName: 'Doe',
                phoneNumber: '555-1234'
            };

            const dbFields = helper.customFieldsToDb(fields);

            expect(dbFields).toEqual({
                'first-name': 'John',
                'last-name': 'Doe',
                'phone-number': '555-1234'
            });
        });

        it('should reverse transform from kebab-case to camelCase (toDomain)', () => {
            const schema = z.object({
                firstName: z.string(),
                lastName: z.string()
            });

            const config: UserCustomFieldsConfig<any> = {
                customSchema: schema
            };

            const helper = new UserRepositoryConfigHelper(config, 'kebab-case'); // database.namingStrategy

            const dbRow = {
                'first-name': 'John',
                'last-name': 'Doe'
            };

            const domainFields = helper.customFieldsToDomain(dbRow);

            expect(domainFields).toEqual({
                firstName: 'John',
                lastName: 'Doe'
            });
        });
    });

    describe('PascalCase transformation', () => {
        it('should transform to PascalCase when specified', () => {
            const schema = z.object({
                firstName: z.string(),
                lastName: z.string(),
                phoneNumber: z.string().optional()
            });

            const config: UserCustomFieldsConfig<any> = {
                customSchema: schema
            };

            const helper = new UserRepositoryConfigHelper(config, 'PascalCase'); // database.namingStrategy

            expect(helper.namingStrategy).toBe('PascalCase');

            const fields: Partial<User & any> = {
                firstName: 'John',
                lastName: 'Doe',
                phoneNumber: '555-1234'
            };

            const dbFields = helper.customFieldsToDb(fields);

            expect(dbFields).toEqual({
                FirstName: 'John',
                LastName: 'Doe',
                PhoneNumber: '555-1234'
            });
        });

        it('should reverse transform from PascalCase to camelCase (toDomain)', () => {
            const schema = z.object({
                firstName: z.string(),
                lastName: z.string()
            });

            const config: UserCustomFieldsConfig<any> = {
                customSchema: schema
            };

            const helper = new UserRepositoryConfigHelper(config, 'PascalCase'); // database.namingStrategy

            const dbRow = {
                FirstName: 'John',
                LastName: 'Doe'
            };

            const domainFields = helper.customFieldsToDomain(dbRow);

            expect(domainFields).toEqual({
                firstName: 'John',
                lastName: 'Doe'
            });
        });
    });

    describe('Combination: namingStrategy + customMapper', () => {
        it('should combine namingStrategy with customMapper (customMapper has precedence)', () => {
            const schema = z.object({
                firstName: z.string(),
                lastName: z.string(),
                phoneNumber: z.string().optional()
            });

            const config: UserCustomFieldsConfig<any> = {
                customSchema: schema,
                customMapper: {
                    toDb: (fields) => ({
                        // customMapper adds calculated field
                        full_name: `${fields.firstName} ${fields.lastName}`,
                        // customMapper renames phoneNumber to 'phone' instead of 'phone_number'
                        phone: fields.phoneNumber
                    }),
                    toDomain: (dbRow) => {
                        const [firstName, lastName] = (dbRow.full_name || ' ').split(' ');
                        return {
                            firstName,
                            lastName,
                            phoneNumber: dbRow.phone
                        };
                    }
                }
            };

            const helper = new UserRepositoryConfigHelper(config, 'snake_case'); // database.namingStrategy

            const fields: Partial<User & any> = {
                firstName: 'John',
                lastName: 'Doe',
                phoneNumber: '555-1234'
            };

            const dbFields = helper.customFieldsToDb(fields);

            // customMapper has complete precedence (no merge with namingStrategy)
            // Only customMapper fields are returned
            expect(dbFields).toEqual({
                full_name: 'John Doe',
                phone: '555-1234'
            });
        });

        it('should apply customMapper to toDomain (customMapper has precedence)', () => {
            const schema = z.object({
                firstName: z.string(),
                lastName: z.string(),
                phoneNumber: z.string().optional()
            });

            const config: UserCustomFieldsConfig<any> = {
                customSchema: schema,
                customMapper: {
                    toDb: () => ({}),
                    toDomain: (dbRow) => ({
                        firstName: dbRow.full_name?.split(' ')[0] || '',
                        lastName: dbRow.full_name?.split(' ')[1] || '',
                        phoneNumber: dbRow.phone
                    })
                }
            };

            const helper = new UserRepositoryConfigHelper(config, 'snake_case'); // database.namingStrategy

            const dbRow = {
                first_name: 'John', // This would be inferred by namingStrategy
                last_name: 'Doe', // This would be inferred by namingStrategy
                phone_number: '555-1234', // This would be inferred by namingStrategy
                full_name: 'John Doe', // customMapper uses this
                phone: '555-9999' // customMapper uses this
            };

            const domainFields = helper.customFieldsToDomain(dbRow);

            // customMapper takes precedence
            expect(domainFields).toEqual({
                firstName: 'John',
                lastName: 'Doe',
                phoneNumber: '555-9999' // From 'phone', not 'phone_number'
            });
        });
    });

    describe('Optional fields', () => {
        it('should handle optional fields correctly', () => {
            const schema = z.object({
                firstName: z.string(),
                lastName: z.string(),
                middleName: z.string().optional(),
                phoneNumber: z.string().optional()
            });

            const config: UserCustomFieldsConfig<any> = {
                customSchema: schema
            };

            const helper = new UserRepositoryConfigHelper(config, 'snake_case'); // database.namingStrategy

            // Test with all fields present
            const fields1: Partial<User & any> = {
                firstName: 'John',
                lastName: 'Doe',
                middleName: 'M',
                phoneNumber: '555-1234'
            };

            const dbFields1 = helper.customFieldsToDb(fields1);
            expect(dbFields1).toEqual({
                first_name: 'John',
                last_name: 'Doe',
                middle_name: 'M',
                phone_number: '555-1234'
            });

            // Test with optional fields missing
            const fields2: Partial<User & any> = {
                firstName: 'Jane',
                lastName: 'Smith'
            };

            const dbFields2 = helper.customFieldsToDb(fields2);
            expect(dbFields2).toEqual({
                first_name: 'Jane',
                last_name: 'Smith'
            });
            expect(dbFields2).not.toHaveProperty('middle_name');
            expect(dbFields2).not.toHaveProperty('phone_number');
        });

        it('should handle undefined vs null correctly', () => {
            const schema = z.object({
                firstName: z.string(),
                middleName: z.string().optional()
            });

            const config: UserCustomFieldsConfig<any> = {
                customSchema: schema
            };

            const helper = new UserRepositoryConfigHelper(config, 'snake_case'); // database.namingStrategy

            // undefined should be excluded
            const fields: Partial<User & any> = {
                firstName: 'John',
                middleName: undefined
            };

            const dbFields = helper.customFieldsToDb(fields);
            expect(dbFields).toEqual({
                first_name: 'John'
            });
            expect(dbFields).not.toHaveProperty('middle_name');
        });
    });

    describe('No custom schema', () => {
        it('should return empty object when no customSchema is provided', () => {
            const config: UserCustomFieldsConfig<any> = {
                // No customSchema
            };

            const helper = new UserRepositoryConfigHelper(config);

            expect(helper.hasCustomFields).toBe(false);

            const fields: Partial<User & any> = {
                firstName: 'John',
                lastName: 'Doe'
            };

            const dbFields = helper.customFieldsToDb(fields);
            expect(dbFields).toEqual({});
        });

        it('should work with only customMapper (no schema)', () => {
            const config: UserCustomFieldsConfig<any> = {
                customMapper: {
                    toDb: (fields) => ({
                        full_name: `${fields.firstName} ${fields.lastName}`
                    }),
                    toDomain: (dbRow) => ({
                        firstName: dbRow.full_name?.split(' ')[0] || '',
                        lastName: dbRow.full_name?.split(' ')[1] || ''
                    })
                }
            };

            const helper = new UserRepositoryConfigHelper(config);

            expect(helper.hasCustomFields).toBe(true);

            const fields: Partial<User & any> = {
                firstName: 'John',
                lastName: 'Doe'
            };

            const dbFields = helper.customFieldsToDb(fields);
            expect(dbFields).toEqual({
                full_name: 'John Doe'
            });
        });
    });
});
