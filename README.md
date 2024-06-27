# Markdown Blog

A simple Markdown blog generator using Tailwind CSS, PostCSS, and TypeScript.

## Features

- Convert Markdown files to HTML
- Use Tailwind CSS for styling
- Optimize CSS with PostCSS
- Bundle TypeScript files with Webpack
- Automated build and installation scripts

## Project Structure

```plaintext
markdown-blog/
├── node_modules/ # Should be in .gitignore, not included in repo
├── public/ # Generated, not included in repo
│ ├── styles/
│ │ └── styles.css
│ ├── assets/
│ ├── posts/
│ └── js/
│ └── bundle.js
├── scripts/
│ ├── generate.js
│ ├── generate-imports.js
│ └── build-css.js
├── src/
│ ├── styles/
│ │ └── tailwind.css
│ ├── ts/
│ │ ├── main.ts
│ │ ├── store.ts
│ │ ├── analytics.ts
│ │ ├── helper.ts
│ │ └── another.ts
│ ├── posts/
│ │ └── hello-world.md # Example Markdown file
│ ├── assets/
│ └── index.html # Example HTML file
├── package.json
├── tsconfig.json
├── webpack.config.js
├── postcss.config.js
├── tailwind.config.js
├── build.sh
├── install.sh
└── .gitignore
```

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/)
- [npm](https://www.npmjs.com/)

### Installation

1. **Clone the Repository**:

   ```sh
   git clone <repository-url>
   cd markdown-blog
   ```

   ```sh
   ./install.sh
   ```

   ```sh
   ./build.sh
   ```

## Serving the Project

To serve the public directory, you can use a simple HTTP server:

```sh
npx http-server public
```

Or configure a web server like Nginx to serve the public directory.
Project Scripts

**install.sh**

This script initializes the project, installs dependencies, and sets up configuration files.

**build.sh**

This script builds the project, processes CSS, and generates the necessary output files.

**scripts/generate.js**

This script converts Markdown files in the src/posts directory to HTML.

**scripts/generate-imports.js**

This script dynamically generates import statements for all TypeScript files in the src/ts directory.

**scripts/build-css.js**

This script processes Tailwind CSS using PostCSS and generates an optimized CSS file.
Example HTML File\*\*

### src/index.html:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Markdown Blog</title>
    <link rel="stylesheet" href="styles/styles.css" />
  </head>
  <body>
    <div id="app">
      <!-- Your content here -->
    </div>
    <script src="js/bundle.js"></script>
  </body>
</html>
```
