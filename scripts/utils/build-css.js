// Description: This script reads the input CSS file, processes it with PostCSS, Tailwind CSS, and Autoprefixer, and writes the processed CSS to the output file.
import fs from 'fs';
import path from 'path';
import postcss from 'postcss';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';
import { fr } from './resolve-path.js';

// Define input and output paths
const inputFilePath = fr('src/styles/tailwind.css');
const outputFilePath = fr('public/styles/styles.css');

// Ensure the output directory exists
if (!fs.existsSync(path.dirname(outputFilePath))) {
  fs.mkdirSync(path.dirname(outputFilePath), { recursive: true });
}

// Read the input CSS file
fs.readFile(inputFilePath, 'utf8', (err, css) => {
  if (err) throw err;

  // Process the CSS with PostCSS, Tailwind CSS, and Autoprefixer
  postcss([tailwindcss, autoprefixer])
    .process(css, { from: inputFilePath, to: outputFilePath })
    .then((result) => {
      // Write the processed CSS to the output file
      fs.writeFile(outputFilePath, result.css, () =>
        console.log(`(CSS.js): Generated ${outputFilePath}`),
      );
      if (result.map) {
        fs.writeFile(
          outputFilePath + '.map',
          result.map.toString(),
          () => true,
        );
      }
    })
    .catch((error) => console.error('Failed to process CSS:', error));
});
