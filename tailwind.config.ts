import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    screens: {
      sm: '640px',
      md: '768px',
      two: '900px', // two-column letter + fact box (spec 7.2)
      lg: '1024px',
      xl: '1280px',
    },
    container: {
      center: true,
      padding: '1rem',
      screens: { xl: '1200px' },
    },
    extend: {
      colors: {
        space: 'var(--color-bg)',
        surface: 'var(--color-surface)',
        ink: 'var(--color-text)',
        muted: 'var(--color-text-muted)',
        dust: 'var(--color-dust)',
        accent: 'var(--color-accent)',
      },
      fontFamily: {
        sans: 'var(--font-ui)',
        display: 'var(--font-display)',
      },
    },
  },
  plugins: [],
} satisfies Config;
