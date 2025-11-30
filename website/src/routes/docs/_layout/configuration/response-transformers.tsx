import { createFileRoute } from '@tanstack/react-router';
import { DocsPage } from '@/routes/docs/_components/DocsPage';
import MDXContent, {
    frontmatter
} from '@/routes/docs/_content/configuration/response-transformers.mdx';

export const Route = createFileRoute('/docs/_layout/configuration/response-transformers')({
    component: ConfigurationResponseTransformersComponent
});

function ConfigurationResponseTransformersComponent() {
    return (
        <DocsPage
            title={frontmatter?.title || ''}
            description={frontmatter?.description || ''}
            currentPath="/docs/configuration/response-transformers"
            filePath="configuration/response-transformers"
            lastUpdated={frontmatter?.lastUpdated}
        >
            <MDXContent />
        </DocsPage>
    );
}
