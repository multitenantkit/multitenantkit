import { Callout } from '@/routes/docs/_components/Callout';
import { CopyButton } from '@/routes/docs/_components/CopyButton';

function extractTextFromChildren(children: React.ReactNode): string {
    if (typeof children === 'string') {
        return children;
    }
    if (Array.isArray(children)) {
        return children.map(extractTextFromChildren).join('');
    }
    if (children && typeof children === 'object' && 'props' in children) {
        return extractTextFromChildren(children.props.children);
    }
    return '';
}

export const BlogMDXComponents = {
    Callout,
    pre: ({ children, ...props }: React.HTMLProps<HTMLPreElement>) => {
        const textContent = extractTextFromChildren(children);

        return (
            <div className="relative group my-6">
                <pre
                    className="overflow-x-auto rounded-xl border border-zinc-800 p-4 text-sm !bg-zinc-900 dark:!bg-zinc-800"
                    {...props}
                >
                    {children}
                </pre>
                {textContent && (
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <CopyButton text={textContent} />
                    </div>
                )}
            </div>
        );
    },
    code: ({ children, className, ...props }: React.HTMLProps<HTMLElement>) => {
        const isInline = !className;

        if (isInline) {
            return (
                <code
                    className="rounded bg-zinc-800 dark:bg-zinc-800 px-1.5 py-0.5 text-sm text-zinc-800 dark:text-zinc-100 [&::before]:hidden [&::after]:hidden font-mono"
                    {...props}
                >
                    {children}
                </code>
            );
        }

        return (
            <code className={className} {...props}>
                {children}
            </code>
        );
    },
    h1: ({ children, ...props }: React.HTMLProps<HTMLHeadingElement>) => (
        <h1 className="text-4xl font-bold mt-12 mb-6 first:mt-0" {...props}>
            {children}
        </h1>
    ),
    h2: ({ children, ...props }: React.HTMLProps<HTMLHeadingElement>) => (
        <h2
            className="text-3xl font-bold mt-12 mb-4 pb-2 border-b border-gray-200 dark:border-dark-border"
            {...props}
        >
            {children}
        </h2>
    ),
    h3: ({ children, ...props }: React.HTMLProps<HTMLHeadingElement>) => (
        <h3 className="text-2xl font-semibold mt-10 mb-4" {...props}>
            {children}
        </h3>
    ),
    h4: ({ children, ...props }: React.HTMLProps<HTMLHeadingElement>) => (
        <h4 className="text-xl font-semibold mt-8 mb-3" {...props}>
            {children}
        </h4>
    ),
    p: ({ children, ...props }: React.HTMLProps<HTMLParagraphElement>) => (
        <p className="my-5 leading-8 text-gray-700 dark:text-gray-300" {...props}>
            {children}
        </p>
    ),
    ul: ({ children, ...props }: React.HTMLProps<HTMLUListElement>) => (
        <ul className="my-5 space-y-3 list-none" {...props}>
            {children}
        </ul>
    ),
    ol: ({ children }: React.HTMLProps<HTMLOListElement>) => (
        <ol className="my-5 space-y-3 list-decimal list-inside">{children}</ol>
    ),
    li: ({ children, ...props }: React.HTMLProps<HTMLLIElement>) => (
        <li
            className="leading-7 text-gray-700 dark:text-gray-300 pl-6 relative before:content-[''] before:absolute before:left-0 before:top-3 before:w-2 before:h-2 before:bg-primary before:rounded-full"
            {...props}
        >
            {children}
        </li>
    ),
    a: ({ children, href, ...props }: React.HTMLProps<HTMLAnchorElement>) => (
        <a
            href={href}
            className="text-primary hover:text-primary-dark underline underline-offset-2 decoration-primary/30 hover:decoration-primary transition-colors"
            target={href?.startsWith('http') ? '_blank' : undefined}
            rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
            {...props}
        >
            {children}
        </a>
    ),
    blockquote: ({ children, ...props }: React.HTMLProps<HTMLQuoteElement>) => (
        <blockquote
            className="my-6 pl-6 border-l-4 border-primary/50 italic text-gray-600 dark:text-gray-400 bg-primary/5 py-4 pr-4 rounded-r-lg"
            {...props}
        >
            {children}
        </blockquote>
    ),
    img: ({ src, alt, ...props }: React.HTMLProps<HTMLImageElement>) => (
        <figure className="my-8">
            <img
                src={src}
                alt={alt}
                className="rounded-xl w-full shadow-lg"
                loading="lazy"
                {...props}
            />
            {alt && (
                <figcaption className="mt-3 text-center text-sm text-gray-500 dark:text-gray-500">
                    {alt}
                </figcaption>
            )}
        </figure>
    ),
    hr: () => <hr className="my-12 border-t border-gray-200 dark:border-dark-border" />,
    strong: ({ children, ...props }: React.HTMLProps<HTMLElement>) => (
        <strong className="font-semibold text-gray-900 dark:text-gray-100" {...props}>
            {children}
        </strong>
    ),
    table: ({ children, ...props }: React.HTMLProps<HTMLTableElement>) => (
        <div className="my-6 overflow-x-auto rounded-lg border border-gray-200 dark:border-dark-border">
            <table
                className="min-w-full divide-y divide-gray-200 dark:divide-dark-border"
                {...props}
            >
                {children}
            </table>
        </div>
    ),
    th: ({ children, ...props }: React.HTMLProps<HTMLTableCellElement>) => (
        <th
            className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-dark-surface"
            {...props}
        >
            {children}
        </th>
    ),
    td: ({ children, ...props }: React.HTMLProps<HTMLTableCellElement>) => (
        <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300" {...props}>
            {children}
        </td>
    )
};
