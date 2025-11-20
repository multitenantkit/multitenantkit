import { motion } from 'framer-motion';
import { Check, X } from 'lucide-react';
import { useInView } from 'react-intersection-observer';
import { Container } from '../ui/Container';
import { Section } from '../ui/Section';

export function ComparisonTableSection() {
    const [ref, inView] = useInView({
        triggerOnce: true,
        threshold: 0.1
    });

    const comparisons = [
        { feature: 'Runs in your own codebase', auth0: false, custom: true, multitenantkit: true },
        { feature: 'Bring your own database', auth0: false, custom: true, multitenantkit: true },
        {
            feature: 'Bring your own auth provider',
            auth0: false,
            custom: true,
            multitenantkit: true
        },
        {
            feature: 'Headless (no UI components)',
            auth0: false,
            custom: true,
            multitenantkit: true
        },
        { feature: 'Setup Time', auth0: '1 day', custom: '2-3 weeks', multitenantkit: '30 sec' },
        {
            feature: 'Pricing model',
            auth0: 'Usage-based',
            custom: 'Developer time',
            multitenantkit: 'Open source, $0'
        }
    ];

    return (
        <Section className="bg-light-bg dark:bg-dark-bg">
            <Container>
                <motion.div
                    ref={ref}
                    initial={{ opacity: 0, y: 20 }}
                    animate={inView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.5 }}
                    className="text-center mb-12"
                >
                    <h2 className="text-3xl md:text-4xl font-bold mb-4">
                        How does it{' '}
                        <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                            compare?
                        </span>
                    </h2>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={inView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="max-w-4xl mx-auto overflow-x-auto"
                >
                    <table className="w-full bg-white dark:bg-dark-surface rounded-xl overflow-hidden border border-gray-200 dark:border-dark-border">
                        <thead>
                            <tr className="bg-gray-50 dark:bg-dark-bg border-b border-gray-200 dark:border-dark-border">
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">
                                    Feature
                                </th>
                                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700 dark:text-gray-300">
                                    Auth0/Clerk
                                </th>
                                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700 dark:text-gray-300">
                                    Custom Build
                                </th>
                                <th className="px-6 py-4 text-center text-sm font-semibold bg-primary/10 text-primary">
                                    MultiTenantKit
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {comparisons.map((comparison, index) => (
                                <tr
                                    key={comparison.feature}
                                    className={cn(
                                        'border-b border-gray-200 dark:border-dark-border last:border-none',
                                        index % 2 === 0
                                            ? 'bg-white dark:bg-dark-surface'
                                            : 'bg-gray-50/50 dark:bg-dark-bg/50'
                                    )}
                                >
                                    <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-gray-100">
                                        {comparison.feature}
                                    </td>
                                    <td className="px-6 py-4 text-center text-sm text-gray-600 dark:text-gray-400">
                                        {typeof comparison.auth0 === 'boolean' ? (
                                            comparison.auth0 ? (
                                                <Check
                                                    size={18}
                                                    className="inline text-green-500"
                                                />
                                            ) : (
                                                <X size={18} className="inline text-red-500" />
                                            )
                                        ) : (
                                            comparison.auth0
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-center text-sm text-gray-600 dark:text-gray-400">
                                        {typeof comparison.custom === 'boolean' ? (
                                            comparison.custom ? (
                                                <Check
                                                    size={18}
                                                    className="inline text-green-500"
                                                />
                                            ) : (
                                                <X size={18} className="inline text-red-500" />
                                            )
                                        ) : (
                                            comparison.custom
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-center text-sm font-semibold text-primary">
                                        {typeof comparison.multitenantkit === 'boolean' ? (
                                            comparison.multitenantkit ? (
                                                <Check
                                                    size={18}
                                                    className="inline text-green-500"
                                                />
                                            ) : (
                                                <X size={18} className="inline text-red-500" />
                                            )
                                        ) : (
                                            comparison.multitenantkit
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </motion.div>
            </Container>
        </Section>
    );
}

function cn(...classes: (string | boolean | undefined)[]) {
    return classes.filter(Boolean).join(' ');
}
