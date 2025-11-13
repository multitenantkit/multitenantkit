/**
 * Port for UUID generation
 * Allows testing with deterministic UUIDs
 */
export interface UuidPort {
    generate(): string;
}
