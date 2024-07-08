module.exports = {
  enabled: true,
  content: ['./src/**/*.html', './src/**/*.ts'],
  darkMode: 'class', // Enable dark mode, use class="dark" in html
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        muted: 'var(--muted)',
        'muted-foreground': 'var(--muted-foreground)',
        primary: 'var(--primary)',
        'primary-foreground': 'var(--primary-foreground)',
        secondary: 'var(--secondary)',
        'secondary-foreground': 'var(--secondary-foreground)',
        accent: 'var(--accent)',
        'accent-foreground': 'var(--accent-foreground)',
        destructive: 'var(--destructive)',
        'destructive-foreground': 'var(--destructive-foreground)',
        code: 'var(--code)',
        'code-foreground': 'var(--code-foreground)',
      },
    },
  },
  variants: {
    extend: {},
  },
  plugins: [],
};
