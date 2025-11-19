import { motion } from 'framer-motion';
import { Check, Sparkles } from 'lucide-react';
import { useInView } from 'react-intersection-observer';
import { CodeBlock } from '../ui/CodeBlock';
import { Container } from '../ui/Container';
import { Section } from '../ui/Section';

export function CustomFieldsSection() {
    const [ref, inView] = useInView({
        triggerOnce: true,
        threshold: 0.1
    });

    const customFieldsCode = `import { createExpressApp } from '@multitenantkit/sdk';
import { z } from 'zod';

const app = createExpressApp({
  namingStrategy: 'snake_case',
  users: {
    customFields: {
      customSchema: z.object({
        company: z.string(),
        department: z.string(),
        onboardingCompleted: z.boolean(),
        preferences: z.object({
          theme: z.enum(['light', 'dark']),
          notifications: z.boolean()
        })
      })
    }
  },
  organizations: {
    customFields: {
      customSchema: z.object({
        plan: z.enum(['free', 'pro', 'enterprise']),
        maxMembers: z.number(),
        billingEmail: z.string().email()
      })
    }
  }
});

app.listen(3000);`;

    const benefits = [
        'Automatic TypeScript types',
        'Built-in validation with Zod',
        'Database schema auto-mapped',
        'Endpoints updated instantly',
        'Lifecycle hooks included',
        'Full type safety everywhere'
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
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 dark:bg-primary/20 rounded-full mb-6">
                        <Sparkles size={18} className="text-primary" />
                        <span className="text-sm font-medium text-primary">Extend Everything</span>
                    </div>
                    <h2 className="text-3xl md:text-4xl font-bold mb-4">
                        Custom Fields{' '}
                        <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                            Made Easy
                        </span>
                    </h2>
                    <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                        Add custom fields to any entity in seconds. TypeScript types, validation,
                        and database mapping are all automatic.
                    </p>
                </motion.div>

                <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
                    {/* Left - Code */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={inView ? { opacity: 1, x: 0 } : {}}
                        transition={{ duration: 0.5, delay: 0.2 }}
                    >
                        <div className="relative">
                            <div className="absolute -inset-1 bg-gradient-to-r from-primary to-accent rounded-xl blur opacity-25" />
                            <div className="relative">
                                <CodeBlock code={customFieldsCode} language="typescript" />
                            </div>
                        </div>
                    </motion.div>

                    {/* Right - Benefits */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={inView ? { opacity: 1, x: 0 } : {}}
                        transition={{ duration: 0.5, delay: 0.3 }}
                        className="space-y-6"
                    >
                        <div className="space-y-4">
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                                Zero Boilerplate Required
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400">
                                Just define your Zod schema and MultiTenantKit handles the rest.
                                Your custom fields work seamlessly across all endpoints with full
                                type safety.
                            </p>
                        </div>

                        <div className="space-y-3">
                            {benefits.map((benefit, index) => (
                                <motion.div
                                    key={benefit}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={inView ? { opacity: 1, x: 0 } : {}}
                                    transition={{ duration: 0.3, delay: 0.4 + index * 0.1 }}
                                    className="flex items-center gap-3"
                                >
                                    <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                                        <Check size={12} className="text-green-400" />
                                    </div>
                                    <span className="text-gray-700 dark:text-gray-300">
                                        {benefit}
                                    </span>
                                </motion.div>
                            ))}
                        </div>

                        <div className="mt-6 p-4 bg-primary/5 dark:bg-primary/10 rounded-lg border border-primary/20">
                            <p className="text-sm text-gray-700 dark:text-gray-300">
                                <span className="font-semibold text-primary">Pro Tip:</span> Use{' '}
                                <code className="px-2 py-1 bg-gray-200 dark:bg-gray-800 rounded text-xs">
                                    namingStrategy: 'snake_case'
                                </code>{' '}
                                to automatically convert between camelCase (TypeScript) and
                                snake_case (database).
                            </p>
                        </div>
                    </motion.div>
                </div>
            </Container>
        </Section>
    );
}
