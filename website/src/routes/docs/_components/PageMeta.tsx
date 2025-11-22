import { Calendar } from 'lucide-react';
import { EditThisPage } from './EditThisPage';

interface PageMetaProps {
    filePath: string;
    lastUpdated?: string;
}

export function PageMeta({ filePath, lastUpdated }: PageMetaProps) {
    return (
        <div className="mt-12 pt-6 border-t border-gray-200 dark:border-gray-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <EditThisPage filePath={filePath} />
            {lastUpdated && (
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <Calendar size={16} />
                    <span>
                        Last updated:{' '}
                        {new Date(lastUpdated).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                        })}
                    </span>
                </div>
            )}
        </div>
    );
}
