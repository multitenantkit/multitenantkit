import { forwardRef, HTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

export interface SectionProps extends HTMLAttributes<HTMLElement> {
    spacing?: 'default' | 'sm' | 'lg' | 'none';
}

const Section = forwardRef<HTMLElement, SectionProps>(
    ({ className, spacing = 'default', ...props }, ref) => {
        return (
            <section
                ref={ref}
                className={cn(
                    {
                        'py-16 md:py-24 lg:py-32': spacing === 'default',
                        'py-8 md:py-12 lg:py-16': spacing === 'sm',
                        'py-20 md:py-32 lg:py-40': spacing === 'lg',
                        'py-0': spacing === 'none'
                    },
                    className
                )}
                {...props}
            />
        );
    }
);

Section.displayName = 'Section';

export { Section };
