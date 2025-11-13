/**
 * Represents an authenticated user/principal in the system
 * Used for authorization decisions in use cases
 */
export interface Principal {
    authProviderId: string;
}

/**
 * Helper to create an authenticated principal
 */
export function createPrincipal(userId: string): Principal {
    return {
        authProviderId: userId
    };
}

/**
 * Represents an anonymous/unauthenticated user
 */
export const ANONYMOUS_PRINCIPAL: Principal = {
    authProviderId: ''
};
