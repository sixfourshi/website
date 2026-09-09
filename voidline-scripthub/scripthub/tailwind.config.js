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
          DEFAULT: '#070C1B',
          elevated: '#0C1430',
        },
        surface: {
          DEFAULT: '#101A3D',
          hover: '#16224A',
        },
        line: '#1E2A54',
        ink: {
          DEFAULT: '#E7ECFA',
          muted: '#93A1CC',
          faint: '#5C6890',
        },
        azure: {
          50: '#EEF4FF',
          100: '#DCE7FF',
          200: '#B3CBFF',
          300: '#82A9FF',
          400: '#5487FF',
          500: '#3568F2',
          600: '#264ECC',
          700: '#1E3EA3',
          800: '#182F7A',
          900: '#13224F',
        },
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        body: ['"Inter"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'grid-lines':
          'linear-gradient(to right, rgba(84,135,255,0.07) 1px, transparent 1px), linear-gradient(to bottom, rgba(84,135,255,0.07) 1px, transparent 1px)',
        'radial-glow':
          'radial-gradient(circle at 50% 0%, rgba(53,104,242,0.35), transparent 60%)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'glow-pulse': {
          '0%, 100%': { opacity: '0.5' },
          '50%': { opacity: '0.9' },
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
        glow: '0 0 40px rgba(53,104,242,0.25)',
        'glow-sm': '0 0 20px rgba(53,104,242,0.18)',
      },
    },
  },
  plugins: [],
};
