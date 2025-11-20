import { motion } from 'framer-motion';
import { CheckCircle, Database, ExternalLink, Sparkles, Zap } from 'lucide-react';
import { useState } from 'react';
import { useInView } from 'react-intersection-observer';
import { cn } from '../../lib/utils';
import { CodeBlock } from '../ui/CodeBlock';
import { Container } from '../ui/Container';
import { Section } from '../ui/Section';

export function DatabaseSetupSection() {
    const [ref, inView] = useInView({
        triggerOnce: true,
        threshold: 0.1
    });

    const [activeScenario, setActiveScenario] = useState<'supabase' | 'new-app' | 'existing'>(
        'supabase'
    );

    const scenarios = [
        { id: 'supabase' as const, label: 'Supabase Auth', icon: '🔐' },
        { id: 'new-app' as const, label: 'New Application', icon: '🆕' },
        { id: 'existing' as const, label: 'Existing App', icon: '🔄' }
    ];

    const supabaseSetup = `// Run SQL in your Supabase SQL Editor
// Only creates organizations and memberships
// (Supabase already provides auth.users table)

// See the complete script at:
// packages/adapters/persistence/postgres/sql/examples/supabase.sql

// Configure your app:
const config: ToolkitOptions = {
  users: {
    database: { schema: 'auth', table: 'users' },
    customFields: {
      columnMapping: {
        externalId: 'id',     // auth.users.id
        username: 'email'      // auth.users.email
      }
    }
  }
};`;

    const newAppSetup = `# 1. Run schema (creates all 3 tables)
psql -d your_database -f \\
  packages/adapters/persistence/postgres/sql/schema.sql

# 2. Add your custom columns (if needed)
ALTER TABLE users ADD COLUMN first_name VARCHAR(100);
ALTER TABLE users ADD COLUMN last_name VARCHAR(100);
ALTER TABLE users ADD COLUMN email VARCHAR(255);

# 3. Configure DATABASE_URL
export DATABASE_URL="postgresql://user:pass@localhost:5432/your_database"`;

    const existingAppSetup = `# Use your existing tables with columnMapping
const config: ToolkitOptions = {
  users: {
    database: {
      schema: 'public',
      table: 'members'  // Your existing table
    },
    customFields: {
      columnMapping: {
        id: 'member_id',
        externalId: 'auth_user_id',
        username: 'email',
        createdAt: 'date_created'
      }
    }
  }
};

# See complete example at:
# packages/adapters/persistence/postgres/sql/examples/existing-app.sql`;

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
                            adapters for PostgreSQL and JSON storage, Supabase Auth, and Express —
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

                    {/* Scenario Tabs */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={inView ? { opacity: 1, y: 0 } : {}}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="max-w-4xl mx-auto"
                    >
                        <div className="flex items-center justify-center gap-2 mb-6 flex-wrap">
                            {scenarios.map((scenario) => (
                                <button
                                    key={scenario.id}
                                    type="button"
                                    onClick={() => setActiveScenario(scenario.id)}
                                    className={cn(
                                        'px-6 py-3 rounded-lg font-medium transition-all duration-200',
                                        'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
                                        activeScenario === scenario.id
                                            ? 'bg-primary text-white shadow-lg shadow-primary/30'
                                            : 'bg-white dark:bg-dark-surface text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 border border-gray-200 dark:border-dark-border'
                                    )}
                                >
                                    <span className="mr-2">{scenario.icon}</span>
                                    {scenario.label}
                                </button>
                            ))}
                        </div>

                        {/* Code Content */}
                        <div className="relative">
                            <div className="absolute -inset-1 bg-gradient-to-r from-orange-400 to-primary rounded-xl blur opacity-20" />
                            <div className="relative">
                                {activeScenario === 'supabase' && (
                                    <CodeBlock code={supabaseSetup} language="typescript" />
                                )}
                                {activeScenario === 'new-app' && (
                                    <CodeBlock code={newAppSetup} language="bash" />
                                )}
                                {activeScenario === 'existing' && (
                                    <CodeBlock code={existingAppSetup} language="typescript" />
                                )}
                            </div>
                        </div>
                    </motion.div>

                    {/* CLI Validation Feature */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={inView ? { opacity: 1, y: 0 } : {}}
                        transition={{ duration: 0.5, delay: 0.3 }}
                        className="mt-8 max-w-4xl mx-auto hidden"
                    >
                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-2 border-green-200 dark:border-green-800/50 rounded-2xl p-6 md:p-8">
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center flex-shrink-0">
                                    <Zap className="text-white" size={24} />
                                </div>
                                <div className="flex-1">
                                    <h4 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3">
                                        Verify Your Setup in Seconds
                                    </h4>
                                    <p className="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
                                        Use our CLI to verify that your database schema matches your
                                        configuration. One command tells you exactly what's
                                        configured correctly and what needs adjustment.
                                        <strong className="block mt-2">
                                            No surprises. No runtime errors. Just clear feedback.
                                        </strong>
                                    </p>
                                    <div className="flex items-start gap-2 p-3 bg-white dark:bg-dark-bg rounded-lg border border-green-200 dark:border-green-800/30">
                                        <code className="text-sm font-mono text-green-700 dark:text-green-300 flex-1">
                                            $ mtk validate
                                        </code>
                                        <CheckCircle
                                            className="text-green-600 dark:text-green-400 flex-shrink-0"
                                            size={18}
                                        />
                                    </div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
                                        Missing tables? Wrong column names? The CLI tells you
                                        exactly what's missing and how to fix it.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* SQL Scripts Available */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={inView ? { opacity: 1, y: 0 } : {}}
                        transition={{ duration: 0.5, delay: 0.4 }}
                        className="mt-6 max-w-4xl mx-auto"
                    >
                        <div className="bg-gray-50 dark:bg-dark-surface/50 border border-gray-200 dark:border-dark-border rounded-xl p-6">
                            <div className="flex items-start gap-3">
                                <Database
                                    className="text-gray-600 dark:text-gray-400 flex-shrink-0 mt-1"
                                    size={20}
                                />
                                <div className="flex-1">
                                    <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                                        Need SQL Scripts? We've Got You Covered
                                    </h4>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                                        Starting from scratch or using Supabase? Use our ready-made
                                        schemas:
                                    </p>
                                    <div className="grid sm:grid-cols-2 gap-2">
                                        {[
                                            { file: 'schema.sql', desc: 'Complete base schema' },
                                            { file: 'supabase.sql', desc: 'Supabase integration' },
                                            { file: 'custom-auth.sql', desc: 'Custom auth setup' },
                                            {
                                                file: 'existing-app.sql',
                                                desc: 'Existing tables guide'
                                            }
                                        ].map((script) => (
                                            <div
                                                key={script.file}
                                                className="flex items-center gap-2 text-xs p-2 bg-white dark:bg-dark-bg rounded border border-gray-200 dark:border-dark-border"
                                            >
                                                <CheckCircle
                                                    size={14}
                                                    className="text-green-500 flex-shrink-0"
                                                />
                                                <code className="font-mono text-primary">
                                                    {script.file}
                                                </code>
                                                <span className="text-gray-500">·</span>
                                                <span className="text-gray-600 dark:text-gray-400">
                                                    {script.desc}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                    <a
                                        href="https://github.com/multitenantkit/multitenantkit/tree/main/packages/adapters/persistence/postgres/sql"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 mt-3 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                                    >
                                        Browse SQL Scripts
                                        <ExternalLink size={14} />
                                    </a>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                    {/* TL;DR */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={inView ? { opacity: 1 } : {}}
                        transition={{ duration: 0.5, delay: 0.5 }}
                        className="mt-8 text-center"
                    >
                        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
                            <span className="font-semibold text-gray-900 dark:text-gray-100">
                                TL;DR:
                            </span>{' '}
                            Three entities need storage. Name them whatever you want. Use the CLI to
                            verify everything is configured correctly. Zero migration required for
                            existing apps.
                        </p>
                    </motion.div>
                </motion.div>
            </Container>
        </Section>
    );
}
