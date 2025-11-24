import { createFileRoute } from '@tanstack/react-router';
import { DocsPage } from '@/routes/docs/_components/DocsPage';
import MDXContent, { frontmatter } from '@/routes/docs/_content/architecture/username.mdx';

export const Route = createFileRoute('/docs/_layout/architecture/username')({
    component: ArchitectureUsernameComponent
});

function ArchitectureUsernameComponent() {
    return (
        <DocsPage
            title={frontmatter?.title || ''}
            description={frontmatter?.description || ''}
            currentPath="/docs/architecture/username"
            filePath="architecture/username"
            lastUpdated={frontmatter?.lastUpdated}
        >
            <MDXContent />
        </DocsPage>
    );
}
