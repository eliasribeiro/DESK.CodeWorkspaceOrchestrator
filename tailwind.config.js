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
          light: '#ffffff',
          dark: '#0a0a0b', /* Refined pure-ish dark background */
        },
        surface: {
          light: '#f9fafb',
          dark: '#121214', /* Slightly lighter surface for dark mode */
        },
        border: {
          light: '#e5e7eb',
          dark: '#27272a', /* Minimal border contrast */
        },
        primary: {
          light: '#000000',
          dark: '#ffffff',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'Menlo', 'monospace'],
        display: ['Outfit', 'sans-serif'],
      },
      transitionTimingFunction: {
        'smooth': 'cubic-bezier(0.23, 1, 0.32, 1)',
      }
    },
  },
  plugins: [],
};
