/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: {
          light: '#F9FAFB', // gray-50
          dark: '#050505',
        },
        surface: {
          light: '#FFFFFF',
          dark: '#111111',
        },
        border: {
          light: '#E5E7EB', // gray-200
          dark: '#222222',
        },
        primary: {
          light: '#3B82F6', // blue-500
          dark: '#3B82F6',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['Cascadia Code', 'Consolas', 'Monaco', 'monospace'],
      }
    },
  },
  plugins: [],
};
