import { createFileRoute } from '@tanstack/react-router';
import { DocsPage } from '@/routes/docs/_components/DocsPage';
import MDXContent, { frontmatter } from '@/routes/docs/_content/adapters/overview.mdx';

export const Route = createFileRoute('/docs/_layout/adapters/overview')({
    component: AdaptersOverviewComponent
});

function AdaptersOverviewComponent() {
    return (
        <DocsPage
            title={frontmatter?.title || ''}
            description={frontmatter?.description || ''}
            currentPath="/docs/adapters/overview"
            filePath="adapters/overview"
            lastUpdated={frontmatter?.lastUpdated}
        >
            <MDXContent />
        </DocsPage>
    );
}
