import { motion } from 'framer-motion';
import { ArrowRight, Github, Star } from 'lucide-react';
import { Button } from '../ui/Button';
import { CodeBlock } from '../ui/CodeBlock';
import { Container } from '../ui/Container';
import { Section } from '../ui/Section';

export function HeroSection() {
    const installCode = `npm install @multitenantkit/sdk
# → 18 endpoints running ✅`;

    const quickStartCode = `import {
  createUseCases,
  createPostgresAdapters,
  createSystemAdapters,
  buildHandlers,
  AdapterAuthSupabase,
  AdapterTransportExpress
} from '@multitenantkit/sdk';

// 1. Wire up your infrastructure
const useCases = createUseCases({
  persistence: createPostgresAdapters(),
  system: createSystemAdapters()
});

// 2. Build HTTP handlers
const handlers = buildHandlers(useCases);

// 3. Create your Express app
const authService = AdapterAuthSupabase.createSupabaseAuthService();
const app = AdapterTransportExpress.buildExpressApp(handlers, authService);

// 4. Ship it
app.listen(3000);`;

    return (
        <Section
            spacing="lg"
            className="relative overflow-hidden bg-gradient-to-b from-light-bg via-light-surface to-light-bg dark:from-dark-bg dark:via-dark-surface dark:to-dark-bg"
        >
            {/* Background gradient blobs */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
            </div>

            <Container className="relative z-10">
                <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
                    {/* Left Column - Content */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="text-center lg:text-left"
                    >
                        {/* Badges */}
                        <div className="flex items-center justify-center lg:justify-start gap-3 mb-6">
                            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 dark:bg-primary/20 rounded-full">
                                <Star size={14} className="text-primary fill-primary" />
                                <span className="text-sm font-medium text-primary">
                                    Open Source
                                </span>
                            </div>
                            <div className="px-3 py-1.5 bg-accent/10 dark:bg-accent/20 rounded-full">
                                <span className="text-sm font-medium text-accent">MIT License</span>
                            </div>
                            <div className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-full">
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    TypeScript
                                </span>
                            </div>
                        </div>

                        {/* Headline */}
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                            <span className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 dark:from-gray-50 dark:via-gray-100 dark:to-gray-50 bg-clip-text text-transparent">
                                Stop rebuilding user management.{' '}
                            </span>
                            <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent animate-gradient-shift bg-[length:200%_auto]">
                                Start shipping features.
                            </span>
                        </h1>

                        {/* Subheadline */}
                        <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto lg:mx-0">
                            Production-ready TypeScript toolkit for B2B SaaS. You own the data, we
                            handle the logic. Get{' '}
                            <span className="font-semibold text-primary">
                                18 endpoints in 30 seconds
                            </span>
                            .
                        </p>

                        {/* CTAs */}
                        <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 mb-8">
                            <a href="#quickstart">
                                <Button size="lg" className="w-full sm:w-auto group">
                                    Get Started
                                    <ArrowRight
                                        size={18}
                                        className="ml-2 group-hover:translate-x-1 transition-transform"
                                    />
                                </Button>
                            </a>
                            <a
                                href="https://github.com/multitenantkit/multitenantkit"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <Button variant="secondary" size="lg" className="w-full sm:w-auto">
                                    <Github size={18} className="mr-2" />
                                    View on GitHub
                                </Button>
                            </a>
                        </div>

                        {/* Quick Stats */}
                        <div className="flex items-center justify-center lg:justify-start gap-8 text-sm text-gray-600 dark:text-gray-400">
                            <div>
                                <span className="font-bold text-2xl text-gray-900 dark:text-gray-100 block">
                                    18
                                </span>
                                <span>Endpoints</span>
                            </div>
                            <div className="w-px h-12 bg-gray-300 dark:bg-gray-700" />
                            <div>
                                <span className="font-bold text-2xl text-gray-900 dark:text-gray-100 block">
                                    30s
                                </span>
                                <span>Setup Time</span>
                            </div>
                            <div className="w-px h-12 bg-gray-300 dark:bg-gray-700" />
                            <div>
                                <span className="font-bold text-2xl text-gray-900 dark:text-gray-100 block">
                                    $0
                                </span>
                                <span>Recurring Fees</span>
                            </div>
                        </div>
                    </motion.div>

                    {/* Right Column - Code Demo */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="hidden lg:block"
                    >
                        <div className="space-y-4">
                            <div className="relative">
                                <div className="absolute -inset-1 bg-gradient-to-r from-primary to-accent rounded-xl blur opacity-25" />
                                <div className="relative">
                                    <CodeBlock code={installCode} language="bash" />
                                </div>
                            </div>
                            <div className="relative">
                                <div className="absolute -inset-1 bg-gradient-to-r from-primary to-accent rounded-xl blur opacity-25" />
                                <div className="relative">
                                    <CodeBlock code={quickStartCode} language="typescript" />
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Scroll Indicator - Only visible on large desktops */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1, duration: 0.5 }}
                    className="hidden xl:flex absolute bottom-12 left-[45%] transform -translate-x-1/2 flex-col items-center gap-2"
                >
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                        Scroll to explore
                    </span>
                    <motion.div
                        animate={{ y: [0, 8, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className="w-6 h-10 border-2 border-gray-300 dark:border-gray-600 rounded-full flex items-start justify-center p-2"
                    >
                        <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                    </motion.div>
                </motion.div>
            </Container>
        </Section>
    );
}
