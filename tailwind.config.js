/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.html', './src/**/*.ts'],
  darkMode: 'class',
  // Theme configuration moved to CSS @theme directive in src/styles/tailwind.css
  plugins: [require('@tailwindcss/typography')],
};
