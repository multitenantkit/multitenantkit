import { createFileRoute } from '@tanstack/react-router';
import { DocsPage } from '@/routes/docs/_components/DocsPage';
import MDXContent, { frontmatter } from '@/routes/docs/_content/examples/real-world.mdx';

export const Route = createFileRoute('/docs/_layout/examples/real-world')({
    component: ExamplesRealWorldComponent
});

function ExamplesRealWorldComponent() {
    return (
        <DocsPage
            title={frontmatter?.title || ''}
            description={frontmatter?.description || ''}
            currentPath="/docs/examples/real-world"
            filePath="examples/real-world"
            lastUpdated={frontmatter?.lastUpdated}
        >
            <MDXContent />
        </DocsPage>
    );
}
