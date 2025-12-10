import { motion } from 'framer-motion';
import { ArrowRight, Database, Sparkles } from 'lucide-react';
import { useInView } from 'react-intersection-observer';
import { Container } from '../ui/Container';
import { Section } from '../ui/Section';

export function DatabaseSetupSection() {
    const [ref, inView] = useInView({
        triggerOnce: true,
        threshold: 0.1
    });

    return (
        <Section className="bg-gradient-to-b from-purple-50/30 via-blue-50/30 to-white dark:from-purple-950/10 dark:via-blue-950/10 dark:to-dark-bg">
            <Container>
                <motion.div
                    ref={ref}
                    initial={{ opacity: 0, y: 20 }}
                    animate={inView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.5 }}
                >
                    {/* Header with Feature Badge */}
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30 text-purple-900 dark:text-purple-200 rounded-full mb-4 border border-purple-200 dark:border-purple-800">
                            <Sparkles size={18} />
                            <span className="font-medium text-sm">Ultimate Flexibility</span>
                        </div>
                        <h2 className="text-3xl md:text-4xl font-bold mb-4">
                            Works with{' '}
                            <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                                your database, auth provider, and transport.
                            </span>
                        </h2>
                        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
                            MultiTenantKit is fully infrastructure-agnostic. Out of the box you get
                            adapters for PostgreSQL, Supabase (Auth + Edge Functions), and Express —
                            but you can also build adapters for MySQL, MongoDB, DynamoDB, Auth0,
                            Cognito, Firebase, AWS Lambda, Fastify, Hono, and more.{' '}
                            <span className="font-semibold text-gray-900 dark:text-gray-100">
                                Your data never leaves your stack: MultiTenantKit runs inside your
                                codebase.
                            </span>
                        </p>
                    </div>

                    {/* How It Works - Storage for 3 Entities */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={inView ? { opacity: 1, y: 0 } : {}}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="bg-gradient-to-br from-white to-purple-50/30 dark:from-dark-surface dark:to-purple-950/10 rounded-2xl p-6 md:p-8 mb-8 border border-purple-200 dark:border-purple-800/30 shadow-lg"
                    >
                        <div className="flex items-start gap-3 mb-6">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center flex-shrink-0">
                                <Database className="text-white" size={20} />
                            </div>
                            <div>
                                <h3 className="text-xl font-semibold mb-2">
                                    3 Entities = Your Storage Solution
                                </h3>
                                <p className="text-gray-600 dark:text-gray-400 text-sm">
                                    MultiTenantKit needs storage for <strong>Users</strong>,{' '}
                                    <strong>Organizations</strong>, and <strong>Memberships</strong>
                                    . Call them whatever you want. Use any table names. Any column
                                    names.
                                </p>
                            </div>
                        </div>
                        <div className="grid md:grid-cols-3 gap-4">
                            {[
                                {
                                    name: 'Users Entity',
                                    example: 'users, members, accounts',
                                    note: 'Or use auth.users from Supabase'
                                },
                                {
                                    name: 'Organizations Entity',
                                    example: 'organizations, teams, companies',
                                    note: 'Your team/org table'
                                },
                                {
                                    name: 'Memberships Entity',
                                    example: 'memberships, team_members',
                                    note: 'User-org relationships'
                                }
                            ].map((table, idx) => (
                                <div
                                    key={table.name}
                                    className="p-4 bg-white dark:bg-dark-bg rounded-xl border border-purple-100 dark:border-purple-900/30"
                                >
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400 text-xs font-bold">
                                            {idx + 1}
                                        </div>
                                        <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                            {table.name}
                                        </h4>
                                    </div>
                                    <p className="text-xs text-gray-500 dark:text-gray-500 italic mb-2">
                                        e.g., {table.example}
                                    </p>
                                    <p className="text-xs text-gray-600 dark:text-gray-400">
                                        {table.note}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </motion.div>

                    {/* CTA to Documentation */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={inView ? { opacity: 1, y: 0 } : {}}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="text-center"
                    >
                        <a
                            href="/docs/getting-started/installation"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-white font-medium rounded-lg transition-colors"
                        >
                            See Setup Instructions
                            <ArrowRight size={18} />
                        </a>
                        <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
                            SQL scripts and configuration examples included
                        </p>
                    </motion.div>
                </motion.div>
            </Container>
        </Section>
    );
}
