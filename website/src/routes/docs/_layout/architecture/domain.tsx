import { createFileRoute } from '@tanstack/react-router';
import { DocsPage } from '@/routes/docs/_components/DocsPage';
import MDXContent, { frontmatter } from '@/routes/docs/_content/architecture/domain.mdx';

export const Route = createFileRoute('/docs/_layout/architecture/domain')({
    component: ArchitectureDomainComponent
});

function ArchitectureDomainComponent() {
    return (
        <DocsPage
            title={frontmatter?.title || ''}
            description={frontmatter?.description || ''}
            currentPath="/docs/architecture/domain"
            filePath="architecture/domain"
            lastUpdated={frontmatter?.lastUpdated}
        >
            <MDXContent />
        </DocsPage>
    );
}
