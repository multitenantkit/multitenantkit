declare module '*.mdx' {
    import type { FC } from 'react';

    /**
     * MDX frontmatter metadata
     */
    export interface Frontmatter {
        title?: string;
        description?: string;
        lastUpdated?: string;
        [key: string]: unknown;
    }

    /**
     * MDX component props
     */
    export interface MDXProps {
        components?: Record<string, unknown>;
    }

    /**
     * Default export: MDX component
     */
    const MDXComponent: FC<MDXProps>;
    export default MDXComponent;

    /**
     * Named export: frontmatter metadata
     */
    export const frontmatter: Frontmatter;
}
