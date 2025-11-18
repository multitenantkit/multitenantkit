import { motion } from 'framer-motion';
import { ArrowRight, BookOpen, Github } from 'lucide-react';
import { useInView } from 'react-intersection-observer';
import { Button } from '../ui/Button';
import { CodeBlock } from '../ui/CodeBlock';
import { Container } from '../ui/Container';
import { Section } from '../ui/Section';

export function FinalCTASection() {
    const [ref, inView] = useInView({
        triggerOnce: true,
        threshold: 0.1
    });

    const commands = [
        'npm install @multitenantkit/sdk',
        '# Follow the 30-second setup guide',
        '# Ship your SaaS 🚀'
    ];

    return (
        <Section className="bg-gradient-to-br from-primary/10 via-accent/10 to-primary/10 dark:from-primary/20 dark:via-accent/20 dark:to-primary/20 relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent/20 rounded-full blur-3xl" />
            </div>

            <Container className="relative z-10">
                <motion.div
                    ref={ref}
                    initial={{ opacity: 0, y: 20 }}
                    animate={inView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.5 }}
                    className="text-center mb-12"
                >
                    <h2 className="text-3xl md:text-5xl font-bold mb-6">
                        Ready to{' '}
                        <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent animate-gradient-shift bg-[length:200%_auto]">
                            stop rebuilding?
                        </span>
                    </h2>
                    <p className="text-lg md:text-xl text-gray-700 dark:text-gray-300 max-w-2xl mx-auto mb-8">
                        Join developers who chose to ship features instead of rebuilding user
                        management.
                    </p>

                    {/* CTAs */}
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
                        <a href="#quickstart">
                            <Button
                                size="lg"
                                className="w-full sm:w-auto group shadow-xl shadow-primary/30"
                            >
                                Get Started Now
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
                                <BookOpen size={18} className="mr-2" />
                                View Documentation
                            </Button>
                        </a>
                        <a
                            href="https://github.com/multitenantkit/multitenantkit/tree/main/examples"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <Button variant="outline" size="lg" className="w-full sm:w-auto">
                                <Github size={18} className="mr-2" />
                                See Examples
                            </Button>
                        </a>
                    </div>
                </motion.div>

                {/* Terminal Preview */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={inView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="max-w-2xl mx-auto"
                >
                    <div className="relative">
                        <div className="absolute -inset-1 bg-gradient-to-r from-primary to-accent rounded-xl blur opacity-25" />
                        <div className="relative">
                            <CodeBlock code={commands.join('\n')} language="bash" />
                        </div>
                    </div>
                </motion.div>

                {/* Bottom Text */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={inView ? { opacity: 1 } : {}}
                    transition={{ duration: 0.5, delay: 0.4 }}
                    className="mt-12 text-center"
                >
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        MIT License • Open Source • No Vendor Lock-in
                    </p>
                </motion.div>
            </Container>
        </Section>
    );
}
