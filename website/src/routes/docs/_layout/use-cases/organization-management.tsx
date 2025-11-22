import { createFileRoute } from '@tanstack/react-router';
import { DocsPage } from '@/routes/docs/_components/DocsPage';
import MDXContent, {
    frontmatter
} from '@/routes/docs/_content/use-cases/organization-management.mdx';

export const Route = createFileRoute('/docs/_layout/use-cases/organization-management')({
    component: UseCasesOrganizationManagementComponent
});

function UseCasesOrganizationManagementComponent() {
    return (
        <DocsPage
            title={frontmatter?.title || ''}
            description={frontmatter?.description || ''}
            currentPath="/docs/use-cases/organization-management"
            filePath="use-cases/organization-management"
            lastUpdated={frontmatter?.lastUpdated}
        >
            <MDXContent />
        </DocsPage>
    );
}
