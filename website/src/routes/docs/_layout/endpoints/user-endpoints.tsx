import { createFileRoute } from '@tanstack/react-router';
import { DocsPage } from '@/routes/docs/_components/DocsPage';
import MDXContent, { frontmatter } from '@/routes/docs/_content/endpoints/user-endpoints.mdx';

export const Route = createFileRoute('/docs/_layout/endpoints/user-endpoints')({
    component: EndpointsUserEndpointsComponent
});

function EndpointsUserEndpointsComponent() {
    return (
        <DocsPage
            title={frontmatter?.title || ''}
            description={frontmatter?.description || ''}
            currentPath="/docs/endpoints/user-endpoints"
            filePath="endpoints/user-endpoints"
            lastUpdated={frontmatter?.lastUpdated}
        >
            <MDXContent />
        </DocsPage>
    );
}
