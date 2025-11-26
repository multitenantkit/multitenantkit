import { Link } from '@tanstack/react-router';
import { Github, Twitter } from 'lucide-react';
import { Container } from '../ui/Container';

export function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="border-t border-gray-200 dark:border-dark-border bg-light-surface dark:bg-dark-surface">
            <Container>
                <div className="py-12 md:py-16">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-12">
                        {/* Brand */}
                        <div className="col-span-1 md:col-span-2">
                            <div className="flex items-center space-x-2 mb-4">
                                <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
                                    <span className="text-white font-bold text-lg">M</span>
                                </div>
                                <span className="font-bold text-lg bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                                    MultiTenantKit
                                </span>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 max-w-xs">
                                Production-ready TypeScript toolkit for managing users,
                                organizations, and team memberships in B2B SaaS applications.
                            </p>
                            <div className="flex items-center space-x-4 mt-4">
                                <a
                                    href="https://github.com/multitenantkit/multitenantkit"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary transition-colors"
                                    aria-label="GitHub"
                                >
                                    <Github size={20} />
                                </a>
                                <a
                                    href="https://x.com/multitenantkit"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary transition-colors"
                                    aria-label="Twitter"
                                >
                                    <Twitter size={20} />
                                </a>
                            </div>
                        </div>

                        {/* Resources */}
                        <div>
                            <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100 mb-3">
                                Resources
                            </h3>
                            <ul className="space-y-2">
                                <li>
                                    <Link
                                        to="/docs"
                                        className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary transition-colors"
                                    >
                                        Documentation
                                    </Link>
                                </li>
                                <li>
                                    <a
                                        href="/blog"
                                        className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary transition-colors"
                                    >
                                        Blog
                                    </a>
                                </li>
                                <li>
                                    <a
                                        href="https://github.com/multitenantkit/multitenantkit"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary transition-colors"
                                    >
                                        GitHub
                                    </a>
                                </li>
                            </ul>
                        </div>

                        {/* Community */}
                        <div>
                            <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100 mb-3">
                                Community
                            </h3>
                            <ul className="space-y-2">
                                <li>
                                    <a
                                        href="https://github.com/multitenantkit/multitenantkit/issues"
                                        className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary transition-colors"
                                    >
                                        Issues
                                    </a>
                                </li>
                                <li>
                                    <a
                                        href="https://github.com/multitenantkit/multitenantkit/issues"
                                        className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary transition-colors"
                                    >
                                        Discussions
                                    </a>
                                </li>
                                <li>
                                    <a
                                        href="https://github.com/multitenantkit/multitenantkit/blob/main/CONTRIBUTING.md"
                                        className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary transition-colors"
                                    >
                                        Contributing
                                    </a>
                                </li>
                            </ul>
                        </div>
                    </div>

                    <div className="mt-12 pt-8 border-t border-gray-200 dark:border-dark-border">
                        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                © {currentYear} MultiTenantKit. Released under the MIT License.
                            </p>
                            <div className="flex items-center space-x-6">
                                <a
                                    href="https://github.com/multitenantkit/multitenantkit/blob/main/LICENSE"
                                    className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary transition-colors"
                                >
                                    License
                                </a>
                                <Link
                                    to="/privacy"
                                    className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary transition-colors"
                                >
                                    Privacy
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </Container>
        </footer>
    );
}
