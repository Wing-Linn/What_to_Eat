/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
        },
        cream: {
          50: '#faf9f6',
          100: '#f5f2ec',
          200: '#e8e3d8',
        },
        ink: {
          DEFAULT: '#1c2a26',
          soft: '#5b6b66',
        },
        accent: {
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c',
        },
      },
      boxShadow: {
        card: '0 2px 12px rgba(28, 42, 38, 0.06), 0 1px 3px rgba(28, 42, 38, 0.04)',
        'card-hover': '0 6px 24px rgba(28, 42, 38, 0.1), 0 2px 6px rgba(28, 42, 38, 0.05)',
      },
    },
  },
  plugins: [],
};
