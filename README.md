# Static site generator with Markdown blog features

Version 0.3

### Overview

This project is designed to generate static HTML files for a blog and other content pages. It utilizes a modular structure to ensure maintainability, ease of use, and separation of concerns. The primary components include parsing markdown files, generating HTML content, and applying layout templates.

### Features

- **Markdown to HTML Conversion**: Convert markdown files to HTML with front matter support.
- **Template Injection**: Inject content into HTML templates with placeholder replacement.
- **Pagination**: Generate paginated blog pages.
- **Tag Pages**: Generate tag-specific pages for blog posts.
- **Intermediate and Final Post Generation**: Separate steps for generating intermediate and final HTML files for blog posts.
- **CSS Processing**: Build CSS using Tailwind CSS and Autoprefixer.

### Directory Structure

```plaintext
project-root/
├── public/
│ ├── assets/
│ │ ├── icons/
│ │ └── styles/
│ ├── blog/
│ │ ├── tags/
│ │ ├── blog-page-1.html
│ │ ├── blog-page-2.html
│ │ └── ...
│ ├── posts/
│ │ ├── post1.html
│ │ ├── post2.html
│ │ └── ...
│ └── index.html
├── scripts/
│ ├── blog/
│ │ ├── generate-final-posts.js
│ │ ├── generate-intermediate-posts.js
│ │ ├── generate-paginated-blog.js
│ │ └── generate-tag-pages.js
│ └── utils/
│ ├── build-css.js
│ ├── date-utils.js
│ ├── generate-imports.js
│ ├── parsing-utils.js
│ └── resolve-path.js
├── src/
│ ├── assets/
│ │ └── icons/
│ ├── content/
│ │ ├── posts/
│ │ └── styles/
│ ├── templates/
│ │ ├── about-template.html
│ │ ├── blog-template.html
│ │ ├── layout-template.html
│ │ └── post-template.html
│ └── ts/
│ ├── fetch-posts.ts
│ ├── main.ts
│ └── toggle-theme.ts
├── .gitignore
├── build.sh
├── marked.json
├── package.json
├── README.md
└── ...
```

### Installation

1. **Clone the Repository**:
   ```sh
   git clone https://github.com/your-repo/project-name.git
   cd project-name
   ```
2. **Install Dependencies**:
   ```sh
   npm install
   ```
3. **Configure Project**:
   Ensure marked.json is properly configured with your markdown parsing options.

### Usage

**Build**
To build the project, run the following command:

```sh
./build.sh
```

This script performs the following actions:

- Generates dynamic imports.
- Bundles website code using Webpack.
- Copies necessary assets to the public directory.
- Runs the generation scripts to generate the output files.
- Processes Tailwind CSS using PostCSS.
- Displays the build time.

**The build.sh script**:

```sh
#!/bin/bash

# Ensure script is being run from the project root
cd "$(dirname "$0")"

# Start timer
start_time=$(date +%s%3N)

# Generate dynamic imports
node scripts/utils/generate-imports.js

# Bundle website code using Webpack
npx webpack --config webpack.config.js

# Copy necessary assets to the public directory
cp -r src/assets public/

# Run the generation scripts to generate the output files
node scripts/generate.js

# Process Tailwind CSS using PostCSS
node scripts/utils/build-css.js

# End timer
end_time=$(date +%s%3N)

# Calculate duration in milliseconds
build_time_ms=$((end_time - start_time))

# Convert milliseconds to seconds and milliseconds
build_time_sec=$((build_time_ms / 1000))
build_time_ms=$((build_time_ms % 1000))

echo "Build complete. Generated files are in the 'public' directory."
echo "Build time: ${build_time_sec}s ${build_time_ms}ms."

# Change to whatever local server you want to use (e.g. http-server, live-server, etc.)
http-server public
```

### Deploy

To deploy the project to your VPS, run the following command:

```sh
./deploy.sh
```

The deploy.sh script:

```
#!/bin/bash

# Transfer files to VPS
scp -r public/* root@<yourHostIp>:/var/www/myWebsite/
```

Replace <yourHostIp> with the IP address of your VPS.

### Configuration

marked.json: Configuration file for the markdown parser.
