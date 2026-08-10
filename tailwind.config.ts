import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        usas: {
          navy: '#0B1B3D',
          blue: '#002B5B',
          gold: '#D4AF37',
          'gold-light': '#FFD700',
          emerald: '#00875A',
          dark: '#070F22',
          card: '#0F2148',
          border: 'rgba(212, 175, 55, 0.2)',
        },
      },
    },
  },
  plugins: [],
};

export default config;
