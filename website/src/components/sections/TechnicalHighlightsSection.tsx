import { motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { useInView } from 'react-intersection-observer';
import { cn } from '../../lib/utils';
import { Container } from '../ui/Container';
import { Section } from '../ui/Section';

export function TechnicalHighlightsSection() {
    const [ref, inView] = useInView({
        triggerOnce: true,
        threshold: 0.1
    });

    const [openIndex, setOpenIndex] = useState<number | null>(0);

    const highlights = [
        {
            title: 'Hexagonal Architecture',
            content:
                'Clean separation between domain logic and infrastructure. Business rules are independent, testable, and portable. Adapters connect your tech stack.'
        },
        {
            title: 'Type Safety with Zod',
            content:
                'Runtime validation meets compile-time guarantees. Schema-first approach ensures consistency from database to API. Single source of truth for all types.'
        },
        {
            title: 'Extensibility System',
            content:
                '7 lifecycle hooks (onStart, afterValidation, beforeExecution, afterExecution, onError, onAbort, onFinally) plus abort mechanism. Custom fields, response transformers, complete flexibility.'
        },
        {
            title: 'Comprehensive Testing',
            content:
                'Full test coverage for use cases and adapters. Integration tests included. Test your custom adapters with provided utilities.'
        }
    ];

    return (
        <Section className="bg-light-surface dark:bg-dark-surface">
            <Container>
                <motion.div
                    ref={ref}
                    initial={{ opacity: 0, y: 20 }}
                    animate={inView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.5 }}
                    className="text-center mb-12"
                >
                    <h2 className="text-3xl md:text-4xl font-bold mb-4">
                        Technical{' '}
                        <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                            Highlights
                        </span>
                    </h2>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={inView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="max-w-3xl mx-auto space-y-3"
                >
                    {highlights.map((highlight, index) => (
                        <div
                            key={highlight.title}
                            className="bg-white dark:bg-dark-bg border border-gray-200 dark:border-dark-border rounded-xl overflow-hidden"
                        >
                            <button
                                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                                className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                            >
                                <span className="font-semibold text-left text-gray-900 dark:text-gray-100">
                                    {highlight.title}
                                </span>
                                <ChevronDown
                                    size={20}
                                    className={cn(
                                        'text-gray-500 dark:text-gray-400 transition-transform duration-200',
                                        openIndex === index && 'transform rotate-180'
                                    )}
                                />
                            </button>
                            {openIndex === index && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="px-6 pb-4"
                                >
                                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                                        {highlight.content}
                                    </p>
                                </motion.div>
                            )}
                        </div>
                    ))}
                </motion.div>
            </Container>
        </Section>
    );
}
