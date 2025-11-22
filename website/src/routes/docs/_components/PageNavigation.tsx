import { Link } from '@tanstack/react-router';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { docsStructure } from '../_lib/structure';

interface PageNavigationProps {
    currentPath: string;
}

interface PageLink {
    title: string;
    description: string;
    url: string;
}

export function PageNavigation({ currentPath }: PageNavigationProps) {
    const getPrevNext = (): { prev: PageLink | null; next: PageLink | null } => {
        // Flatten all pages into a single array
        const allPages = docsStructure.flatMap((section) => section.pages);

        // Find current page index
        const currentIndex = allPages.findIndex((page) => page.url === currentPath);

        if (currentIndex === -1) {
            return { prev: null, next: null };
        }

        const prev = currentIndex > 0 ? allPages[currentIndex - 1] : null;
        const next = currentIndex < allPages.length - 1 ? allPages[currentIndex + 1] : null;

        return { prev, next };
    };

    const { prev, next } = getPrevNext();

    if (!prev && !next) {
        return null;
    }

    return (
        <nav className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-800 grid grid-cols-1 md:grid-cols-2 gap-4">
            {prev ? (
                <Link
                    to={prev.url}
                    className="group flex items-start gap-3 p-4 rounded-lg border border-gray-200 dark:border-gray-800 hover:border-primary dark:hover:border-primary transition-colors"
                >
                    <ArrowLeft
                        size={20}
                        className="text-gray-400 group-hover:text-primary transition-colors mt-0.5 flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                            Previous
                        </div>
                        <div className="font-semibold text-gray-900 dark:text-gray-100 mb-1 group-hover:text-primary transition-colors">
                            {prev.title}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                            {prev.description}
                        </div>
                    </div>
                </Link>
            ) : (
                <div />
            )}

            {next && (
                <Link
                    to={next.url}
                    className="group flex items-start gap-3 p-4 rounded-lg border border-gray-200 dark:border-gray-800 hover:border-primary dark:hover:border-primary transition-colors md:col-start-2 text-right"
                >
                    <div className="flex-1 min-w-0">
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Next</div>
                        <div className="font-semibold text-gray-900 dark:text-gray-100 mb-1 group-hover:text-primary transition-colors">
                            {next.title}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                            {next.description}
                        </div>
                    </div>
                    <ArrowRight
                        size={20}
                        className="text-gray-400 group-hover:text-primary transition-colors mt-0.5 flex-shrink-0"
                    />
                </Link>
            )}
        </nav>
    );
}
