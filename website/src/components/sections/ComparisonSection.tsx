import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { CodeBlock } from '../ui/CodeBlock';
import { Container } from '../ui/Container';
import { Section } from '../ui/Section';

export function ComparisonSection() {
    const [ref, inView] = useInView({
        triggerOnce: true,
        threshold: 0.1
    });

    const withoutCode = `// ❌ Without MultiTenantKit
// 1. Design database schema (1 day)
// 2. Write migration scripts
// 3. Create TypeScript types
// 4. Build repository layer
// 5. Implement business logic
// 6. Add validation layer
// 7. Create API routes
// 8. Write permission checks
// 9. Add error handling
// 10. Write tests
//
// ⏱️  2-3 weeks of work
// 😰 Repetitive boilerplate
// 🐛 Easy to introduce bugs`;

    const withCode = `// ✅ With MultiTenantKit
import { createUseCases, buildHandlers } from '@multitenantkit/sdk';

const useCases = createUseCases(adapters);
const handlers = buildHandlers(useCases);
const app = buildExpressApp(handlers, authService);
app.listen(3000);

// ⚡ 30 seconds
// ✨ Battle-tested logic
// 🛡️ Type-safe by default`;

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
                        Stop wasting weeks.{' '}
                        <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                            Ship in seconds.
                        </span>
                    </h2>
                    <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                        The difference between building from scratch and using battle-tested
                        patterns.
                    </p>
                </motion.div>

                <div className="grid md:grid-cols-2 gap-6 lg:gap-8 max-w-6xl mx-auto">
                    {/* Without */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={inView ? { opacity: 1, x: 0 } : {}}
                        transition={{ duration: 0.5, delay: 0.2 }}
                    >
                        <div className="mb-4">
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                                Without MultiTenantKit
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                Building everything from scratch
                            </p>
                        </div>
                        <div className="relative">
                            <div className="absolute -inset-1 bg-gradient-to-r from-red-500 to-orange-500 rounded-xl blur opacity-25" />
                            <div className="relative">
                                <CodeBlock code={withoutCode} language="typescript" />
                            </div>
                        </div>
                    </motion.div>

                    {/* With */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={inView ? { opacity: 1, x: 0 } : {}}
                        transition={{ duration: 0.5, delay: 0.4 }}
                    >
                        <div className="mb-4">
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                                With MultiTenantKit
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                Production-ready in 30 seconds
                            </p>
                        </div>
                        <div className="relative">
                            <div className="absolute -inset-1 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl blur opacity-25" />
                            <div className="relative">
                                <CodeBlock code={withCode} language="typescript" />
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Counter */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={inView ? { opacity: 1, scale: 1 } : {}}
                    transition={{ duration: 0.5, delay: 0.6 }}
                    className="mt-12 text-center"
                >
                    <div className="inline-flex items-center gap-4 px-8 py-4 bg-gradient-to-r from-primary/10 to-accent/10 dark:from-primary/20 dark:to-accent/20 rounded-full">
                        <span className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">
                            2-3 weeks
                        </span>
                        <span className="text-2xl text-gray-400">→</span>
                        <span className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                            30 seconds
                        </span>
                    </div>
                </motion.div>
            </Container>
        </Section>
    );
}
