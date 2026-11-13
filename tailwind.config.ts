import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    container: {
      center: true,
      padding: '1rem',
      screens: { xl: '1200px' },
    },
    extend: {
      colors: {
        space: 'rgb(var(--color-bg) / <alpha-value>)',
        surface: 'rgb(var(--color-surface) / <alpha-value>)',
        raised: 'rgb(var(--color-raised) / <alpha-value>)',
        line: 'rgb(var(--color-line) / <alpha-value>)',
        ink: 'rgb(var(--color-text) / <alpha-value>)',
        muted: 'rgb(var(--color-text-muted) / <alpha-value>)',
        accent: 'rgb(var(--color-accent) / <alpha-value>)',
        moon: 'rgb(var(--color-moon) / <alpha-value>)',
        mars: 'rgb(var(--color-mars) / <alpha-value>)',
        deep: 'rgb(var(--color-deep) / <alpha-value>)',
      },
      fontFamily: {
        sans: 'var(--font-ui)',
        display: 'var(--font-display)',
      },
    },
  },
  plugins: [],
} satisfies Config;
