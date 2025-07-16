/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './apps/docs/src/**/*.{js,ts,jsx,tsx}',
    './apps/docs/docs/**/*.{md,mdx}',
  ],
  darkMode: 'class',
  theme: {
    fontFamily: {
      sans: ['Spline Sans', 'Noto Sans', 'sans-serif'],
    },
    extend: {
      colors: {},
    },
  },
  plugins: [],
}
