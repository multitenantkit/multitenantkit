import { createFileRoute } from '@tanstack/react-router';
import { DocsPage } from '@/routes/docs/_components/DocsPage';
import MDXContent, { frontmatter } from '@/routes/docs/_content/configuration/custom-fields.mdx';

export const Route = createFileRoute('/docs/_layout/configuration/custom-fields')({
    component: ConfigurationCustomFieldsComponent
});

function ConfigurationCustomFieldsComponent() {
    return (
        <DocsPage
            title={frontmatter?.title || ''}
            description={frontmatter?.description || ''}
            currentPath="/docs/configuration/custom-fields"
            filePath="configuration/custom-fields"
            lastUpdated={frontmatter?.lastUpdated}
        >
            <MDXContent />
        </DocsPage>
    );
}
