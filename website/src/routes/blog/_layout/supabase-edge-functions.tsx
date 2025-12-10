import { createFileRoute } from '@tanstack/react-router';
import { BlogPost } from '../_components/BlogPost';
import type { BlogFrontmatter } from '../_lib/types';
import MDXContent, { frontmatter } from '../_posts/supabase-edge-functions.mdx';

export const Route = createFileRoute('/blog/_layout/supabase-edge-functions')({
    component: SupabaseEdgeFunctionsPost
});

function SupabaseEdgeFunctionsPost() {
    const fm = frontmatter as unknown as BlogFrontmatter;
    return (
        <BlogPost
            title={fm.title}
            description={fm.description}
            date={fm.date}
            author={fm.author}
            coverImage={fm.coverImage}
            tags={fm.tags}
            slug="supabase-edge-functions"
        >
            <MDXContent />
        </BlogPost>
    );
}
