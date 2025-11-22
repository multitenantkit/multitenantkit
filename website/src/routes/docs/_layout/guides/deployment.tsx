import { createFileRoute } from '@tanstack/react-router';
import { DocsPage } from '@/routes/docs/_components/DocsPage';
import MDXContent, { frontmatter } from '@/routes/docs/_content/guides/deployment.mdx';

export const Route = createFileRoute('/docs/_layout/guides/deployment')({
    component: GuidesDeploymentComponent
});

function GuidesDeploymentComponent() {
    return (
        <DocsPage
            title={frontmatter?.title || ''}
            description={frontmatter?.description || ''}
            currentPath="/docs/guides/deployment"
            filePath="guides/deployment"
            lastUpdated={frontmatter?.lastUpdated}
        >
            <MDXContent />
        </DocsPage>
    );
}
