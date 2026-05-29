import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        surface: '#0f172a',
        'surface-soft': '#111827',
        panel: '#1f2937',
        muted: '#94a3b8',
      },
    },
  },
  plugins: [],
} satisfies Config;
