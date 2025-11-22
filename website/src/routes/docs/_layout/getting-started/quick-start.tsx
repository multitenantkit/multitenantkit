import { createFileRoute } from '@tanstack/react-router';
import { DocsPage } from '@/routes/docs/_components/DocsPage';
import MDXContent, { frontmatter } from '@/routes/docs/_content/getting-started/quick-start.mdx';

export const Route = createFileRoute('/docs/_layout/getting-started/quick-start')({
    component: GettingStartedQuickStartComponent
});

function GettingStartedQuickStartComponent() {
    return (
        <DocsPage
            title={frontmatter?.title || ''}
            description={frontmatter?.description || ''}
            currentPath="/docs/getting-started/quick-start"
            filePath="getting-started/quick-start"
            lastUpdated={frontmatter?.lastUpdated}
        >
            <MDXContent />
        </DocsPage>
    );
}
