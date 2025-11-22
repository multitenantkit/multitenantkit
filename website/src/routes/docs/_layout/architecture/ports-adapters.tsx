import { createFileRoute } from '@tanstack/react-router';
import { DocsPage } from '@/routes/docs/_components/DocsPage';
import MDXContent, { frontmatter } from '@/routes/docs/_content/architecture/ports-adapters.mdx';

export const Route = createFileRoute('/docs/_layout/architecture/ports-adapters')({
    component: ArchitecturePortsAdaptersComponent
});

function ArchitecturePortsAdaptersComponent() {
    return (
        <DocsPage
            title={frontmatter?.title || ''}
            description={frontmatter?.description || ''}
            currentPath="/docs/architecture/ports-adapters"
            filePath="architecture/ports-adapters"
            lastUpdated={frontmatter?.lastUpdated}
        >
            <MDXContent />
        </DocsPage>
    );
}
