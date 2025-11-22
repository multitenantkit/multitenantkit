import { createFileRoute } from '@tanstack/react-router';
import { DocsPage } from '@/routes/docs/_components/DocsPage';
import MDXContent, { frontmatter } from '@/routes/docs/_content/configuration/overview.mdx';

export const Route = createFileRoute('/docs/_layout/configuration/overview')({
    component: ConfigurationOverviewComponent
});

function ConfigurationOverviewComponent() {
    return (
        <DocsPage
            title={frontmatter?.title || ''}
            description={frontmatter?.description || ''}
            currentPath="/docs/configuration/overview"
            filePath="configuration/overview"
            lastUpdated={frontmatter?.lastUpdated}
        >
            <MDXContent />
        </DocsPage>
    );
}
