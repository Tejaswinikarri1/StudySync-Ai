/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans:  ['Manrope', 'sans-serif'],
        heading: ['Outfit', 'sans-serif'],
        mono:  ['JetBrains Mono', 'monospace'],
      },
      colors: {
        primary: '#6366f1',
        violet:  '#8b5cf6',
        cyan:    '#22d3ee',
      },
    },
  },
  plugins: [],
}
