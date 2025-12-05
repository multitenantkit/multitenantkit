import { describe, expect, it } from 'vitest';
import { getRequestId } from '../../src/middleware/requestId';

describe('RequestId Middleware', () => {
    describe('getRequestId', () => {
        it('should return existing x-request-id header if present', () => {
            const request = new Request('https://example.com', {
                headers: {
                    'x-request-id': 'existing-id-123'
                }
            });

            const requestId = getRequestId(request);

            expect(requestId).toBe('existing-id-123');
        });

        it('should generate new UUID if x-request-id not present', () => {
            const request = new Request('https://example.com');

            const requestId = getRequestId(request);

            // UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
            expect(requestId).toMatch(
                /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
            );
        });

        it('should generate unique IDs for different requests', () => {
            const request1 = new Request('https://example.com');
            const request2 = new Request('https://example.com');

            const id1 = getRequestId(request1);
            const id2 = getRequestId(request2);

            expect(id1).not.toBe(id2);
        });

        it('should handle case-insensitive header name', () => {
            const request = new Request('https://example.com', {
                headers: {
                    'X-Request-ID': 'case-test-id'
                }
            });

            const requestId = getRequestId(request);

            expect(requestId).toBe('case-test-id');
        });
    });
});
