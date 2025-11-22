import { createFileRoute } from '@tanstack/react-router';
import { DocsPage } from '@/routes/docs/_components/DocsPage';
import MDXContent, { frontmatter } from '@/routes/docs/_content/guides/testing.mdx';

export const Route = createFileRoute('/docs/_layout/guides/testing')({
    component: GuidesTestingComponent
});

function GuidesTestingComponent() {
    return (
        <DocsPage
            title={frontmatter?.title || ''}
            description={frontmatter?.description || ''}
            currentPath="/docs/guides/testing"
            filePath="guides/testing"
            lastUpdated={frontmatter?.lastUpdated}
        >
            <MDXContent />
        </DocsPage>
    );
}
