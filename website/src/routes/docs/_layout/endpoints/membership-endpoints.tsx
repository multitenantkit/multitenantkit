import { createFileRoute } from '@tanstack/react-router';
import { DocsPage } from '@/routes/docs/_components/DocsPage';
import MDXContent, { frontmatter } from '@/routes/docs/_content/endpoints/membership-endpoints.mdx';

export const Route = createFileRoute('/docs/_layout/endpoints/membership-endpoints')({
    component: EndpointsMembershipEndpointsComponent
});

function EndpointsMembershipEndpointsComponent() {
    return (
        <DocsPage
            title={frontmatter?.title || ''}
            description={frontmatter?.description || ''}
            currentPath="/docs/endpoints/membership-endpoints"
            filePath="endpoints/membership-endpoints"
            lastUpdated={frontmatter?.lastUpdated}
        >
            <MDXContent />
        </DocsPage>
    );
}
