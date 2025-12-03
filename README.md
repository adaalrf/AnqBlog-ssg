# ✨ AnqBlog-ssg - A Static Site Generator (v0.4 - Work in Progress) ✨

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Welcome to AnqBlog-ssg, a modular static site generator designed to help you build fast, reliable, and beautifully styled static websites. This project aims to provide a solid foundation for creating blogs, portfolios, documentation, and more, with a focus on ease of use and flexibility. It converts Markdown files into HTML, injects templates, supports pagination, generates tag pages, and processes CSS with Tailwind CSS and Autoprefixer.
This project started from a need for a simple, customizable, and efficient way to build static websites while keeping resource usage to a minimum. It aims to provide a solid foundation for creating blogs, portfolios, documentation, and more, with a focus on ease of use and flexibility.

To get you started. The true power lies in the ability to customize and extend the generator to suit your needs. Whether you're a developer, designer, or content creator, this generator can help you build a beautiful and functional static site with ease.

## 🚀 Features

- **Dark Mode**: Dark mode support is implemented, allowing users to switch between light and dark themes by clicking a toggle button.

- **Markdown to HTML Conversion**: Converts markdown content into fully formatted HTML pages.
- **Template Injection**: Templates are used for a consistent structure across pages, making updates easy.
- **Pagination Support**: Automatic pagination for long lists of content like blog posts.
- **Tag Pages**: Generates pages for content with shared tags, making it easier to organize related content.
- **Modular Structure**: Built with reusability and customization in mind, modules for each feature.
- **CSS Processing**: Uses Tailwind CSS and Autoprefixer for efficient, responsive styles.
- **JavaScript Bundling**: Bundles JavaScript files using Webpack for optimized performance.
- **Typescript Support**: The project uses TypeScript for user files for an enhanced development experience.

## 📋 Requirements

- **Node.js**: [Install Node.js](https://nodejs.org/).
- The rest will be installed with `npm install`. You can check the `package.json` file for more details.

## 🔧 Installation and Workflow

1. **Initial Setup**:

   - Clone the repository and install dependencies.

   ```bash
   git clone https://github.com/adaalrf/adaalrf.dev.git
   cd adaalrf.dev
   npm install
   ```

2. **Create Content**:

   - Write blog posts or pages in Markdown.
   - Place the Markdown files in `src/content/blog/posts/`.

   ```markdown
   ---
   title: 'My First Blog Post'
   date: '2024-01-01'
   tags: ['personal', 'introduction']
   ---

   Write your awesome content here.
   ```

3. **Customize Your Site**:

   - Update `config.js` to personalize settings like your site name, number of posts per page, etc.

   ```javascript
   const config = {
     siteName: 'My Amazing Blog',
     postsPerPage: 5,
     contentDirectory: 'src/content/blog/posts',
     outputDirectory: 'public',
   };
   export default config;
   ```

   - Edit or add templates in the `src/templates/` directory to change the HTML structure or styling.
   - I suggest adding standalone pages to the src/content/pages directory if needed. This is also where you find the index.html file. These files also support front-matter for metadata, title, and the like.

4. **Build the Site**:

   - Run the build command to generate HTML files from the Markdown content:

   ```bash
   npm run build
   ```

   The generated HTML files will be in the `public/` directory and ready for deployment.

   You can also serve the generated site locally using:

   ```bash
   npm run serve
   ```

   The `serve.js` script uses Node.js to spin up a simple HTTP server that will serve the `public` directory. This will allow you to view the site at `http://localhost:8080`.

   If a specific `404.html` file is found within a directory, it will be used for not-found pages in that directory. Otherwise, the root-level `404.html` will be served as a fallback.

   **Note: The serve.js script is NOT suitable for production use. It does not handle concurrent requests, caching, security, or other advanced features typically found in production servers.**

## 🚢 Deployment

To deploy the generated files to your server, you can use a deployment script like the following example for Linux and Mac:

### Deployment Script Example

```bash
#!/bin/bash

# Transfer files to VPS
scp -r public/* root@<yourHostIp>:/var/www/myWebsite/
```

Windows users can use tools such as **WinSCP** or **PuTTY** to automate deployment. Refer to their respective documentation for detailed instructions.

The script will copy the files from the `public/` directory to your server. It is recommended to test the deployment on a local or non-production server first to ensure everything works as intended. Replace `<yourHostIp>` with your server's IP address (e.g., `192.168.1.1`) and `/var/www/myWebsite/` with the appropriate directory path on your server (e.g., `/var/www/html/`).

Or move the contents manually.

## 📁 File Structure

- `src/`
  - `assets/`: Static assets like images and icons.
  - `content/`: Markdown files for each page/post.
  - `styles/`: Source CSS files to be processed by Tailwind CSS and Autoprefixer.
  - `templates/`: HTML templates used to wrap around the converted markdown.
  - `ts/`: TypeScript files used for interactivity and utility functions, including:
    - `burger-dropdown.ts`: Controls the behavior of the burger menu dropdown.
    - `main.ts`: Main entry point, imports other TypeScript modules. (Should be left alone, as it will be rewritten during the build process.)
    - `tags-dropdown.ts`: Controls the tags dropdown behavior.
    - `toggle-theme.ts`: Manages theme switching between light and dark mode.
- `public/`: The output folder for the generated static site.
- `scripts/`: Contains various build and utility scripts, including CSS processing, generating imports, and applying templates.
- `temp/`: Temporary files generated during the site build process.
- `build.js`: JavaScript script for the complete build process, ensuring cross-platform compatibility.
- `serve.js`: JavaScript script to serve the `public` directory locally, handling directory-specific and default 404 pages.
- `legacy/`: Old or decrepit code that is no longer maintained or supported. They are here for historical purposes only.

## 🎨 CSS Styling

The generator uses **Tailwind CSS** for utility-first styling, which helps keep the CSS lightweight and maintainable. **Autoprefixer** is used to ensure cross-browser compatibility. If you would like more information on customizing Tailwind CSS, please refer to the [Tailwind CSS Documentation](https://tailwindcss.com/docs).

To customize the appearance of your site, you can:

- **Templates**: Modify the base HTML structure by editing files in the `src/templates/` folder.
- **Pagination**: Adjust the number of posts per page by editing the `config.js` file.
- **Tags**: Tags are automatically pulled from the Markdown front matter and used to generate tag pages.
- **JavaScript/TypeScript**: Add or modify JavaScript behavior by editing the files in the `src/ts/` directory.

## 🤝 Contributing

Contributions are welcome! Feel free to submit a pull request or open an issue for feedback or feature requests. [adaalrf.dev](https://github.com/adaalrf/adaalrf.dev)

## 📜 License

This project is licensed under the MIT License. See the `LICENSE` file for more information.

## 🔮 Future Improvements

- **Refactoring and Optimizations**: Improve code readability, maintainability, and performance by continuously refactoring the codebase.
- **Asset Optimization**: Add image optimization for even faster page loads.
- **RSS Feed Generation**: Automatically generate RSS feeds for blog posts.
- **Plugin System**: Develop a plugin system to allow additional features, such as SEO enhancements or analytics, to be easily added.
- **Search Functionality**: Add a client-side search feature to make it easier for users to find specific posts or content.
- **Local Storage Caching**: Implement caching using local storage or service workers to improve site speed and user experience for returning visitors.
- **Automatic Sitemap Generation**: Generate an XML sitemap automatically to improve SEO and make it easier for search engines to crawl the site.

## 💬 Questions or Feedback?

If you have any questions or feedback, please feel free to reach out by [opening an issue](https://github.com/adaalrf/adaalrf.dev/issues) or contacting me directly.
