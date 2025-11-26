declare module '*.mdx' {
    import type { ComponentType } from 'react';

    export interface BlogFrontmatter {
        title: string;
        description?: string;
        date: string;
        author?: string;
        coverImage?: string;
        tags?: string[];
        featured?: boolean;
    }

    export const frontmatter: BlogFrontmatter;
    const MDXContent: ComponentType;
    export default MDXContent;
}
