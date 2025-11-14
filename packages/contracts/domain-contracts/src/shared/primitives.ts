import { z } from 'zod';

/**
 * Primitive schemas used across the application
 * These are the building blocks for all other schemas
 */

export const Uuid = z.string().min(1, 'User ID is required').uuid('Invalid uuid');

export const Email = z.string().email().max(254);

export const DateTime = z.date({
    required_error: 'Created date is required',
    invalid_type_error: 'Created date is required'
});

export const ISODateTime = z.string().datetime(); // API: ISO string
