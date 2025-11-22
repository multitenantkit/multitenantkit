import { Check, Copy } from 'lucide-react';
import { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface CodeBlockProps {
    children: string;
    language?: string;
    title?: string;
}

export function CodeBlock({ children, language = 'typescript', title }: CodeBlockProps) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        await navigator.clipboard.writeText(children);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="relative group my-6">
            {title && (
                <div className="bg-gray-800 text-gray-200 px-4 py-2 text-sm font-mono rounded-t-lg">
                    {title}
                </div>
            )}
            <div className="relative">
                <button
                    onClick={handleCopy}
                    type="button"
                    className="absolute top-2 right-2 p-2 rounded-lg bg-gray-700 hover:bg-gray-600 opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label="Copy code"
                >
                    {copied ? (
                        <Check size={16} className="text-green-400" />
                    ) : (
                        <Copy size={16} className="text-gray-300" />
                    )}
                </button>
                <SyntaxHighlighter
                    language={language}
                    style={vscDarkPlus}
                    customStyle={{
                        margin: 0,
                        borderRadius: title ? '0 0 0.5rem 0.5rem' : '0.5rem',
                        padding: '1.5rem'
                    }}
                >
                    {children}
                </SyntaxHighlighter>
            </div>
        </div>
    );
}
