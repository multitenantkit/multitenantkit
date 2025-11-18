import { motion } from 'framer-motion';
import { Building2, Database, Shield, Unlock, Wrench, Zap } from 'lucide-react';
import { useInView } from 'react-intersection-observer';
import { Card } from '../ui/Card';
import { Container } from '../ui/Container';
import { Section } from '../ui/Section';

export function FeaturesSection() {
    const [ref, inView] = useInView({
        triggerOnce: true,
        threshold: 0.1
    });

    const features = [
        {
            icon: Database,
            title: 'Your Data, Your Infrastructure',
            description:
                'PostgreSQL, MySQL, MongoDB—your choice. Your database, your auth provider, your deployment. No external services.',
            gradient: 'from-blue-500 to-cyan-500'
        },
        {
            icon: Zap,
            title: '18 Production Endpoints',
            description:
                'Complete REST API for users, organizations, and memberships. Role-based access, soft deletes, audit trails—all included.',
            gradient: 'from-purple-500 to-pink-500'
        },
        {
            icon: Shield,
            title: 'Type-Safe Everywhere',
            description:
                'Zod schemas from database to API. Full TypeScript inference. Single source of truth. Catch errors at compile time.',
            gradient: 'from-green-500 to-emerald-500'
        },
        {
            icon: Wrench,
            title: 'Extend Everything',
            description:
                'Custom fields with Zod schemas. 7 lifecycle hooks. Response transformers. Adapt to your business logic, not the other way around.',
            gradient: 'from-orange-500 to-red-500'
        },
        {
            icon: Unlock,
            title: 'Zero Lock-in',
            description:
                "It's your code in your repo. Fork it, modify it, replace any adapter. MIT license. No recurring fees, no vendor dependency.",
            gradient: 'from-indigo-500 to-purple-500'
        },
        {
            icon: Building2,
            title: 'Battle-Tested Architecture',
            description:
                'Hexagonal architecture. Domain-driven design. Dependency injection. Patterns that scale from startup to enterprise.',
            gradient: 'from-yellow-500 to-orange-500'
        }
    ];

    return (
        <Section id="features" className="bg-light-surface dark:bg-dark-surface">
            <Container>
                <motion.div
                    ref={ref}
                    initial={{ opacity: 0, y: 20 }}
                    animate={inView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.5 }}
                    className="text-center mb-12"
                >
                    <h2 className="text-3xl md:text-4xl font-bold mb-4">
                        Everything you need.{' '}
                        <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                            Nothing you don't.
                        </span>
                    </h2>
                    <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                        Production-ready business logic that adapts to your stack, not the other way
                        around.
                    </p>
                </motion.div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                    {features.map((feature, index) => {
                        const Icon = feature.icon;
                        return (
                            <motion.div
                                key={feature.title}
                                initial={{ opacity: 0, y: 20 }}
                                animate={inView ? { opacity: 1, y: 0 } : {}}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                            >
                                <Card hover className="h-full relative overflow-hidden group">
                                    {/* Gradient border effect on hover */}
                                    <div
                                        className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}
                                    />

                                    <div className="relative z-10">
                                        <div
                                            className={`w-12 h-12 rounded-lg bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}
                                        >
                                            <Icon className="text-white" size={24} />
                                        </div>
                                        <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-gray-100">
                                            {feature.title}
                                        </h3>
                                        <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                                            {feature.description}
                                        </p>
                                    </div>
                                </Card>
                            </motion.div>
                        );
                    })}
                </div>
            </Container>
        </Section>
    );
}
