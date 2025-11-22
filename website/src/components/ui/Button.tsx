import { type ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '../../lib/utils';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
        return (
            <button
                ref={ref}
                className={cn(
                    'inline-flex items-center justify-center rounded-lg font-medium transition-all duration-150',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
                    'disabled:pointer-events-none disabled:opacity-50',
                    {
                        'bg-primary text-white hover:bg-primary-dark shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30':
                            variant === 'primary',
                        'bg-white dark:bg-dark-surface text-gray-900 dark:text-gray-50 border border-gray-200 dark:border-dark-border hover:bg-gray-50 dark:hover:bg-gray-800':
                            variant === 'secondary',
                        'border-2 border-primary text-primary hover:bg-primary hover:text-white':
                            variant === 'outline',
                        'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300':
                            variant === 'ghost'
                    },
                    {
                        'px-3 py-1.5 text-sm': size === 'sm',
                        'px-5 py-2.5 text-base': size === 'md',
                        'px-7 py-3.5 text-lg': size === 'lg'
                    },
                    className
                )}
                {...props}
            />
        );
    }
);

Button.displayName = 'Button';

export { Button };
