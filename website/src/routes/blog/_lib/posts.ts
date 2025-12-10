import type { BlogPostMeta } from './types';

// This file is auto-generated. Do not edit manually.
// Run `npm run blog:generate` to update.

export const blogPosts: BlogPostMeta[] = [
    {
        slug: 'architecture-deep-dive',
        title: "Architecture Deep Dive: Inside MultiTenantKit's Hexagonal Design",
        description:
            "A comprehensive exploration of the architectural patterns, design decisions, and engineering principles that power MultiTenantKit's flexible multi-tenant framework.",
        date: '2025-12-01',
        author: 'German Llorente',
        coverImage:
            'https://images.unsplash.com/photo-1487017159836-4e23ece2e4cf?w=1200&auto=format&fit=crop&q=80',
        tags: ['architecture', 'hexagonal-architecture', 'typescript', 'design-patterns'],
        featured: true
    },
    {
        slug: 'introducing-multitenantkit',
        title: 'Introducing MultiTenantKit: The Open-Source Multi-Tenant Toolkit for TypeScript',
        description:
            "Today we're excited to announce MultiTenantKit — a production-ready, headless TypeScript toolkit that provides the business logic for managing Users, Organizations, and Memberships in B2B SaaS applications.",
        date: '2025-11-26',
        author: 'German Llorente',
        coverImage: '/blog-images/introducing-multitenantkit-cover.svg',
        tags: ['announcement', 'open-source', 'typescript', 'saas'],
        featured: true
    },
    {
        slug: 'supabase-edge-functions',
        title: 'Deploy MultiTenantKit to Supabase Edge Functions in 5 Minutes',
        description:
            'Learn how to deploy your multi-tenant API to the edge using Supabase Edge Functions. Zero Node.js, fast cold starts, global distribution out of the box.',
        date: '2025-12-10',
        author: 'German Llorente',
        coverImage:
            'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1200&auto=format&fit=crop&q=80',
        tags: ['supabase', 'edge-functions', 'serverless', 'deployment'],
        featured: true
    }
];

export function getAllPosts(): BlogPostMeta[] {
    return blogPosts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function getFeaturedPosts(): BlogPostMeta[] {
    return blogPosts.filter((post) => post.featured);
}

export function getPostBySlug(slug: string): BlogPostMeta | undefined {
    return blogPosts.find((post) => post.slug === slug);
}

export function getPostsByTag(tag: string): BlogPostMeta[] {
    return blogPosts.filter((post) => post.tags?.includes(tag));
}
