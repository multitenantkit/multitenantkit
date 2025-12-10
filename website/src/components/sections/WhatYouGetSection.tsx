import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { useInView } from 'react-intersection-observer';
import { Container } from '../ui/Container';
import { Section } from '../ui/Section';

export function WhatYouGetSection() {
    const [ref, inView] = useInView({
        triggerOnce: true,
        threshold: 0.1
    });

    const features = [
        '18 production-ready endpoints for users, organizations, and memberships.',
        'Pre-built use cases with business validations, role management, and soft deletes.',
        'Deploy to Express or Supabase Edge Functions — or plug in your own adapters.',
        'A type-safe custom fields system powered by Zod.',
        'Hook and response transformer systems to add logging, metrics, webhooks, or custom API shapes without forking the tool.'
    ];

    return (
        <Section className="bg-gradient-to-b from-light-bg to-light-surface dark:from-dark-bg dark:to-dark-surface">
            <Container>
                <motion.div
                    ref={ref}
                    initial={{ opacity: 0, y: 20 }}
                    animate={inView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.5 }}
                    className="max-w-4xl mx-auto"
                >
                    <h2 className="text-3xl md:text-4xl font-bold mb-8 text-center">
                        What you get{' '}
                        <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                            out of the box
                        </span>
                    </h2>

                    <div className="grid md:grid-cols-2 gap-4">
                        {features.map((feature, index) => (
                            <motion.div
                                key={feature}
                                initial={{ opacity: 0, x: -20 }}
                                animate={inView ? { opacity: 1, x: 0 } : {}}
                                transition={{ duration: 0.4, delay: index * 0.1 }}
                                className="flex items-start gap-3 p-4 bg-white dark:bg-dark-bg rounded-lg border border-gray-200 dark:border-dark-border"
                            >
                                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <Check size={14} className="text-primary" />
                                </div>
                                <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                                    {feature}
                                </p>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            </Container>
        </Section>
    );
}
