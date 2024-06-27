#!/bin/bash

# Ensure script is being run from the project root
cd "$(dirname "$0")"

# Initialize a new Node.js project if package.json doesn't exist
if [ ! -f package.json ]; then
  echo "Initializing new Node.js project..."
  npm init -y
fi

# Install necessary dependencies
echo "Installing dependencies..."
npm install tailwindcss postcss autoprefixer postcss-cli typescript ts-loader webpack webpack-cli @types/node

# Create Tailwind CSS configuration file
if [ ! -f tailwind.config.js ]; then
  echo "Creating Tailwind CSS configuration file..."
  npx tailwindcss init
  # Add purge configuration to tailwind.config.js
  echo "module.exports = {
  purge: {
    enabled: true,
    content: ['./src/**/*.html', './src/**/*.ts'],
  },
  darkMode: false, // or 'media' or 'class'
  theme: {
    extend: {},
  },
  variants: {
    extend: {},
  },
  plugins: [],
};" > tailwind.config.js
fi

# Create PostCSS configuration file
if [ ! -f postcss.config.js ]; then
  echo "Creating PostCSS configuration file..."
  echo "module.exports = {
  plugins: [
    require('tailwindcss'),
    require('autoprefixer'),
  ],
};" > postcss.config.js
fi

# Create TypeScript configuration file
if [ ! -f tsconfig.json ]; then
  echo "Creating TypeScript configuration file..."
  echo "{
  \"compilerOptions\": {
    \"module\": \"ESNext\",
    \"target\": \"ESNext\",
    \"moduleResolution\": \"node\",
    \"outDir\": \"./public\",
    \"rootDir\": \"./src\",
    \"strict\": true,
    \"esModuleInterop\": true,
    \"forceConsistentCasingInFileNames\": true,
    \"skipLibCheck\": true
  },
  \"include\": [\"src/**/*\"]
}" > tsconfig.json
fi

# Create necessary directories
mkdir -p src/ts src/styles src/posts src/assets public public/styles public/js scripts

# Create Tailwind CSS entry file if it doesn't exist
if [ ! -f src/styles/tailwind.css ]; then
  echo "Creating Tailwind CSS entry file..."
  echo "@tailwind base;
@tailwind components;
@tailwind utilities;" > src/styles/tailwind.css
fi

echo "Installation complete. You can now run ./build.sh to build the project."
