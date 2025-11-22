import { createFileRoute } from '@tanstack/react-router';
import { DocsPage } from '@/routes/docs/_components/DocsPage';
import MDXContent, { frontmatter } from '@/routes/docs/_content/adapters/authentication.mdx';

export const Route = createFileRoute('/docs/_layout/adapters/authentication')({
    component: AdaptersAuthenticationComponent
});

function AdaptersAuthenticationComponent() {
    return (
        <DocsPage
            title={frontmatter?.title || ''}
            description={frontmatter?.description || ''}
            currentPath="/docs/adapters/authentication"
            filePath="adapters/authentication"
            lastUpdated={frontmatter?.lastUpdated}
        >
            <MDXContent />
        </DocsPage>
    );
}
