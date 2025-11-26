import { MDXProvider } from '@mdx-js/react';
import { Link } from '@tanstack/react-router';
import { ArrowLeft, Calendar, Clock, Linkedin, Link as LinkIcon, Twitter } from 'lucide-react';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { estimateReadingTime, formatDate } from '../_lib/utils';
import { BlogMDXComponents } from './BlogMDXComponents';

interface BlogPostProps {
    title: string;
    description?: string;
    date: string;
    author?: string;
    coverImage?: string;
    tags?: string[];
    children: ReactNode;
    slug: string;
}

export function BlogPost({
    title,
    description,
    date,
    author,
    coverImage,
    tags,
    children,
    slug
}: BlogPostProps) {
    const [copied, setCopied] = useState(false);
    const readingTime = estimateReadingTime(description || '');
    const postUrl = `https://multitenantkit.dev/blog/${slug}`;

    const handleCopyLink = async () => {
        await navigator.clipboard.writeText(postUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const shareOnTwitter = () => {
        const text = encodeURIComponent(`${title} by @multitenantkit`);
        const url = encodeURIComponent(postUrl);
        window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank');
    };

    const shareOnLinkedIn = () => {
        const url = encodeURIComponent(postUrl);
        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, '_blank');
    };

    return (
        <article className="max-w-4xl mx-auto">
            {/* Back link */}
            <Link
                to="/blog"
                className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary transition-colors mb-8"
            >
                <ArrowLeft size={16} />
                <span className="text-sm font-medium">Back to Blog</span>
            </Link>

            {/* Header */}
            <header className="mb-8">
                {/* Tags */}
                {tags && tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                        {tags.map((tag) => (
                            <span
                                key={tag}
                                className="px-3 py-1 text-xs font-medium text-primary bg-primary/10 rounded-full"
                            >
                                {tag}
                            </span>
                        ))}
                    </div>
                )}

                {/* Title */}
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-gray-100 leading-tight mb-4">
                    {title}
                </h1>

                {/* Description */}
                {description && (
                    <p className="text-xl text-gray-600 dark:text-gray-400 mb-6">{description}</p>
                )}

                {/* Meta */}
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-500">
                    {author && (
                        <span className="font-medium text-gray-700 dark:text-gray-300">
                            {author}
                        </span>
                    )}
                    <span className="flex items-center gap-1.5">
                        <Calendar size={14} />
                        {formatDate(date)}
                    </span>
                    <span className="flex items-center gap-1.5">
                        <Clock size={14} />
                        {readingTime} min read
                    </span>
                </div>
            </header>

            {/* Cover Image */}
            {coverImage && (
                <div className="relative aspect-[2/1] rounded-2xl overflow-hidden mb-10 shadow-xl">
                    <img
                        src={coverImage}
                        alt={title}
                        className="absolute inset-0 w-full h-full object-cover"
                    />
                </div>
            )}

            {/* Content */}
            <div className="prose prose-lg prose-zinc dark:prose-invert max-w-none">
                <MDXProvider components={BlogMDXComponents}>{children}</MDXProvider>
            </div>

            {/* Share Section */}
            <footer className="mt-16 pt-8 border-t border-gray-200 dark:border-dark-border">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">
                            Share this article
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-500">
                            Help others discover this content
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={shareOnTwitter}
                            className="p-2.5 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-[#1DA1F2] hover:text-white transition-colors"
                            aria-label="Share on Twitter"
                        >
                            <Twitter size={18} />
                        </button>
                        <button
                            type="button"
                            onClick={shareOnLinkedIn}
                            className="p-2.5 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-[#0A66C2] hover:text-white transition-colors"
                            aria-label="Share on LinkedIn"
                        >
                            <Linkedin size={18} />
                        </button>
                        <button
                            type="button"
                            onClick={handleCopyLink}
                            className="p-2.5 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-primary hover:text-white transition-colors relative"
                            aria-label="Copy link"
                        >
                            <LinkIcon size={18} />
                            {copied && (
                                <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 text-xs bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded whitespace-nowrap">
                                    Copied!
                                </span>
                            )}
                        </button>
                    </div>
                </div>
            </footer>
        </article>
    );
}
