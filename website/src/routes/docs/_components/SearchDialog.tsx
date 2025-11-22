import { Link } from '@tanstack/react-router';
import { Search, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { type SearchResult, searchDocs } from '../_lib/search';

interface SearchDialogProps {
    open: boolean;
    onClose: () => void;
}

export function SearchDialog({ open, onClose }: SearchDialogProps) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [selectedIndex, setSelectedIndex] = useState(0);

    useEffect(() => {
        if (query.trim().length > 0) {
            const searchResults = searchDocs(query);
            setResults(searchResults);
            setSelectedIndex(0);
        } else {
            setResults([]);
        }
    }, [query]);

    useEffect(() => {
        if (!open) {
            setQuery('');
            setResults([]);
            setSelectedIndex(0);
        }
    }, [open]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!open) return;

            if (e.key === 'Escape') {
                onClose();
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : prev));
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
            } else if (e.key === 'Enter' && results[selectedIndex]) {
                window.location.href = results[selectedIndex].url;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [open, results, selectedIndex, onClose]);

    if (!open) return null;

    return (
        <button
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
            onKeyDown={(e) => e.key === 'Escape' && onClose()}
            type="button"
            tabIndex={-1}
            aria-label="Close search dialog"
        >
            <div
                className="fixed inset-x-4 top-20 mx-auto max-w-2xl"
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.stopPropagation()}
                role="dialog"
                aria-label="Search dialog"
            >
                <div className="rounded-xl border border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl">
                    {/* Search Input */}
                    <div className="flex items-center border-b border-zinc-200 dark:border-zinc-800 px-4">
                        <Search size={20} className="text-zinc-400" />
                        <input
                            type="text"
                            placeholder="Search documentation..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            className="flex-1 bg-transparent px-4 py-4 text-sm outline-none text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400"
                        />
                        <button
                            type="button"
                            onClick={onClose}
                            className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                        >
                            <X size={16} className="text-zinc-400" />
                        </button>
                    </div>

                    {/* Results */}
                    <div className="max-h-96 overflow-y-auto p-2">
                        {query.trim().length === 0 ? (
                            <div className="py-12 text-center text-sm text-zinc-400">
                                <Search size={32} className="mx-auto mb-3 opacity-50" />
                                Type to search documentation...
                            </div>
                        ) : results.length === 0 ? (
                            <div className="py-12 text-center text-sm text-zinc-400">
                                No results found for "{query}"
                            </div>
                        ) : (
                            <div className="space-y-1">
                                {results.map((result, index) => (
                                    <Link
                                        key={result.id}
                                        to={result.url}
                                        onClick={onClose}
                                        className={`block rounded-lg px-4 py-3 transition-colors ${
                                            index === selectedIndex
                                                ? 'bg-primary/10 text-primary'
                                                : 'hover:bg-zinc-100 dark:hover:bg-zinc-800'
                                        }`}
                                    >
                                        <div className="font-medium text-sm mb-1">
                                            {result.title}
                                        </div>
                                        {result.description && (
                                            <div className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2">
                                                {result.description}
                                            </div>
                                        )}
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="border-t border-zinc-200 dark:border-zinc-800 px-4 py-3 flex items-center justify-between text-xs text-zinc-400">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1">
                                <kbd className="px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded border border-zinc-300 dark:border-zinc-700">
                                    ↑
                                </kbd>
                                <kbd className="px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded border border-zinc-300 dark:border-zinc-700">
                                    ↓
                                </kbd>
                                <span>navigate</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <kbd className="px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded border border-zinc-300 dark:border-zinc-700">
                                    ↵
                                </kbd>
                                <span>select</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                            <kbd className="px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded border border-zinc-300 dark:border-zinc-700">
                                esc
                            </kbd>
                            <span>close</span>
                        </div>
                    </div>
                </div>
            </div>
        </button>
    );
}
