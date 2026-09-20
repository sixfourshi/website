/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        base: {
          DEFAULT: '#050505',
          elevated: '#0c0c0e',
        },
        surface: {
          DEFAULT: '#121215',
          hover: '#19191e',
        },
        line: '#27272a',
        ink: {
          DEFAULT: '#f4f4f5',
          muted: '#a1a1aa',
          faint: '#71717a',
        },
        azure: {
          50: '#fafafa',
          100: '#f4f4f5',
          200: '#e4e4e7',
          300: '#d4d4d8',
          400: '#a1a1aa',
          500: '#71717a',
          600: '#52525b',
          700: '#3f3f46',
          800: '#27272a',
          900: '#18181b',
        },
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        body: ['"Inter"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'grid-lines':
          'linear-gradient(to right, rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.04) 1px, transparent 1px)',
        'radial-glow':
          'radial-gradient(circle at 50% 0%, rgba(255,255,255,0.08), transparent 65%)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'glow-pulse': {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '0.8' },
        },
        'accordion-down': {
          '0%': { height: '0', opacity: '0' },
          '100%': { height: 'var(--radix-height, auto)', opacity: '1' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.7s ease forwards',
        'glow-pulse': 'glow-pulse 6s ease-in-out infinite',
      },
      boxShadow: {
        glow: '0 0 45px rgba(255,255,255,0.08)',
        'glow-sm': '0 0 22px rgba(255,255,255,0.05)',
      },
    },
  },
  plugins: [],
};
