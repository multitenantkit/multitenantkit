import { createFileRoute } from '@tanstack/react-router';
import { DocsPage } from '@/routes/docs/_components/DocsPage';
import MDXContent, { frontmatter } from '@/routes/docs/_content/adapters/persistence.mdx';

export const Route = createFileRoute('/docs/_layout/adapters/persistence')({
    component: AdaptersPersistenceComponent
});

function AdaptersPersistenceComponent() {
    return (
        <DocsPage
            title={frontmatter?.title || ''}
            description={frontmatter?.description || ''}
            currentPath="/docs/adapters/persistence"
            filePath="adapters/persistence"
            lastUpdated={frontmatter?.lastUpdated}
        >
            <MDXContent />
        </DocsPage>
    );
}
