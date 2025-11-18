import { motion } from 'framer-motion';
import { Building, Rocket, User } from 'lucide-react';
import { useInView } from 'react-intersection-observer';
import { Card } from '../ui/Card';
import { Container } from '../ui/Container';
import { Section } from '../ui/Section';

export function WhoIsThisForSection() {
    const [ref, inView] = useInView({
        triggerOnce: true,
        threshold: 0.1
    });

    const personas = [
        {
            icon: Rocket,
            title: 'SaaS Startups',
            rating: 5,
            description: 'Need team management yesterday. Ship features, not auth flows.',
            gradient: 'from-purple-500 to-pink-500'
        },
        {
            icon: Building,
            title: 'Enterprise Apps',
            rating: 5,
            description: 'Multi-tenant requirements with full data control and compliance.',
            gradient: 'from-blue-500 to-cyan-500'
        },
        {
            icon: User,
            title: 'Solo Developers',
            rating: 5,
            description: 'Tired of rebuilding the same foundation. Focus on unique value.',
            gradient: 'from-orange-500 to-red-500'
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
                        Who is{' '}
                        <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                            this for?
                        </span>
                    </h2>
                </motion.div>

                <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
                    {personas.map((persona, index) => {
                        const Icon = persona.icon;
                        return (
                            <motion.div
                                key={persona.title}
                                initial={{ opacity: 0, y: 20 }}
                                animate={inView ? { opacity: 1, y: 0 } : {}}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                            >
                                <Card hover className="h-full text-center">
                                    <div
                                        className={`w-16 h-16 rounded-full bg-gradient-to-br ${persona.gradient} flex items-center justify-center mx-auto mb-4`}
                                    >
                                        <Icon className="text-white" size={28} />
                                    </div>
                                    <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-gray-100">
                                        {persona.title}
                                    </h3>
                                    <div className="flex items-center justify-center gap-1 mb-3">
                                        {Array.from({ length: persona.rating }).map((_, i) => (
                                            <span key={i} className="text-yellow-500">
                                                ⭐
                                            </span>
                                        ))}
                                    </div>
                                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                                        {persona.description}
                                    </p>
                                </Card>
                            </motion.div>
                        );
                    })}
                </div>
            </Container>
        </Section>
    );
}
