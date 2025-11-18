import { Check, Copy } from 'lucide-react';
import { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { cn, copyToClipboard } from '../../lib/utils';

interface CodeBlockProps {
    code: string;
    language?: string;
    showLineNumbers?: boolean;
    className?: string;
}

export function CodeBlock({
    code,
    language = 'typescript',
    showLineNumbers = false,
    className
}: CodeBlockProps) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        await copyToClipboard(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className={cn('relative group', className)}>
            <button
                onClick={handleCopy}
                className="absolute top-3 right-3 p-2 rounded-lg bg-gray-700 hover:bg-gray-600
                   text-gray-300 hover:text-white transition-all duration-150
                   opacity-0 group-hover:opacity-100 z-10"
                aria-label="Copy code"
            >
                {copied ? <Check size={16} /> : <Copy size={16} />}
            </button>

            <SyntaxHighlighter
                language={language}
                style={vscDarkPlus}
                showLineNumbers={showLineNumbers}
                customStyle={{
                    margin: 0,
                    borderRadius: '0.75rem',
                    fontSize: '0.875rem',
                    padding: '1.5rem'
                }}
                codeTagProps={{
                    style: {
                        fontFamily: 'JetBrains Mono, Consolas, monospace'
                    }
                }}
            >
                {code}
            </SyntaxHighlighter>
        </div>
    );
}
