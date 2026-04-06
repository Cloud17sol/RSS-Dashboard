/** @type {import('tailwindcss').Config} */
export default {
  // Must match useRSSFeeds `applyTheme`: toggle `dark` on <html>, not OS media only.
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {},
  },
  plugins: [],
};
