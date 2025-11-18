import { forwardRef, HTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

export interface ContainerProps extends HTMLAttributes<HTMLDivElement> {
    size?: 'default' | 'sm' | 'lg';
}

const Container = forwardRef<HTMLDivElement, ContainerProps>(
    ({ className, size = 'default', ...props }, ref) => {
        return (
            <div
                ref={ref}
                className={cn(
                    'mx-auto w-full px-4 sm:px-6 lg:px-8',
                    {
                        'max-w-7xl': size === 'default',
                        'max-w-4xl': size === 'sm',
                        'max-w-container': size === 'lg'
                    },
                    className
                )}
                {...props}
            />
        );
    }
);

Container.displayName = 'Container';

export { Container };
