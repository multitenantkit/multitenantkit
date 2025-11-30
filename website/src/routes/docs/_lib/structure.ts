export interface DocsPage {
    title: string;
    description: string;
    url: string;
    slug: string[];
}

export interface DocsSection {
    title: string;
    pages: DocsPage[];
}

export const docsStructure: DocsSection[] = [
    {
        title: 'Getting Started',
        pages: [
            {
                title: 'Introduction',
                description: 'Learn what MultiTenantKit is and why you should use it',
                url: '/docs/getting-started/introduction',
                slug: ['getting-started', 'introduction']
            },
            {
                title: 'Installation',
                description: 'Install MultiTenantKit in your project',
                url: '/docs/getting-started/installation',
                slug: ['getting-started', 'installation']
            },
            {
                title: 'Quick Start',
                description: 'Get up and running in 5 minutes',
                url: '/docs/getting-started/quick-start',
                slug: ['getting-started', 'quick-start']
            }
        ]
    },
    {
        title: 'Endpoints',
        pages: [
            {
                title: 'Overview',
                description: 'REST API endpoints',
                url: '/docs/endpoints/overview',
                slug: ['endpoints', 'overview']
            },
            {
                title: 'User Endpoints',
                description: 'User API endpoints',
                url: '/docs/endpoints/user-endpoints',
                slug: ['endpoints', 'user-endpoints']
            },
            {
                title: 'Organization Endpoints',
                description: 'Organization API endpoints',
                url: '/docs/endpoints/organization-endpoints',
                slug: ['endpoints', 'organization-endpoints']
            },
            {
                title: 'Membership Endpoints',
                description: 'Membership API endpoints',
                url: '/docs/endpoints/membership-endpoints',
                slug: ['endpoints', 'membership-endpoints']
            }
        ]
    },
    {
        title: 'Use Cases',
        pages: [
            {
                title: 'Overview',
                description: 'All available use cases',
                url: '/docs/use-cases/overview',
                slug: ['use-cases', 'overview']
            },
            {
                title: 'User Management',
                description: 'User CRUD operations',
                url: '/docs/use-cases/user-management',
                slug: ['use-cases', 'user-management']
            },
            {
                title: 'Organization Management',
                description: 'Organization CRUD operations',
                url: '/docs/use-cases/organization-management',
                slug: ['use-cases', 'organization-management']
            },
            {
                title: 'Membership Management',
                description: 'Membership operations',
                url: '/docs/use-cases/membership-management',
                slug: ['use-cases', 'membership-management']
            }
        ]
    },
    {
        title: 'Configuration',
        pages: [
            {
                title: 'Overview',
                description: 'Configure MultiTenantKit',
                url: '/docs/configuration/overview',
                slug: ['configuration', 'overview']
            },
            {
                title: 'Custom Fields',
                description: 'Add custom fields to entities',
                url: '/docs/configuration/custom-fields',
                slug: ['configuration', 'custom-fields']
            },
            {
                title: 'Hooks',
                description: 'Extend use case behavior',
                url: '/docs/configuration/hooks',
                slug: ['configuration', 'hooks']
            },
            {
                title: 'Response Transformers',
                description: 'Modify HTTP responses without changing business logic',
                url: '/docs/configuration/response-transformers',
                slug: ['configuration', 'response-transformers']
            }
        ]
    },
    {
        title: 'Adapters',
        pages: [
            {
                title: 'Overview',
                description: 'Available adapters',
                url: '/docs/adapters/overview',
                slug: ['adapters', 'overview']
            },
            {
                title: 'Persistence',
                description: 'Database adapters',
                url: '/docs/adapters/persistence',
                slug: ['adapters', 'persistence']
            },
            {
                title: 'Authentication',
                description: 'Auth provider adapters',
                url: '/docs/adapters/authentication',
                slug: ['adapters', 'authentication']
            },
            {
                title: 'Transport',
                description: 'HTTP framework adapters',
                url: '/docs/adapters/transport',
                slug: ['adapters', 'transport']
            }
        ]
    },
    {
        title: 'Guides',
        pages: [
            {
                title: 'Building Custom Adapters',
                description: 'Create your own adapters',
                url: '/docs/guides/custom-adapters',
                slug: ['guides', 'custom-adapters']
            },
            {
                title: 'Testing',
                description: 'Testing strategies',
                url: '/docs/guides/testing',
                slug: ['guides', 'testing']
            },
            {
                title: 'Deployment',
                description: 'Deploy to production',
                url: '/docs/guides/deployment',
                slug: ['guides', 'deployment']
            }
        ]
    },
    {
        title: 'Architecture',
        pages: [
            {
                title: 'Overview',
                description: 'Hexagonal architecture explained',
                url: '/docs/architecture/overview',
                slug: ['architecture', 'overview']
            },
            {
                title: 'Domain Layer',
                description: 'Business logic and entities',
                url: '/docs/architecture/domain',
                slug: ['architecture', 'domain']
            },
            {
                title: 'Ports & Adapters',
                description: 'Interface pattern',
                url: '/docs/architecture/ports-adapters',
                slug: ['architecture', 'ports-adapters']
            },
            {
                title: 'External ID',
                description: 'Understanding externalId and auth providers',
                url: '/docs/architecture/external-id',
                slug: ['architecture', 'external-id']
            },
            {
                title: 'Username',
                description: 'Understanding username and user identification',
                url: '/docs/architecture/username',
                slug: ['architecture', 'username']
            }
        ]
    },
    {
        title: 'Examples',
        pages: [
            {
                title: 'Basic Setup',
                description: 'Simple implementation example',
                url: '/docs/examples/basic-setup',
                slug: ['examples', 'basic-setup']
            },
            {
                title: 'Advanced Setup',
                description: 'Production-ready example',
                url: '/docs/examples/advanced-setup',
                slug: ['examples', 'advanced-setup']
            },
            {
                title: 'Real World App',
                description: 'Complete application example',
                url: '/docs/examples/real-world',
                slug: ['examples', 'real-world']
            }
        ]
    }
];
