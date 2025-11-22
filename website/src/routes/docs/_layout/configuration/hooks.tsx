import { createFileRoute } from '@tanstack/react-router';
import { DocsPage } from '@/routes/docs/_components/DocsPage';
import MDXContent, { frontmatter } from '@/routes/docs/_content/configuration/hooks.mdx';

export const Route = createFileRoute('/docs/_layout/configuration/hooks')({
    component: ConfigurationHooksComponent
});

function ConfigurationHooksComponent() {
    return (
        <DocsPage
            title={frontmatter?.title || ''}
            description={frontmatter?.description || ''}
            currentPath="/docs/configuration/hooks"
            filePath="configuration/hooks"
            lastUpdated={frontmatter?.lastUpdated}
        >
            <MDXContent />
        </DocsPage>
    );
}
