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
          light: '#f8fafc',
          dark: '#161111',
        },
        surface: {
          light: '#ffffff',
          dark: '#302e2d',
        }
      }
    },
  },
  plugins: [],
};
