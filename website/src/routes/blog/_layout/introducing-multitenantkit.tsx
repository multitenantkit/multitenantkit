import { createFileRoute } from '@tanstack/react-router';
import { BlogPost } from '../_components/BlogPost';
import type { BlogFrontmatter } from '../_lib/types';
import MDXContent, { frontmatter } from '../_posts/introducing-multitenantkit.mdx';

export const Route = createFileRoute('/blog/_layout/introducing-multitenantkit')({
    component: IntroducingMultitenantkitPost
});

function IntroducingMultitenantkitPost() {
    const fm = frontmatter as unknown as BlogFrontmatter;
    return (
        <BlogPost
            title={fm.title}
            description={fm.description}
            date={fm.date}
            author={fm.author}
            coverImage={fm.coverImage}
            tags={fm.tags}
            slug="introducing-multitenantkit"
        >
            <MDXContent />
        </BlogPost>
    );
}
