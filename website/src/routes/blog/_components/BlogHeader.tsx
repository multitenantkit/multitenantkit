import { Link } from '@tanstack/react-router';
import { ArrowLeft, Moon, Sun } from 'lucide-react';
import { useTheme } from '@/lib/theme';

export function BlogHeader() {
    const { theme, toggleTheme } = useTheme();

    return (
        <header className="sticky top-0 z-50 w-full bg-white/80 dark:bg-dark-bg/80 backdrop-blur-lg border-b border-gray-200 dark:border-dark-border">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <nav className="flex items-center justify-between h-16">
                    {/* Logo / Back */}
                    <div className="flex items-center gap-4">
                        <Link
                            to="/"
                            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                        >
                            <ArrowLeft size={18} />
                            <span className="hidden sm:inline text-sm">Back to Home</span>
                        </Link>
                        <div className="w-px h-6 bg-gray-200 dark:bg-gray-700" />
                        <Link to="/blog" className="flex items-center space-x-2 group">
                            <div className="w-7 h-7 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                                <span className="text-white font-bold text-sm">M</span>
                            </div>
                            <span className="font-semibold text-lg bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                                Blog
                            </span>
                        </Link>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                        <Link
                            to="/docs"
                            className="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-primary transition-colors"
                        >
                            Docs
                        </Link>
                        <button
                            type="button"
                            onClick={toggleTheme}
                            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            aria-label="Toggle theme"
                        >
                            {theme === 'dark' ? (
                                <Sun size={18} className="text-gray-700 dark:text-gray-300" />
                            ) : (
                                <Moon size={18} className="text-gray-700 dark:text-gray-300" />
                            )}
                        </button>
                    </div>
                </nav>
            </div>
        </header>
    );
}
