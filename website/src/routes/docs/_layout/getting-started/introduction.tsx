import { createFileRoute } from '@tanstack/react-router';
import { DocsPage } from '@/routes/docs/_components/DocsPage';
import MDXContent, { frontmatter } from '@/routes/docs/_content/getting-started/introduction.mdx';

export const Route = createFileRoute('/docs/_layout/getting-started/introduction')({
    component: GettingStartedIntroductionComponent
});

function GettingStartedIntroductionComponent() {
    return (
        <DocsPage
            title={frontmatter?.title || ''}
            description={frontmatter?.description || ''}
            currentPath="/docs/getting-started/introduction"
            filePath="getting-started/introduction"
            lastUpdated={frontmatter?.lastUpdated}
        >
            <MDXContent />
        </DocsPage>
    );
}
