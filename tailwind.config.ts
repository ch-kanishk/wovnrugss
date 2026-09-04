import type { Config } from 'tailwindcss';

export default {
  content: ['./src/**/*.{ts,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#faf7f2',
          100: '#f3ece0',
          200: '#e6d8c1',
          300: '#d4bd98',
          400: '#c09d6d',
          500: '#b0854f',
          600: '#996d43',
          700: '#7c5539',
          800: '#664634',
          900: '#553b2d',
        },
        ink: '#1c1a17',
        sand: '#f7f4ef',
      },
      fontFamily: {
        display: ['var(--font-display)', 'Georgia', 'serif'],
        body: ['var(--font-body)', 'system-ui', 'sans-serif'],
      },
      maxWidth: { container: '1360px' },
    },
  },
  plugins: [],
} satisfies Config;
