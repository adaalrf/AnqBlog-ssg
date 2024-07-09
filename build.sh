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
