import { AlertCircle, CheckCircle, Info, Lightbulb, XCircle } from 'lucide-react';
import type { ReactNode } from 'react';

interface CalloutProps {
    type?: 'info' | 'success' | 'warning' | 'error' | 'tip';
    children: ReactNode;
}

const calloutStyles = {
    info: {
        container: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
        icon: 'text-blue-600 dark:text-blue-400',
        IconComponent: Info
    },
    success: {
        container: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
        icon: 'text-green-600 dark:text-green-400',
        IconComponent: CheckCircle
    },
    warning: {
        container: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
        icon: 'text-yellow-600 dark:text-yellow-400',
        IconComponent: AlertCircle
    },
    error: {
        container: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
        icon: 'text-red-600 dark:text-red-400',
        IconComponent: XCircle
    },
    tip: {
        container: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800',
        icon: 'text-purple-600 dark:text-purple-400',
        IconComponent: Lightbulb
    }
};

export function Callout({ type = 'info', children }: CalloutProps) {
    const style = calloutStyles[type];
    const Icon = style.IconComponent;

    return (
        <div className={`my-6 p-4 rounded-lg border ${style.container}`}>
            <div className="flex gap-3 items-center">
                <Icon className={`flex-shrink-0 ${style.icon}`} size={20} />
                <div className="flex-1 text-sm">{children}</div>
            </div>
        </div>
    );
}
