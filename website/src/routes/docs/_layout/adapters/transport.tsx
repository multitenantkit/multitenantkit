import { createFileRoute } from '@tanstack/react-router';
import { DocsPage } from '@/routes/docs/_components/DocsPage';
import MDXContent, { frontmatter } from '@/routes/docs/_content/adapters/transport.mdx';

export const Route = createFileRoute('/docs/_layout/adapters/transport')({
    component: AdaptersTransportComponent
});

function AdaptersTransportComponent() {
    return (
        <DocsPage
            title={frontmatter?.title || ''}
            description={frontmatter?.description || ''}
            currentPath="/docs/adapters/transport"
            filePath="adapters/transport"
            lastUpdated={frontmatter?.lastUpdated}
        >
            <MDXContent />
        </DocsPage>
    );
}
