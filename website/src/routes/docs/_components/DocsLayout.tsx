import { Link } from '@tanstack/react-router';
import { Menu, Search, X } from 'lucide-react';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { docsStructure } from '../_lib/structure';
import { SearchDialog } from './SearchDialog';
import { TableOfContents } from './TableOfContents';
import { ThemeToggle } from './ThemeToggle';

interface DocsLayoutProps {
    children: ReactNode;
}

export function DocsLayout({ children }: DocsLayoutProps) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);

    // Keyboard shortcut: Cmd/Ctrl + K
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setIsSearchOpen(true);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    return (
        <div className="min-h-screen bg-gradient-to-b from-light-bg via-light-surface to-light-bg dark:from-dark-bg dark:via-dark-surface dark:to-dark-bg">
            {/* Mobile menu button */}
            <button
                type="button"
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-light-surface dark:bg-dark-surface"
                aria-label="Toggle menu"
            >
                {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            {/* Sidebar */}
            <aside
                className={`
                    fixed top-0 left-0 h-screen w-64 bg-light-surface dark:bg-dark-surface border-r border-light-border dark:border-dark-border overflow-y-auto
                    transition-transform duration-300 z-40
                    ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
                `}
            >
                <div className="p-6">
                    <div className="flex items-center justify-between mb-4 mt-10 lg:mt-0">
                        <Link to="/" className="flex items-center space-x-2 group">
                            <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                                <span className="text-white font-bold text-lg">M</span>
                            </div>
                            <span className="font-bold text-lg bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                                MultiTenantKit
                            </span>
                        </Link>
                        <ThemeToggle />
                    </div>

                    {/* Search Button */}
                    <button
                        type="button"
                        onClick={() => setIsSearchOpen(true)}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    >
                        <Search size={16} />
                        <span className="flex-1 text-left">Search...</span>
                        <kbd className="hidden sm:inline-block px-2 py-0.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded">
                            ⌘K
                        </kbd>
                    </button>
                </div>

                <nav className="px-4 pb-6">
                    {docsStructure.map((section, idx) => (
                        <div key={`${section.title}-${idx}`} className="mb-6">
                            <h3 className="px-3 mb-2 text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase">
                                {section.title}
                            </h3>
                            <ul className="space-y-1">
                                {section.pages.map((page) => (
                                    <li key={page.url}>
                                        <Link
                                            to={page.url}
                                            className="block px-3 py-2 rounded-lg text-sm hover:bg-light-bg dark:hover:bg-dark-bg transition-colors"
                                            activeProps={{
                                                className: 'bg-primary/10 text-primary font-medium'
                                            }}
                                        >
                                            {page.title}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </nav>
            </aside>

            {/* Main content area */}
            <div className="lg:pl-64">
                <div className="flex">
                    {/* Content */}
                    <main className="flex-1 min-w-0 px-6 py-12 max-w-4xl">{children}</main>

                    {/* Table of Contents - Right Sidebar */}
                    <aside className="hidden xl:block w-64 flex-shrink-0 py-12 pr-6 sticky top-0 h-screen overflow-y-auto">
                        <TableOfContents />
                    </aside>
                </div>
            </div>

            {/* Overlay for mobile */}
            {isSidebarOpen && (
                <button
                    type="button"
                    onClick={() => setIsSidebarOpen(false)}
                    className="lg:hidden fixed inset-0 bg-black/50 z-30"
                    aria-label="Close sidebar"
                />
            )}

            {/* Search Dialog */}
            <SearchDialog open={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
        </div>
    );
}
