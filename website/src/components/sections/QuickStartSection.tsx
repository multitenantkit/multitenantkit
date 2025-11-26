import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { useState } from 'react';
import { useInView } from 'react-intersection-observer';
import { cn } from '../../lib/utils';
import { CodeBlock } from '../ui/CodeBlock';
import { Container } from '../ui/Container';
import { Section } from '../ui/Section';

export function QuickStartSection() {
    const [ref, inView] = useInView({
        triggerOnce: true,
        threshold: 0.1
    });

    const [activeTab, setActiveTab] = useState<'install' | 'setup' | 'result'>('install');

    const tabs = [
        { id: 'install' as const, label: '1. Install', duration: '5s' },
        { id: 'setup' as const, label: '2. Setup', duration: '20s' },
        { id: 'result' as const, label: '3. Result', duration: '5s' }
    ];

    const installCode = `npm install @multitenantkit/sdk`;

    const setupCode = `import { createSupabaseExpressApp } from '@multitenantkit/sdk';

// One line to get your API ready
const app = createSupabaseExpressApp();

app.listen(3000);
// Works with Express, Lambda, Hono, Fastify...`;

    const features = [
        '18 production-ready endpoints',
        'Type-safe business logic',
        'Role-based access control',
        'Soft deletes & restore',
        'Automatic audit trails',
        'Custom fields support'
    ];

    return (
        <Section id="quickstart" className="bg-light-bg dark:bg-dark-bg">
            <Container>
                <motion.div
                    ref={ref}
                    initial={{ opacity: 0, y: 20 }}
                    animate={inView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.5 }}
                    className="text-center mb-12"
                >
                    <h2 className="text-3xl md:text-4xl font-bold mb-4">
                        From zero to{' '}
                        <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                            production in 30 seconds
                        </span>
                    </h2>
                    <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                        Install the SDK, plug it into your database and auth provider, and you
                        instantly get an Express-based REST API with 18 endpoints for users,
                        organizations, and memberships.
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={inView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="max-w-4xl mx-auto"
                >
                    {/* Tabs */}
                    <div className="flex items-center justify-center gap-2 mb-6 flex-wrap">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => setActiveTab(tab.id)}
                                className={cn(
                                    'px-6 py-3 rounded-lg font-medium transition-all duration-200',
                                    'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
                                    activeTab === tab.id
                                        ? 'bg-primary text-white shadow-lg shadow-primary/30'
                                        : 'bg-white dark:bg-dark-surface text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 border border-gray-200 dark:border-dark-border'
                                )}
                            >
                                <div className="flex items-center gap-2">
                                    <span>{tab.label}</span>
                                    <span className="text-xs opacity-75">{tab.duration}</span>
                                </div>
                            </button>
                        ))}
                    </div>

                    {/* Code Content */}
                    <div className="relative">
                        <div className="absolute -inset-1 bg-gradient-to-r from-primary to-accent rounded-xl blur opacity-25" />
                        <div className="relative">
                            {activeTab === 'install' && (
                                <CodeBlock code={installCode} language="bash" />
                            )}
                            {activeTab === 'setup' && (
                                <CodeBlock code={setupCode} language="typescript" />
                            )}
                            {activeTab === 'result' && (
                                <div className="bg-[#1e1e1e] rounded-xl p-8">
                                    <div className="space-y-3">
                                        {features.map((feature, index) => (
                                            <motion.div
                                                key={feature}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ duration: 0.3, delay: index * 0.1 }}
                                                className="flex items-center gap-3"
                                            >
                                                <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                                                    <Check size={14} className="text-green-400" />
                                                </div>
                                                <span className="text-gray-300 font-mono text-sm">
                                                    {feature}
                                                </span>
                                            </motion.div>
                                        ))}
                                    </div>
                                    <div className="mt-6 pt-6 border-t border-gray-700">
                                        <p className="text-green-400 font-mono text-sm">
                                            ✓ Server running on http://localhost:3000
                                        </p>
                                        <p className="text-gray-500 font-mono text-xs mt-2">
                                            That's it. You're ready to ship. 🚀
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Bottom Note */}
                    <div className="mt-8 text-center">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            Use the domain use cases directly in your services, or expose them
                            through the built-in Express adapter.
                        </p>
                    </div>
                </motion.div>
            </Container>
        </Section>
    );
}
