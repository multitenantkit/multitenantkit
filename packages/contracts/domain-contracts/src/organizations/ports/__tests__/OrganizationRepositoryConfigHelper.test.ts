import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import type { Organization } from '../../entities';
import type { OrganizationCustomFieldsConfig } from '../OrganizationCustomFieldsConfig';
import { OrganizationRepositoryConfigHelper } from '../OrganizationRepositoryConfigHelper';

describe('OrganizationRepositoryConfigHelper - namingStrategy', () => {
    describe('Default behavior (snake_case)', () => {
        it('should use snake_case by default (SQL database convention)', () => {
            const schema = z.object({
                planType: z.string(),
                monthlyPrice: z.number()
            });

            const config: OrganizationCustomFieldsConfig<any> = {
                customSchema: schema
            };

            const helper = new OrganizationRepositoryConfigHelper(config);

            expect(helper.namingStrategy).toBe('snake_case');
            expect(helper.hasCustomFields).toBe(true);

            const fields: Partial<Organization & any> = {
                planType: 'pro',
                monthlyPrice: 99.99
            };

            const dbFields = helper.customFieldsToDb(fields);

            expect(dbFields).toEqual({
                plan_type: 'pro',
                monthly_price: 99.99
            });
        });
    });

    describe('snake_case transformation', () => {
        it('should transform to snake_case when specified', () => {
            const schema = z.object({
                planType: z.string(),
                monthlyPrice: z.number(),
                billingEmail: z.string().optional()
            });

            const config: OrganizationCustomFieldsConfig<any> = {
                customSchema: schema
            };

            const helper = new OrganizationRepositoryConfigHelper(config, 'snake_case'); // database.namingStrategy

            const fields: Partial<Organization & any> = {
                planType: 'enterprise',
                monthlyPrice: 299.99,
                billingEmail: 'billing@example.com'
            };

            const dbFields = helper.customFieldsToDb(fields);

            expect(dbFields).toEqual({
                plan_type: 'enterprise',
                monthly_price: 299.99,
                billing_email: 'billing@example.com'
            });
        });

        it('should reverse transform from snake_case to camelCase (toDomain)', () => {
            const schema = z.object({
                planType: z.string(),
                monthlyPrice: z.number()
            });

            const config: OrganizationCustomFieldsConfig<any> = {
                customSchema: schema
            };

            const helper = new OrganizationRepositoryConfigHelper(config, 'snake_case'); // database.namingStrategy

            const dbRow = {
                plan_type: 'pro',
                monthly_price: 99.99
            };

            const domainFields = helper.customFieldsToDomain(dbRow);

            expect(domainFields).toEqual({
                planType: 'pro',
                monthlyPrice: 99.99
            });
        });
    });

    describe('Combination: namingStrategy + customMapper', () => {
        it('should combine namingStrategy with customMapper (customMapper has precedence)', () => {
            const schema = z.object({
                planType: z.string(),
                monthlyPrice: z.number(),
                annualDiscount: z.number().optional()
            });

            const config: OrganizationCustomFieldsConfig<any> = {
                customSchema: schema,
                customMapper: {
                    toDb: (fields) => ({
                        // Calculated field
                        annual_price: fields.monthlyPrice * 12 * (1 - (fields.annualDiscount || 0)),
                        has_discount: !!fields.annualDiscount,
                        is_paid_plan: fields.planType !== 'free'
                    }),
                    toDomain: (dbRow) => ({
                        planType: dbRow.plan_type,
                        monthlyPrice: dbRow.monthly_price,
                        annualDiscount: dbRow.annual_discount
                    })
                }
            };

            const helper = new OrganizationRepositoryConfigHelper(config, 'snake_case'); // database.namingStrategy

            const fields: Partial<Organization & any> = {
                planType: 'pro',
                monthlyPrice: 100,
                annualDiscount: 0.1
            };

            const dbFields = helper.customFieldsToDb(fields);

            // customMapper has complete precedence (no merge with namingStrategy)
            // Only customMapper fields are returned
            expect(dbFields).toMatchObject({
                annual_price: 1080, // 100 * 12 * 0.9
                has_discount: true,
                is_paid_plan: true
            });
        });
    });

    describe('Optional fields', () => {
        it('should handle optional fields correctly', () => {
            const schema = z.object({
                planType: z.string(),
                monthlyPrice: z.number(),
                billingEmail: z.string().optional()
            });

            const config: OrganizationCustomFieldsConfig<any> = {
                customSchema: schema
            };

            const helper = new OrganizationRepositoryConfigHelper(config, 'snake_case'); // database.namingStrategy

            // Without optional field
            const fields: Partial<Organization & any> = {
                planType: 'free',
                monthlyPrice: 0
            };

            const dbFields = helper.customFieldsToDb(fields);
            expect(dbFields).toEqual({
                plan_type: 'free',
                monthly_price: 0
            });
            expect(dbFields).not.toHaveProperty('billing_email');
        });
    });
});
