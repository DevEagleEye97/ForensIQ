import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#121214',
        surface: 'rgba(255, 255, 255, 0.06)',
        border: 'rgba(255, 255, 255, 0.10)',
        text: '#F2EFE9',
        'text-muted': '#A8A39A',
        accent: '#F2C230',
        pass: '#4ADE80',
        warn: '#FBBF24',
        fail: '#F87171',
      },
      borderRadius: {
        '20': '20px',
      },
      boxShadow: {
        panel: '0 4px 16px rgba(0, 0, 0, 0.2)',
        accent: '0 8px 24px rgba(242, 194, 48, 0.15)',
      },
      backdropBlur: {
        '3xl': '24px',
      },
    },
  },
  plugins: [],
};

export default config;
