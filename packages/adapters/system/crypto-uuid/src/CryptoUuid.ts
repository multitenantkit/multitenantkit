import { randomUUID } from 'node:crypto';
import type { UuidPort } from '@multitenantkit/domain-contracts';

/**
 * Crypto UUID implementation using Node.js crypto module
 */
export class CryptoUuid implements UuidPort {
    generate(): string {
        return randomUUID();
    }
}
