import { createFileRoute } from '@tanstack/react-router';
import { DocsPage } from '@/routes/docs/_components/DocsPage';
import MDXContent, { frontmatter } from '@/routes/docs/_content/architecture/external-id.mdx';

export const Route = createFileRoute('/docs/_layout/architecture/external-id')({
    component: ArchitectureExternalIdComponent
});

function ArchitectureExternalIdComponent() {
    return (
        <DocsPage
            title={frontmatter?.title || ''}
            description={frontmatter?.description || ''}
            currentPath="/docs/architecture/external-id"
            filePath="architecture/external-id"
            lastUpdated={frontmatter?.lastUpdated}
        >
            <MDXContent />
        </DocsPage>
    );
}
