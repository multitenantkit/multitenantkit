import { Github, Menu, Moon, Sun, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTheme } from '../../lib/theme';
import { cn } from '../../lib/utils';
import { Button } from '../ui/Button';
import { Container } from '../ui/Container';

export function Header() {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const { theme, toggleTheme } = useTheme();

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <header
            className={cn(
                'sticky top-0 z-50 w-full transition-all duration-300',
                isScrolled
                    ? 'bg-white/80 dark:bg-dark-bg/80 backdrop-blur-lg border-b border-gray-200 dark:border-dark-border shadow-sm'
                    : 'bg-transparent'
            )}
        >
            <Container>
                <nav className="flex items-center justify-between h-16 md:h-20">
                    {/* Logo */}
                    <a href="/" className="flex items-center space-x-2 group">
                        <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                            <span className="text-white font-bold text-lg">M</span>
                        </div>
                        <span className="font-bold text-lg md:text-xl bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                            MultiTenantKit
                        </span>
                    </a>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center space-x-6">
                        <a
                            href="#features"
                            className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-primary transition-colors"
                        >
                            Features
                        </a>
                        <a
                            href="#quickstart"
                            className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-primary transition-colors"
                        >
                            Quick Start
                        </a>
                        <a
                            href="https://github.com/multitenantkit/multitenantkit"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-primary transition-colors"
                        >
                            Docs
                        </a>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-3">
                        <button
                            onClick={toggleTheme}
                            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            aria-label="Toggle theme"
                        >
                            {theme === 'dark' ? (
                                <Sun size={20} className="text-gray-700 dark:text-gray-300" />
                            ) : (
                                <Moon size={20} className="text-gray-700 dark:text-gray-300" />
                            )}
                        </button>

                        <a
                            href="https://github.com/multitenantkit/multitenantkit"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hidden md:block"
                        >
                            <Button variant="ghost" size="sm">
                                <Github size={18} className="mr-2" />
                                GitHub
                            </Button>
                        </a>

                        <a href="#quickstart" className="hidden md:block">
                            <Button variant="primary" size="sm">
                                Get Started
                            </Button>
                        </a>

                        {/* Mobile Menu Button */}
                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            aria-label="Toggle menu"
                        >
                            {isMobileMenuOpen ? (
                                <X size={24} className="text-gray-700 dark:text-gray-300" />
                            ) : (
                                <Menu size={24} className="text-gray-700 dark:text-gray-300" />
                            )}
                        </button>
                    </div>
                </nav>

                {/* Mobile Menu */}
                {isMobileMenuOpen && (
                    <div className="md:hidden py-4 border-t border-gray-200 dark:border-dark-border">
                        <div className="flex flex-col space-y-4">
                            <a
                                href="#features"
                                className="text-base font-medium text-gray-700 dark:text-gray-300 hover:text-primary transition-colors"
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                Features
                            </a>
                            <a
                                href="#quickstart"
                                className="text-base font-medium text-gray-700 dark:text-gray-300 hover:text-primary transition-colors"
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                Quick Start
                            </a>
                            <a
                                href="https://github.com/multitenantkit/multitenantkit"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-base font-medium text-gray-700 dark:text-gray-300 hover:text-primary transition-colors"
                            >
                                Docs
                            </a>
                            <a
                                href="https://github.com/multitenantkit/multitenantkit"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <Button variant="outline" size="sm" className="w-full">
                                    <Github size={18} className="mr-2" />
                                    GitHub
                                </Button>
                            </a>
                            <a href="#quickstart">
                                <Button variant="primary" size="sm" className="w-full">
                                    Get Started
                                </Button>
                            </a>
                        </div>
                    </div>
                )}
            </Container>
        </header>
    );
}
