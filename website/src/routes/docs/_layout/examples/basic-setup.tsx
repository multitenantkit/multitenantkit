import { createFileRoute } from '@tanstack/react-router';
import { DocsPage } from '@/routes/docs/_components/DocsPage';
import MDXContent, { frontmatter } from '@/routes/docs/_content/examples/basic-setup.mdx';

export const Route = createFileRoute('/docs/_layout/examples/basic-setup')({
    component: ExamplesBasicSetupComponent
});

function ExamplesBasicSetupComponent() {
    return (
        <DocsPage
            title={frontmatter?.title || ''}
            description={frontmatter?.description || ''}
            currentPath="/docs/examples/basic-setup"
            filePath="examples/basic-setup"
            lastUpdated={frontmatter?.lastUpdated}
        >
            <MDXContent />
        </DocsPage>
    );
}
