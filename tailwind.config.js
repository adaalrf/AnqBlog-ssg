/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.html', './src/**/*.ts'],
  // Theme configuration moved to CSS @theme directive in src/styles/tailwind.css
  // Dark mode is handled via class-based approach in CSS
  plugins: [require('@tailwindcss/typography')],
};
