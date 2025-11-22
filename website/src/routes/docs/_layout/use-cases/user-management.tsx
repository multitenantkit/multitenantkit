import { createFileRoute } from '@tanstack/react-router';
import { DocsPage } from '@/routes/docs/_components/DocsPage';
import MDXContent, { frontmatter } from '@/routes/docs/_content/use-cases/user-management.mdx';

export const Route = createFileRoute('/docs/_layout/use-cases/user-management')({
    component: UseCasesUserManagementComponent
});

function UseCasesUserManagementComponent() {
    return (
        <DocsPage
            title={frontmatter?.title || ''}
            description={frontmatter?.description || ''}
            currentPath="/docs/use-cases/user-management"
            filePath="use-cases/user-management"
            lastUpdated={frontmatter?.lastUpdated}
        >
            <MDXContent />
        </DocsPage>
    );
}
