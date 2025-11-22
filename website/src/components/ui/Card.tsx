import { forwardRef, type HTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
    hover?: boolean;
}

const Card = forwardRef<HTMLDivElement, CardProps>(
    ({ className, hover = false, ...props }, ref) => {
        return (
            <div
                ref={ref}
                className={cn(
                    'rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-surface p-6',
                    'transition-all duration-300',
                    hover && 'hover:shadow-xl hover:-translate-y-1 hover:border-primary/50',
                    className
                )}
                {...props}
            />
        );
    }
);

Card.displayName = 'Card';

export { Card };
