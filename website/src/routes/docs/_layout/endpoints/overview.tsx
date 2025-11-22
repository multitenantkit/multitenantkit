import { createFileRoute } from '@tanstack/react-router';
import { DocsPage } from '@/routes/docs/_components/DocsPage';
import MDXContent, { frontmatter } from '@/routes/docs/_content/endpoints/overview.mdx';

export const Route = createFileRoute('/docs/_layout/endpoints/overview')({
    component: EndpointsOverviewComponent
});

function EndpointsOverviewComponent() {
    return (
        <DocsPage
            title={frontmatter?.title || ''}
            description={frontmatter?.description || ''}
            currentPath="/docs/endpoints/overview"
            filePath="endpoints/overview"
            lastUpdated={frontmatter?.lastUpdated}
        >
            <MDXContent />
        </DocsPage>
    );
}
