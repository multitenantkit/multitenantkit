import { randomUUID } from 'crypto';
import { UuidPort } from '@multitenantkit/domain-contracts';

/**
 * Crypto UUID implementation using Node.js crypto module
 */
export class CryptoUuid implements UuidPort {
    generate(): string {
        return randomUUID();
    }
}
