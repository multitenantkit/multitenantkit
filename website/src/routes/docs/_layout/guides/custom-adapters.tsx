import { createFileRoute } from '@tanstack/react-router';
import { DocsPage } from '@/routes/docs/_components/DocsPage';
import MDXContent, { frontmatter } from '@/routes/docs/_content/guides/custom-adapters.mdx';

export const Route = createFileRoute('/docs/_layout/guides/custom-adapters')({
    component: GuidesCustomAdaptersComponent
});

function GuidesCustomAdaptersComponent() {
    return (
        <DocsPage
            title={frontmatter?.title || ''}
            description={frontmatter?.description || ''}
            currentPath="/docs/guides/custom-adapters"
            filePath="guides/custom-adapters"
            lastUpdated={frontmatter?.lastUpdated}
        >
            <MDXContent />
        </DocsPage>
    );
}
