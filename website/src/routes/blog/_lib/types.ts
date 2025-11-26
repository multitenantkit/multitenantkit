export interface BlogPostMeta {
    slug: string;
    title: string;
    description?: string;
    date: string;
    author?: string;
    coverImage?: string;
    tags?: string[];
    featured?: boolean;
}

export interface BlogFrontmatter {
    title: string;
    description?: string;
    date: string;
    author?: string;
    coverImage?: string;
    tags?: string[];
    featured?: boolean;
}
