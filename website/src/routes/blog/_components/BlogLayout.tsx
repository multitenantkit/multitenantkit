import type { ReactNode } from 'react';
import { BlogHeader } from './BlogHeader';

interface BlogLayoutProps {
    children: ReactNode;
}

export function BlogLayout({ children }: BlogLayoutProps) {
    return (
        <div className="min-h-screen bg-gradient-to-b from-light-bg via-light-surface to-light-bg dark:from-dark-bg dark:via-dark-surface dark:to-dark-bg">
            <BlogHeader />
            <main className="px-4 sm:px-6 lg:px-8 py-12">{children}</main>

            {/* Footer */}
            <footer className="border-t border-gray-200 dark:border-dark-border py-8">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <p className="text-sm text-gray-500 dark:text-gray-500">
                            © {new Date().getFullYear()} MultiTenantKit. All rights reserved.
                        </p>
                        <div className="flex items-center gap-6">
                            <a
                                href="https://github.com/multitenantkit/multitenantkit"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-gray-500 dark:text-gray-500 hover:text-primary transition-colors"
                            >
                                GitHub
                            </a>
                            <a
                                href="/docs"
                                className="text-sm text-gray-500 dark:text-gray-500 hover:text-primary transition-colors"
                            >
                                Documentation
                            </a>
                            <a
                                href="/privacy"
                                className="text-sm text-gray-500 dark:text-gray-500 hover:text-primary transition-colors"
                            >
                                Privacy
                            </a>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
