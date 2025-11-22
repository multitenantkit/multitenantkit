import { MDXProvider } from '@mdx-js/react';
import type { ReactNode } from 'react';
import { Breadcrumbs } from './Breadcrumbs';
import { MDXComponents } from './MDXComponents';
import { PageMeta } from './PageMeta';
import { PageNavigation } from './PageNavigation';

interface DocsPageProps {
    title: string;
    description?: string;
    children: ReactNode;
    currentPath: string;
    filePath: string;
    lastUpdated?: string;
}

export function DocsPage({
    title,
    description,
    children,
    currentPath,
    filePath,
    lastUpdated
}: DocsPageProps) {
    return (
        <>
            <Breadcrumbs currentPath={currentPath} />
            <article className="prose prose-zinc dark:prose-invert max-w-none">
                <h1>{title}</h1>
                {description && <p className="lead">{description}</p>}
                <MDXProvider components={MDXComponents}>
                    <div className="mt-8">{children}</div>
                </MDXProvider>
                <PageMeta filePath={filePath} lastUpdated={lastUpdated} />
            </article>
            <PageNavigation currentPath={currentPath} />
        </>
    );
}
