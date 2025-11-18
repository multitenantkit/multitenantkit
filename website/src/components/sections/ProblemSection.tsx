import { motion } from 'framer-motion';
import { AlertCircle, Blocks, Lock } from 'lucide-react';
import { useInView } from 'react-intersection-observer';
import { Card } from '../ui/Card';
import { Container } from '../ui/Container';
import { Section } from '../ui/Section';

export function ProblemSection() {
    const [ref, inView] = useInView({
        triggerOnce: true,
        threshold: 0.1
    });

    const problems = [
        {
            icon: AlertCircle,
            title: 'Repetitive Boilerplate',
            description:
                "You've built user and organization management a dozen times. It's the same code, different project. Stop wasting weeks on solved problems."
        },
        {
            icon: Lock,
            title: 'Vendor Lock-in',
            description:
                'SaaS solutions own your data and charge monthly fees. One API change and your app breaks. You need alternatives, not dependencies.'
        },
        {
            icon: Blocks,
            title: 'Poor Extensibility',
            description:
                'Most solutions are rigid. Custom fields? Hook into lifecycle events? Good luck. You end up building workarounds for their limitations.'
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
                        You've built this before.{' '}
                        <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                            So have we.
                        </span>
                    </h2>
                    <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                        Every B2B SaaS needs the same foundation. Let's stop rebuilding it.
                    </p>
                </motion.div>

                <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
                    {problems.map((problem, index) => {
                        const Icon = problem.icon;
                        return (
                            <motion.div
                                key={problem.title}
                                initial={{ opacity: 0, y: 20 }}
                                animate={inView ? { opacity: 1, y: 0 } : {}}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                            >
                                <Card hover className="h-full">
                                    <div className="flex flex-col h-full">
                                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-red-500/10 to-orange-500/10 dark:from-red-500/20 dark:to-orange-500/20 flex items-center justify-center mb-4">
                                            <Icon
                                                className="text-red-600 dark:text-red-400"
                                                size={24}
                                            />
                                        </div>
                                        <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-gray-100">
                                            {problem.title}
                                        </h3>
                                        <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                                            {problem.description}
                                        </p>
                                    </div>
                                </Card>
                            </motion.div>
                        );
                    })}
                </div>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={inView ? { opacity: 1 } : {}}
                    transition={{ duration: 0.5, delay: 0.4 }}
                    className="mt-12 text-center"
                >
                    <div className="inline-block px-6 py-3 bg-gradient-to-r from-primary/10 to-accent/10 dark:from-primary/20 dark:to-accent/20 rounded-full">
                        <p className="text-lg font-medium">
                            <span className="text-gray-900 dark:text-gray-100">
                                MultiTenantKit solves all three.
                            </span>{' '}
                            <span className="text-primary">No compromises.</span>
                        </p>
                    </div>
                </motion.div>
            </Container>
        </Section>
    );
}
