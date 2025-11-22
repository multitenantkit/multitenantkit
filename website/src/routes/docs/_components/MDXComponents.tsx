import { Callout } from './Callout';
import { CodeBlock } from './CodeBlock';
import { CopyButton } from './CopyButton';

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

export const MDXComponents = {
    Callout,
    CodeBlock,
    pre: ({ children, ...props }: React.HTMLProps<HTMLPreElement>) => {
        const textContent = extractTextFromChildren(children);

        return (
            <div className="relative group mb-4">
                <pre
                    className="overflow-x-auto rounded-lg border border-zinc-800 p-4 text-sm !bg-zinc-900 dark:!bg-zinc-800"
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
            // remove ::before and ::after from <code ..>
            return (
                <code
                    className="rounded bg-zinc-900 px-1.5 py-0.5 text-sm text-zinc-100 dark:bg-zinc-800 [&::before]:hidden [&::after]:hidden"
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
        <h1 className="text-4xl font-bold mb-6" {...props}>
            {children}
        </h1>
    ),
    h2: ({ children, ...props }: React.HTMLProps<HTMLHeadingElement>) => (
        <h2 className="text-3xl font-bold mt-12 mb-4" {...props}>
            {children}
        </h2>
    ),
    h3: ({ children, ...props }: React.HTMLProps<HTMLHeadingElement>) => (
        <h3 className="text-2xl font-semibold mt-8 mb-3" {...props}>
            {children}
        </h3>
    ),
    p: ({ children, ...props }: React.HTMLProps<HTMLParagraphElement>) => (
        <p className="my-2 leading-7" {...props}>
            {children}
        </p>
    ),
    ul: ({ children, ...props }: React.HTMLProps<HTMLUListElement>) => (
        <ul className="list-disc list-inside mb-4 space-y-2" {...props}>
            {children}
        </ul>
    ),
    li: ({ children, ...props }: React.HTMLProps<HTMLLIElement>) => (
        <li className="leading-7" {...props}>
            {children}
        </li>
    ),
    a: ({ children, href, ...props }: React.HTMLProps<HTMLAnchorElement>) => (
        <a href={href} className="text-blue-600 dark:text-blue-400 hover:underline" {...props}>
            {children}
        </a>
    )
};
