import { Link } from '@tanstack/react-router';
import { ChevronRight } from 'lucide-react';
import { docsStructure } from '../_lib/structure';

interface BreadcrumbsProps {
    currentPath: string;
}

interface BreadcrumbItem {
    title: string;
    url: string;
}

export function Breadcrumbs({ currentPath }: BreadcrumbsProps) {
    const getBreadcrumbs = (): BreadcrumbItem[] => {
        const breadcrumbs: BreadcrumbItem[] = [{ title: 'Docs', url: '/docs' }];

        // Find the current page in the structure
        for (const section of docsStructure) {
            const page = section.pages.find((p) => p.url === currentPath);
            if (page) {
                // Add section if it has multiple pages or a specific parent
                if (section.pages.length > 1) {
                    breadcrumbs.push({
                        title: section.title,
                        url: section.pages[0].url // First page of section as section link
                    });
                }
                breadcrumbs.push({
                    title: page.title,
                    url: page.url
                });
                break;
            }
        }

        return breadcrumbs;
    };

    const breadcrumbs = getBreadcrumbs();

    return (
        <nav className="flex items-center space-x-2 text-sm mb-6 mt-6 lg:mt-0">
            {breadcrumbs.map((item, index) => (
                <div key={item.url} className="flex items-center space-x-2">
                    {index > 0 && (
                        <ChevronRight size={14} className="text-gray-400 dark:text-gray-600" />
                    )}
                    {index === breadcrumbs.length - 1 ? (
                        <span className="text-gray-900 dark:text-gray-100 font-medium">
                            {item.title}
                        </span>
                    ) : (
                        <Link
                            to={item.url}
                            className="text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary transition-colors"
                        >
                            {item.title}
                        </Link>
                    )}
                </div>
            ))}
        </nav>
    );
}
