import { ExternalLink } from 'lucide-react';

interface EditThisPageProps {
    filePath: string;
}

export function EditThisPage({ filePath }: EditThisPageProps) {
    const githubRepoUrl = 'https://github.com/multitenantkit/multitenantkit';
    const editUrl = `${githubRepoUrl}/edit/main/website/src/routes/docs/_content/${filePath}.mdx`;

    return (
        <a
            href={editUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary transition-colors"
        >
            <ExternalLink size={16} />
            Edit this page on GitHub
        </a>
    );
}
