/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class', '[data-theme="dark"]'],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        analytics: {
          DEFAULT: 'var(--analytics-text)',
          soft: 'var(--analytics-soft)',
          border: 'var(--analytics-border)',
        },
      },
    },
  },
  plugins: [],
}
