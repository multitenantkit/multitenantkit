import type { BlogPostMeta } from './types';

// This file is auto-generated. Do not edit manually.
// Run `npm run blog:generate` to update.

export const blogPosts: BlogPostMeta[] = [
    {
        slug: 'introducing-multitenantkit',
        title: 'Introducing MultiTenantKit: The Open-Source Multi-Tenant Toolkit for TypeScript',
        description:
            "Today we're excited to announce MultiTenantKit — a production-ready, headless TypeScript toolkit that provides the business logic for managing Users, Organizations, and Memberships in B2B SaaS applications.",
        date: '2025-11-26',
        author: 'MultiTenantKit Team',
        coverImage: '/blog-images/introducing-multitenantkit-cover.svg',
        tags: ['announcement', 'open-source', 'typescript', 'saas'],
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
