import { createFileRoute } from '@tanstack/react-router';
import { DocsPage } from '@/routes/docs/_components/DocsPage';
import MDXContent, { frontmatter } from '@/routes/docs/_content/architecture/overview.mdx';

export const Route = createFileRoute('/docs/_layout/architecture/overview')({
    component: ArchitectureOverviewComponent
});

function ArchitectureOverviewComponent() {
    return (
        <DocsPage
            title={frontmatter?.title || ''}
            description={frontmatter?.description || ''}
            currentPath="/docs/architecture/overview"
            filePath="architecture/overview"
            lastUpdated={frontmatter?.lastUpdated}
        >
            <MDXContent />
        </DocsPage>
    );
}
