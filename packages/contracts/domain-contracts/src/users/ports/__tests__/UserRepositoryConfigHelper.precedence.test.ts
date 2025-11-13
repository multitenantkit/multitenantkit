import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { UserRepositoryConfigHelper } from '../UserRepositoryConfigHelper';
import type { UserCustomFieldsConfig } from '../UserCustomFieldsConfig';

describe('UserRepositoryConfigHelper - namingStrategy precedence', () => {
    const schema = z.object({
        firstName: z.string(),
        lastName: z.string()
    });

    describe('Precedence: database > global > default', () => {
        it('should use database.namingStrategy when specified', () => {
            const config: UserCustomFieldsConfig<any> = {
                customSchema: schema
            };

            const helper = new UserRepositoryConfigHelper(
                config,
                'kebab-case', // database strategy
                'PascalCase' // global strategy
            );

            expect(helper.namingStrategy).toBe('kebab-case'); // database wins

            const fields: any = { firstName: 'John', lastName: 'Doe' };
            const dbFields = helper.customFieldsToDb(fields);

            expect(dbFields).toEqual({
                'first-name': 'John',
                'last-name': 'Doe'
            });
        });

        it('should use global.namingStrategy when database not specified', () => {
            const config: UserCustomFieldsConfig<any> = {
                customSchema: schema
            };

            const helper = new UserRepositoryConfigHelper(
                config,
                undefined, // no database strategy
                'PascalCase' // global strategy
            );

            expect(helper.namingStrategy).toBe('PascalCase'); // global wins

            const fields: any = { firstName: 'John', lastName: 'Doe' };
            const dbFields = helper.customFieldsToDb(fields);

            expect(dbFields).toEqual({
                FirstName: 'John',
                LastName: 'Doe'
            });
        });

        it('should use snake_case default when nothing specified', () => {
            const config: UserCustomFieldsConfig<any> = {
                customSchema: schema
            };

            const helper = new UserRepositoryConfigHelper(
                config,
                undefined, // no database strategy
                undefined // no global strategy
            );

            expect(helper.namingStrategy).toBe('snake_case'); // default for SQL databases

            const fields: any = { firstName: 'John', lastName: 'Doe' };
            const dbFields = helper.customFieldsToDb(fields);

            expect(dbFields).toEqual({
                first_name: 'John',
                last_name: 'Doe'
            });
        });
    });

    describe('Real-world scenarios', () => {
        it('should support global namingStrategy for all entities', () => {
            // Simulating: All entities use snake_case via global config
            const config: UserCustomFieldsConfig<any> = {
                customSchema: schema
            };

            const helper = new UserRepositoryConfigHelper(
                config,
                undefined, // no entity-specific override
                'snake_case' // global: all entities use snake_case
            );

            expect(helper.namingStrategy).toBe('snake_case');

            const fields: any = { firstName: 'John', lastName: 'Doe' };
            const dbFields = helper.customFieldsToDb(fields);

            expect(dbFields).toEqual({
                first_name: 'John',
                last_name: 'Doe'
            });
        });

        it('should support entity-specific override of global namingStrategy', () => {
            // Simulating: Global is snake_case, but users uses camelCase
            const config: UserCustomFieldsConfig<any> = {
                customSchema: schema
            };

            const helper = new UserRepositoryConfigHelper(
                config,
                'camelCase', // entity-specific: users uses camelCase
                'snake_case' // global: other entities use snake_case
            );

            expect(helper.namingStrategy).toBe('camelCase'); // entity-specific wins

            const fields: any = { firstName: 'John', lastName: 'Doe' };
            const dbFields = helper.customFieldsToDb(fields);

            expect(dbFields).toEqual({
                firstName: 'John',
                lastName: 'Doe'
            });
        });
    });
});
