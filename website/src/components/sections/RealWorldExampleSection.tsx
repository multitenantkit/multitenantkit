import { motion } from 'framer-motion';
import { Code2, Rocket, Zap } from 'lucide-react';
import { useState } from 'react';
import { useInView } from 'react-intersection-observer';
import { cn } from '../../lib/utils';
import { CodeBlock } from '../ui/CodeBlock';
import { Container } from '../ui/Container';
import { Section } from '../ui/Section';

export function RealWorldExampleSection() {
    const [ref, inView] = useInView({
        triggerOnce: true,
        threshold: 0.1
    });

    const [activeTab, setActiveTab] = useState<'without' | 'with'>('without');

    const tabs = [
        {
            id: 'without' as const,
            label: 'Without MultiTenantKit',
            icon: Code2,
            lines: '~190 lines'
        },
        { id: 'with' as const, label: 'With MultiTenantKit', icon: Zap, lines: '~30 lines' }
    ];

    const withoutCode = `// ❌ The traditional way (simplified view)

// 1. Define database schema (20 lines)
CREATE TABLE users (...);
CREATE TABLE organizations (...);
CREATE TABLE memberships (...);

// 2. Create repositories (40 lines)
class UserRepository {
  async create() { /* ... */ }
  async findById() { /* ... */ }
  async update() { /* ... */ }
  // ... more methods
}

// 3. Business logic (50 lines)
class OrganizationService {
  async createOrganization(data) {
    // Validate input
    // Check permissions
    // Create organization
    // Create owner membership
    // Handle errors
    // Return result
  }
  // ... more methods
}

// 4. API endpoints (40 lines)
app.post('/organizations', async (req, res) => {
  // Parse body
  // Validate auth
  // Call service
  // Handle errors
  // Return response
});
// ... 17 more endpoints

// 5. Permissions logic (30 lines)
function checkMembershipRole(userId, orgId) {
  // Query database
  // Check role
  // Return permission
}

// 6. Tests (60+ lines)
describe('Organizations', () => {
  // Setup mocks
  // Test each method
  // Test error cases
});

// Total: ~190 lines + ongoing maintenance 😰`;

    const withCode = `// ✅ The MultiTenantKit way

import { createExpressApp } from '@multitenantkit/sdk';
import { z } from 'zod';

// 1. Define your custom fields (if needed)
const app = createExpressApp({
  namingStrategy: 'snake_case',
  organizations: {
    customFields: {
      customSchema: z.object({
        plan: z.enum(['free', 'pro', 'enterprise']),
        maxMembers: z.number().default(5),
        billingEmail: z.string().email()
      })
    }
  },
  users: {
    customFields: {
      customSchema: z.object({
        department: z.string(),
        role: z.string()
      })
    }
  }
});

// 2. That's it. Start your server.
app.listen(3000);

// ✅ You now have 18 production-ready endpoints:
// - POST   /users
// - GET    /users/:id
// - PATCH  /users/:id
// - DELETE /users/:id
// - GET    /users/:id/organizations
// - POST   /organizations
// - GET    /organizations/:id
// - PATCH  /organizations/:id
// - DELETE /organizations/:id
// - GET    /organizations/:id/members
// - POST   /organizations/:id/members
// - PATCH  /organizations/:id/members/:userId
// - DELETE /organizations/:id/members/:userId
// - POST   /organizations/:id/leave
// - POST   /organizations/:id/archive
// - POST   /organizations/:id/restore
// - POST   /organizations/:id/transfer-ownership
// - POST   /memberships/:id/accept

// ✅ All with:
// - Role-based permissions (owner, admin, member)
// - Soft deletes & restore
// - Audit trails
// - Type-safe custom fields
// - Zod validation
// - Error handling
// - Full TypeScript support

// Total: ~30 lines. Deploy ready. 🚀`;

    const stats = [
        { label: 'Code Reduction', value: '85%', icon: Zap },
        { label: 'Time Saved', value: '2-3 weeks', icon: Rocket },
        { label: 'Endpoints', value: '18', icon: Code2 }
    ];

    return (
        <Section className="bg-gradient-to-b from-light-bg to-light-surface dark:from-dark-bg dark:to-dark-surface">
            <Container>
                <motion.div
                    ref={ref}
                    initial={{ opacity: 0, y: 20 }}
                    animate={inView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.5 }}
                    className="text-center mb-12"
                >
                    <h2 className="text-3xl md:text-4xl font-bold mb-4">
                        See It{' '}
                        <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                            In Action
                        </span>
                    </h2>
                    <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                        Building a project management SaaS? Compare the traditional approach with
                        MultiTenantKit.
                    </p>
                </motion.div>

                {/* Stats */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={inView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12"
                >
                    {stats.map((stat, index) => (
                        <motion.div
                            key={stat.label}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={inView ? { opacity: 1, scale: 1 } : {}}
                            transition={{ duration: 0.3, delay: 0.3 + index * 0.1 }}
                            className="bg-white dark:bg-dark-surface rounded-xl p-6 border border-gray-200 dark:border-dark-border"
                        >
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                    <stat.icon size={20} className="text-primary" />
                                </div>
                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                    {stat.label}
                                </span>
                            </div>
                            <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                                {stat.value}
                            </p>
                        </motion.div>
                    ))}
                </motion.div>

                {/* Tabs */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={inView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.5, delay: 0.4 }}
                    className="flex items-center justify-center gap-2 mb-6 flex-wrap"
                >
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                'px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center gap-2',
                                'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
                                activeTab === tab.id
                                    ? 'bg-primary text-white shadow-lg shadow-primary/30'
                                    : 'bg-white dark:bg-dark-surface text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 border border-gray-200 dark:border-dark-border'
                            )}
                        >
                            <tab.icon size={18} />
                            <span>{tab.label}</span>
                            <span className="text-xs opacity-75">{tab.lines}</span>
                        </button>
                    ))}
                </motion.div>

                {/* Code Comparison */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={inView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.5, delay: 0.5 }}
                    className="relative"
                >
                    <div className="absolute -inset-1 bg-gradient-to-r from-primary to-accent rounded-xl blur opacity-25" />
                    <div className="relative">
                        {activeTab === 'without' && (
                            <CodeBlock code={withoutCode} language="typescript" />
                        )}
                        {activeTab === 'with' && (
                            <CodeBlock code={withCode} language="typescript" />
                        )}
                    </div>
                </motion.div>

                {/* Bottom Note */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={inView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.5, delay: 0.6 }}
                    className="mt-8 text-center"
                >
                    <div className="inline-block bg-green-500/10 border border-green-500/20 rounded-xl p-4">
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                            <span className="font-semibold text-green-600 dark:text-green-400">
                                ✅ Production Ready:
                            </span>{' '}
                            All endpoints include permissions, validation, error handling, and type
                            safety.
                        </p>
                    </div>
                </motion.div>
            </Container>
        </Section>
    );
}
