import { createFileRoute } from '@tanstack/react-router';
import { DocsPage } from '@/routes/docs/_components/DocsPage';
import MDXContent, {
    frontmatter
} from '@/routes/docs/_content/use-cases/membership-management.mdx';

export const Route = createFileRoute('/docs/_layout/use-cases/membership-management')({
    component: UseCasesMembershipManagementComponent
});

function UseCasesMembershipManagementComponent() {
    return (
        <DocsPage
            title={frontmatter?.title || ''}
            description={frontmatter?.description || ''}
            currentPath="/docs/use-cases/membership-management"
            filePath="use-cases/membership-management"
            lastUpdated={frontmatter?.lastUpdated}
        >
            <MDXContent />
        </DocsPage>
    );
}
