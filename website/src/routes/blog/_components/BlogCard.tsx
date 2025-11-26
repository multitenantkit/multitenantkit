import { ArrowRight, Calendar, Clock } from 'lucide-react';
import type { BlogPostMeta } from '../_lib/types';
import { estimateReadingTime, formatDate } from '../_lib/utils';

interface BlogCardProps {
    post: BlogPostMeta;
    featured?: boolean;
}

export function BlogCard({ post, featured = false }: BlogCardProps) {
    const readingTime = estimateReadingTime(post.description || '');

    if (featured) {
        return (
            <a href={`/blog/${post.slug}`} className="group block">
                <article className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/5 to-accent/5 dark:from-primary/10 dark:to-accent/10 border border-gray-200 dark:border-dark-border hover:border-primary/50 dark:hover:border-primary/50 transition-all duration-300">
                    <div className="grid md:grid-cols-2 gap-0">
                        {/* Image */}
                        <div className="relative aspect-[16/10] md:aspect-auto overflow-hidden">
                            {post.coverImage ? (
                                <img
                                    src={post.coverImage}
                                    alt={post.title}
                                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                />
                            ) : (
                                <div className="absolute inset-0 bg-gradient-to-br from-primary to-accent opacity-20" />
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                            <span className="absolute top-4 left-4 px-3 py-1 text-xs font-semibold text-white bg-primary rounded-full">
                                Featured
                            </span>
                        </div>

                        {/* Content */}
                        <div className="p-6 md:p-8 flex flex-col justify-center">
                            <div className="flex flex-wrap gap-2 mb-4">
                                {post.tags?.slice(0, 3).map((tag) => (
                                    <span
                                        key={tag}
                                        className="px-2.5 py-0.5 text-xs font-medium text-primary bg-primary/10 rounded-full"
                                    >
                                        {tag}
                                    </span>
                                ))}
                            </div>

                            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-3 group-hover:text-primary transition-colors">
                                {post.title}
                            </h2>

                            <p className="text-gray-600 dark:text-gray-400 mb-6 line-clamp-3">
                                {post.description}
                            </p>

                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-500">
                                    <span className="flex items-center gap-1.5">
                                        <Calendar size={14} />
                                        {formatDate(post.date)}
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                        <Clock size={14} />
                                        {readingTime} min read
                                    </span>
                                </div>

                                <span className="flex items-center gap-1 text-primary font-medium group-hover:gap-2 transition-all">
                                    Read more
                                    <ArrowRight size={16} />
                                </span>
                            </div>
                        </div>
                    </div>
                </article>
            </a>
        );
    }

    return (
        <a href={`/blog/${post.slug}`} className="group block">
            <article className="h-full overflow-hidden rounded-xl bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border hover:border-primary/50 dark:hover:border-primary/50 hover:shadow-lg dark:hover:shadow-primary/5 transition-all duration-300">
                {/* Image */}
                <div className="relative aspect-[16/9] overflow-hidden">
                    {post.coverImage ? (
                        <img
                            src={post.coverImage}
                            alt={post.title}
                            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                    ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 dark:from-primary/30 dark:to-accent/30" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />
                </div>

                {/* Content */}
                <div className="p-5">
                    <div className="flex flex-wrap gap-2 mb-3">
                        {post.tags?.slice(0, 2).map((tag) => (
                            <span
                                key={tag}
                                className="px-2 py-0.5 text-xs font-medium text-primary bg-primary/10 rounded-full"
                            >
                                {tag}
                            </span>
                        ))}
                    </div>

                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2 group-hover:text-primary transition-colors line-clamp-2">
                        {post.title}
                    </h3>

                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                        {post.description}
                    </p>

                    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-500">
                        <span className="flex items-center gap-1">
                            <Calendar size={12} />
                            {formatDate(post.date)}
                        </span>
                        <span className="flex items-center gap-1">
                            <Clock size={12} />
                            {readingTime} min
                        </span>
                    </div>
                </div>
            </article>
        </a>
    );
}
