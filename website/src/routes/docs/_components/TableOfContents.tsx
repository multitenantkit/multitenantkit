import { useLocation } from '@tanstack/react-router';
import { useEffect, useState } from 'react';

interface Heading {
    id: string;
    text: string;
    level: number;
}

export function TableOfContents() {
    const location = useLocation();
    const [headings, setHeadings] = useState<Heading[]>([]);
    const [activeId, setActiveId] = useState<string>('');

    // biome-ignore lint/correctness/useExhaustiveDependencies: ignore
    useEffect(() => {
        // Small delay to ensure DOM is updated after navigation
        const timeoutId = setTimeout(() => {
            // Extract headings from the page
            const elements = Array.from(document.querySelectorAll('h2, h3, h4'));
            const headingsList: Heading[] = elements
                .map((element) => ({
                    id: element.id,
                    text: element.textContent || '',
                    level: Number(element.tagName.charAt(1))
                }))
                .filter((heading) => heading.id); // Only include headings with IDs

            setHeadings(headingsList);
            setActiveId(''); // Reset active heading on page change

            // Intersection Observer for active heading detection
            const observer = new IntersectionObserver(
                (entries) => {
                    entries.forEach((entry) => {
                        if (entry.isIntersecting) {
                            setActiveId(entry.target.id);
                        }
                    });
                },
                {
                    rootMargin: '-80px 0px -40% 0px',
                    threshold: 0.5
                }
            );

            elements.forEach((element) => {
                if (element.id) {
                    observer.observe(element);
                }
            });

            // Handle scroll to detect when we're at the bottom
            const handleScroll = () => {
                const scrollHeight = document.documentElement.scrollHeight;
                const scrollTop = document.documentElement.scrollTop;
                const clientHeight = document.documentElement.clientHeight;

                // Check if we're near the bottom (within 100px)
                if (scrollHeight - scrollTop - clientHeight < 100) {
                    // Activate the last heading
                    const lastHeading = headingsList[headingsList.length - 1];
                    if (lastHeading) {
                        setActiveId(lastHeading.id);
                    }
                }
            };

            window.addEventListener('scroll', handleScroll);

            return () => {
                elements.forEach((element) => {
                    if (element.id) {
                        observer.unobserve(element);
                    }
                });
                window.removeEventListener('scroll', handleScroll);
            };
        }, 100);

        return () => clearTimeout(timeoutId);
    }, [location.pathname]);

    const handleClick = (id: string) => {
        const element = document.getElementById(id);
        if (element) {
            const offset = 80; // Account for fixed header
            const elementPosition = element.getBoundingClientRect().top + window.scrollY;
            window.scrollTo({
                top: elementPosition - offset,
                behavior: 'smooth'
            });
        }
    };

    if (headings.length === 0) {
        return null;
    }

    return (
        <nav className="space-y-1">
            <p className="font-semibold text-sm text-gray-900 dark:text-gray-100 mb-3">
                On this page
            </p>
            <ul className="space-y-2 text-sm">
                {headings.map((heading) => (
                    <li
                        key={heading.id}
                        style={{
                            paddingLeft: `${(heading.level - 2) * 12}px`
                        }}
                    >
                        <button
                            type="button"
                            onClick={() => handleClick(heading.id)}
                            className={`text-left w-full hover:text-primary transition-colors ${
                                activeId === heading.id
                                    ? 'text-primary font-medium'
                                    : 'text-gray-600 dark:text-gray-400'
                            }`}
                        >
                            {heading.text}
                        </button>
                    </li>
                ))}
            </ul>
        </nav>
    );
}
