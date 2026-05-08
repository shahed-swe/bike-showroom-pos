/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Red brand — premium showroom red
        brand: {
          50: '#fff1f2',
          100: '#ffe1e3',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
          950: '#3f0a0c',
        },
        // Near-black surfaces for dark mode
        ink: {
          50: '#f8f8f8',
          100: '#eeeeee',
          200: '#dcdcdc',
          300: '#bdbdbd',
          400: '#888888',
          500: '#555555',
          600: '#333333',
          700: '#222222',
          800: '#171717',
          900: '#0d0d0d',
          950: '#050505',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Poppins', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 2px 8px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.06)',
        card: '0 4px 20px rgba(0,0,0,0.06)',
        'card-dark': '0 4px 20px rgba(0,0,0,0.45)',
      },
    },
  },
  plugins: [],
};
