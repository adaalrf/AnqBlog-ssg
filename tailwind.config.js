/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./templates/**/*.html', './content/**/*.html', './client/**/*.ts'],
  darkMode: 'class',
  // Theme configuration moved to CSS @theme directive in styles/tailwind.css
  plugins: [require('@tailwindcss/typography')],
};
