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
          light: '#F3F4F6',
          dark: '#111827',
        },
        surface: {
          light: '#FFFFFF',
          dark: '#1F2937',
        },
        border: {
          light: '#E5E7EB',
          dark: '#374151',
        },
        primary: {
          light: '#0b5cff',
          dark: '#0b5cff',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'Consolas', 'Monaco', 'monospace'],
        display: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
};
