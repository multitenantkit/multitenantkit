import { createFileRoute } from '@tanstack/react-router';
import { DocsPage } from '@/routes/docs/_components/DocsPage';
import MDXContent, { frontmatter } from '@/routes/docs/_content/examples/advanced-setup.mdx';

export const Route = createFileRoute('/docs/_layout/examples/advanced-setup')({
    component: ExamplesAdvancedSetupComponent
});

function ExamplesAdvancedSetupComponent() {
    return (
        <DocsPage
            title={frontmatter?.title || ''}
            description={frontmatter?.description || ''}
            currentPath="/docs/examples/advanced-setup"
            filePath="examples/advanced-setup"
            lastUpdated={frontmatter?.lastUpdated}
        >
            <MDXContent />
        </DocsPage>
    );
}
