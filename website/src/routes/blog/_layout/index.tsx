import { createFileRoute } from '@tanstack/react-router';
import { Rss } from 'lucide-react';
import { BlogCard } from '../_components/BlogCard';
import { getAllPosts, getFeaturedPosts } from '../_lib/posts';

export const Route = createFileRoute('/blog/_layout/')({
    component: BlogIndexPage
});

function BlogIndexPage() {
    const featuredPosts = getFeaturedPosts();
    const allPosts = getAllPosts();
    const regularPosts = allPosts.filter((post) => !post.featured);

    return (
        <div className="max-w-5xl mx-auto">
            {/* Hero Section */}
            <header className="text-center mb-16">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary text-sm font-medium mb-6">
                    <Rss size={16} />
                    <span>MultiTenantKit Blog</span>
                </div>
                <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                    Latest Updates & Tutorials
                </h1>
                <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                    News, tutorials, and insights from the MultiTenantKit team. Learn about
                    multi-tenant architecture, TypeScript best practices, and building B2B SaaS.
                </p>
            </header>

            {/* Featured Posts */}
            {featuredPosts.length > 0 && (
                <section className="mb-16">
                    <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-6">
                        Featured
                    </h2>
                    <div className="space-y-8">
                        {featuredPosts.map((post) => (
                            <BlogCard key={post.slug} post={post} featured />
                        ))}
                    </div>
                </section>
            )}

            {/* All Posts */}
            {regularPosts.length > 0 && (
                <section>
                    <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-6">
                        All Posts
                    </h2>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {regularPosts.map((post) => (
                            <BlogCard key={post.slug} post={post} />
                        ))}
                    </div>
                </section>
            )}

            {/* Empty State */}
            {allPosts.length === 0 && (
                <div className="text-center py-20">
                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Rss size={32} className="text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                        No posts yet
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400">
                        Check back soon for new content!
                    </p>
                </div>
            )}

            {/* Newsletter CTA */}
            <section className="mt-20 p-8 sm:p-12 bg-gradient-to-br from-primary/5 to-accent/5 dark:from-primary/10 dark:to-accent/10 rounded-2xl border border-gray-200 dark:border-dark-border text-center">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">
                    Stay Updated
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-lg mx-auto">
                    Get notified when we publish new articles. No spam, just valuable content about
                    building multi-tenant SaaS applications.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                    <a
                        href="https://github.com/multitenantkit/multitenantkit"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 px-6 py-3 bg-primary hover:bg-primary-dark text-white font-medium rounded-lg transition-colors text-center"
                    >
                        Star on GitHub
                    </a>
                    <a
                        href="/docs"
                        className="flex-1 px-6 py-3 bg-white dark:bg-dark-surface hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-900 dark:text-gray-100 font-medium rounded-lg border border-gray-200 dark:border-dark-border transition-colors text-center"
                    >
                        Read the Docs
                    </a>
                </div>
            </section>
        </div>
    );
}
