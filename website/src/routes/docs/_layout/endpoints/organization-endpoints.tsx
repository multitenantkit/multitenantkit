import { createFileRoute } from '@tanstack/react-router';
import { DocsPage } from '@/routes/docs/_components/DocsPage';
import MDXContent, {
    frontmatter
} from '@/routes/docs/_content/endpoints/organization-endpoints.mdx';

export const Route = createFileRoute('/docs/_layout/endpoints/organization-endpoints')({
    component: EndpointsOrganizationEndpointsComponent
});

function EndpointsOrganizationEndpointsComponent() {
    return (
        <DocsPage
            title={frontmatter?.title || ''}
            description={frontmatter?.description || ''}
            currentPath="/docs/endpoints/organization-endpoints"
            filePath="endpoints/organization-endpoints"
            lastUpdated={frontmatter?.lastUpdated}
        >
            <MDXContent />
        </DocsPage>
    );
}
