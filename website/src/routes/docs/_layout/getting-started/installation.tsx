import { createFileRoute } from '@tanstack/react-router';
import { DocsPage } from '@/routes/docs/_components/DocsPage';
import MDXContent, { frontmatter } from '@/routes/docs/_content/getting-started/installation.mdx';

export const Route = createFileRoute('/docs/_layout/getting-started/installation')({
    component: GettingStartedInstallationComponent
});

function GettingStartedInstallationComponent() {
    return (
        <DocsPage
            title={frontmatter?.title || ''}
            description={frontmatter?.description || ''}
            currentPath="/docs/getting-started/installation"
            filePath="getting-started/installation"
            lastUpdated={frontmatter?.lastUpdated}
        >
            <MDXContent />
        </DocsPage>
    );
}
