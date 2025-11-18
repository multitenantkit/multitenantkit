import { motion } from 'framer-motion';
import { Code, GitFork, Star } from 'lucide-react';
import { useInView } from 'react-intersection-observer';
import { Container } from '../ui/Container';
import { Section } from '../ui/Section';

export function GitHubStatsSection() {
    const [ref, inView] = useInView({
        triggerOnce: true,
        threshold: 0.1
    });

    const stats = [
        {
            icon: Star,
            label: 'GitHub Stars',
            value: '.',
            color: 'from-yellow-500 to-orange-500'
        },
        { icon: GitFork, label: 'Contributors', value: '.', color: 'from-blue-500 to-cyan-500' },
        { icon: Code, label: 'Version', value: 'v0.1.0', color: 'from-purple-500 to-pink-500' }
    ];

    return (
        <Section className="bg-gradient-to-b from-light-surface to-light-bg dark:from-dark-surface dark:to-dark-bg hidden">
            <Container>
                <motion.div ref={ref} className="grid md:grid-cols-3 gap-8">
                    {stats.map((stat, index) => {
                        const Icon = stat.icon;
                        return (
                            <motion.div
                                key={stat.label}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={inView ? { opacity: 1, scale: 1 } : {}}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                                className="text-center"
                            >
                                <div
                                    className={`w-16 h-16 rounded-full bg-gradient-to-br ${stat.color} flex items-center justify-center mx-auto mb-4`}
                                >
                                    <Icon className="text-white" size={28} />
                                </div>
                                <div className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                                    {stat.value}
                                </div>
                                <div className="text-sm text-gray-600 dark:text-gray-400">
                                    {stat.label}
                                </div>
                            </motion.div>
                        );
                    })}
                </motion.div>
            </Container>
        </Section>
    );
}
