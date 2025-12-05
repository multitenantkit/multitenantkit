import { ANONYMOUS_PRINCIPAL } from '@multitenantkit/domain-contracts/shared/auth';
import { describe, expect, it, vi } from 'vitest';
import { authenticateRequest } from '../../src/middleware/auth';

describe('Auth Middleware', () => {
    describe('authenticateRequest', () => {
        it('should return principal when auth succeeds', async () => {
            const mockPrincipal = { userId: 'user-123', type: 'user' as const };
            const mockAuthService = {
                authenticate: vi.fn().mockResolvedValue(mockPrincipal)
            };

            const request = new Request('https://example.com', {
                headers: {
                    Authorization: 'Bearer valid-token'
                }
            });

            const result = await authenticateRequest(request, mockAuthService);

            expect(result).toEqual(mockPrincipal);
            expect(mockAuthService.authenticate).toHaveBeenCalledWith({
                headers: expect.objectContaining({
                    authorization: 'Bearer valid-token'
                }),
                cookies: {}
            });
        });

        it('should return ANONYMOUS_PRINCIPAL when auth returns null', async () => {
            const mockAuthService = {
                authenticate: vi.fn().mockResolvedValue(null)
            };

            const request = new Request('https://example.com');

            const result = await authenticateRequest(request, mockAuthService);

            expect(result).toBe(ANONYMOUS_PRINCIPAL);
        });

        it('should return ANONYMOUS_PRINCIPAL when auth throws error', async () => {
            const mockAuthService = {
                authenticate: vi.fn().mockRejectedValue(new Error('Auth failed'))
            };

            const request = new Request('https://example.com', {
                headers: {
                    Authorization: 'Bearer invalid-token'
                }
            });

            const result = await authenticateRequest(request, mockAuthService);

            expect(result).toBe(ANONYMOUS_PRINCIPAL);
        });

        it('should convert headers to lowercase', async () => {
            const mockAuthService = {
                authenticate: vi.fn().mockResolvedValue(null)
            };

            const request = new Request('https://example.com', {
                headers: {
                    'X-Custom-Header': 'value',
                    'Content-Type': 'application/json'
                }
            });

            await authenticateRequest(request, mockAuthService);

            expect(mockAuthService.authenticate).toHaveBeenCalledWith({
                headers: expect.objectContaining({
                    'x-custom-header': 'value',
                    'content-type': 'application/json'
                }),
                cookies: {}
            });
        });

        it('should pass empty cookies object', async () => {
            const mockAuthService = {
                authenticate: vi.fn().mockResolvedValue(null)
            };

            const request = new Request('https://example.com');

            await authenticateRequest(request, mockAuthService);

            expect(mockAuthService.authenticate).toHaveBeenCalledWith(
                expect.objectContaining({
                    cookies: {}
                })
            );
        });
    });
});
