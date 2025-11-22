import { createFileRoute } from '@tanstack/react-router';
import { DocsPage } from '@/routes/docs/_components/DocsPage';
import MDXContent, { frontmatter } from '@/routes/docs/_content/use-cases/overview.mdx';

export const Route = createFileRoute('/docs/_layout/use-cases/overview')({
    component: UseCasesOverviewComponent
});

function UseCasesOverviewComponent() {
    return (
        <DocsPage
            title={frontmatter?.title || ''}
            description={frontmatter?.description || ''}
            currentPath="/docs/use-cases/overview"
            filePath="use-cases/overview"
            lastUpdated={frontmatter?.lastUpdated}
        >
            <MDXContent />
        </DocsPage>
    );
}
