import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { useInView } from 'react-intersection-observer';
import { Container } from '../ui/Container';
import { Section } from '../ui/Section';

export function ArchitectureSection() {
    const [ref, inView] = useInView({
        triggerOnce: true,
        threshold: 0.1
    });

    const adapters = [
        {
            category: 'Persistence',
            items: ['PostgreSQL', 'MySQL', 'MongoDB', 'DynamoDB'],
            included: 'PostgreSQL'
        },
        {
            category: 'Authentication',
            items: ['Supabase', 'Auth0', 'Cognito', 'Firebase'],
            included: 'Supabase'
        },
        {
            category: 'Transport',
            items: ['Express', 'Supabase Edge', 'Hono', 'Lambda'],
            included: 'Express + Edge'
        }
    ];

    const agnosticFeatures = [
        'Use your existing database',
        'Keep your current auth provider',
        'Works with any web framework',
        'Deploy anywhere you want'
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
                        <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                            Framework Agnostic.
                        </span>{' '}
                        Bring Your Own Stack.
                    </h2>
                    <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                        MultiTenantKit is just business logic. Use any database, auth provider, or
                        framework you want. Adapters included, or build your own.
                    </p>
                </motion.div>

                {/* Framework Agnostic Callout */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={inView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="max-w-3xl mx-auto mb-12"
                >
                    <div className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-2xl p-6 border border-primary/20">
                        <div className="grid sm:grid-cols-2 gap-4">
                            {agnosticFeatures.map((feature, index) => (
                                <motion.div
                                    key={feature}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={inView ? { opacity: 1, x: 0 } : {}}
                                    transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
                                    className="flex items-center gap-3"
                                >
                                    <div className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
                                        <Check className="w-3 h-3 text-primary" />
                                    </div>
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                        {feature}
                                    </span>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={inView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.5, delay: 0.6 }}
                    className="max-w-4xl mx-auto"
                >
                    <div className="grid md:grid-cols-3 gap-8">
                        {adapters.map((adapter, index) => (
                            <motion.div
                                key={adapter.category}
                                initial={{ opacity: 0, y: 20 }}
                                animate={inView ? { opacity: 1, y: 0 } : {}}
                                transition={{ duration: 0.5, delay: 0.7 + 0.1 * index }}
                                className="text-center"
                            >
                                <div className="mb-4">
                                    <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                                        {adapter.category}
                                    </h3>
                                    <p className="text-xs text-primary mt-1">
                                        {adapter.included} included
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    {adapter.items.map((item) => (
                                        <div
                                            key={item}
                                            className="px-4 py-2 bg-white dark:bg-dark-bg rounded-lg border border-gray-200 dark:border-dark-border hover:border-primary hover:bg-primary/5 transition-all duration-200"
                                        >
                                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                {item}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={inView ? { opacity: 1 } : {}}
                        transition={{ duration: 0.5, delay: 1 }}
                        className="mt-12 text-center"
                    >
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                            Don't see yours? Build your own adapter in minutes.
                        </p>
                        <a
                            href="https://github.com/multitenantkit/multitenantkit/tree/main/examples"
                            className="inline-flex items-center gap-2 text-primary hover:text-primary-dark transition-colors font-medium"
                        >
                            View adapter examples →
                        </a>
                    </motion.div>
                </motion.div>
            </Container>
        </Section>
    );
}
