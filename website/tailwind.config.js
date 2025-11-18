/** @type {import('tailwindcss').Config} */
export default {
    content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                dark: {
                    bg: '#0A0A0F',
                    surface: '#1A1A2E',
                    border: '#2A2A3E'
                },
                light: {
                    bg: '#FFFFFF',
                    surface: '#F8FAFC',
                    border: '#E2E8F0'
                },
                primary: {
                    DEFAULT: '#6366F1',
                    dark: '#4F46E5',
                    light: '#818CF8'
                },
                accent: {
                    DEFAULT: '#06B6D4',
                    dark: '#0891B2',
                    light: '#22D3EE'
                }
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
                mono: ['JetBrains Mono', 'Consolas', 'monospace']
            },
            fontSize: {
                'hero-desktop': '3.5rem',
                'hero-mobile': '2.5rem'
            },
            animation: {
                'fade-in': 'fadeIn 0.5s ease-in',
                'slide-up': 'slideUp 0.5s ease-out',
                'gradient-shift': 'gradientShift 3s ease infinite',
                'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite'
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' }
                },
                slideUp: {
                    '0%': { transform: 'translateY(20px)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' }
                },
                gradientShift: {
                    '0%, 100%': { backgroundPosition: '0% 50%' },
                    '50%': { backgroundPosition: '100% 50%' }
                }
            },
            maxWidth: {
                container: '1280px'
            }
        }
    },
    plugins: []
};
