/**
 * JSON schemas/types for persistence
 * These represent how data is stored in JSON files
 * Now based on centralized DB contracts for consistency
 */

import { z } from 'zod';
import {
    OrganizationMembershipSchema,
    OrganizationSchema,
    UserSchema
} from '@multitenantkit/domain-contracts';
import { ISODateTime } from '@multitenantkit/domain-contracts/shared/primitives';

// JSON storage uses the same structure as base DB schemas
export const UserJsonSchema = UserSchema.omit({
    createdAt: true,
    updatedAt: true
}).extend({
    createdAt: ISODateTime,
    updatedAt: ISODateTime,
    deletedAt: ISODateTime.nullish()
});

export const OrganizationJsonSchema = OrganizationSchema.omit({
    createdAt: true,
    updatedAt: true,
    deletedAt: true
}).extend({
    createdAt: ISODateTime,
    updatedAt: ISODateTime,
    deletedAt: ISODateTime.nullish()
});

export const OrganizationMembershipJsonSchema = OrganizationMembershipSchema.extend({
    invitedAt: z.string().optional(), // ISO string instead of Date, optional
    joinedAt: z.string().optional(), // ISO string instead of Date, optional
    leftAt: z.string().optional(), // ISO string instead of Date, optional
    deletedAt: z.string().optional(), // ISO string instead of Date, optional
    createdAt: z.string(), // ISO string instead of Date
    updatedAt: z.string() // ISO string instead of Date
});

// Type aliases for backward compatibility
export type UserJsonData = typeof UserJsonSchema._type;
export type OrganizationJsonData = typeof OrganizationJsonSchema._type;
export type OrganizationMembershipJsonData = typeof OrganizationMembershipJsonSchema._type;
