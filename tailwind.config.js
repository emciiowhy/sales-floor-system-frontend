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
        dark: {
          bg: '#0f172a',
          card: '#1e293b',
          border: '#334155',
        },
        hot: '#ef4444',
        warm: '#f97316',
        int: '#3b82f6',
        tihu: '#eab308',
        wsmsnt: '#6b7280',
      },
    },
  },
  plugins: [],
}