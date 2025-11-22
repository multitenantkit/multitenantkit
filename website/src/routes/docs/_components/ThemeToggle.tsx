import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../../../lib/theme';

export function ThemeToggle() {
    const { theme, toggleTheme } = useTheme();

    return (
        <button
            type="button"
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
            {theme === 'dark' ? (
                <Sun size={18} className="text-gray-700 dark:text-gray-300" />
            ) : (
                <Moon size={18} className="text-gray-700 dark:text-gray-300" />
            )}
        </button>
    );
}
