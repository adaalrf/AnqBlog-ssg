import fs from 'fs';
import postcss from 'postcss';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';
import config from './config.js';
import { ensureDirectoryExists } from './utils/path-and-file-utils.js';

/**
 * Processes the input CSS file with PostCSS, Tailwind CSS, and Autoprefixer, and writes the output CSS file.
 */
const processCSS = () => {
  const inputFilePath = config.inputCSS;
  const outputFilePath = config.outputCSS;

  // Ensure the output directory exists
  ensureDirectoryExists(outputFilePath);

  // Read the input CSS file
  fs.readFile(inputFilePath, 'utf8', (err, css) => {
    if (err) throw err;

    // Process the CSS with PostCSS, Tailwind CSS, and Autoprefixer
    postcss([tailwindcss, autoprefixer])
      .process(css, { from: inputFilePath, to: outputFilePath })
      .then((result) => {
        // Write the processed CSS to the output file
        fs.writeFile(outputFilePath, result.css, () =>
          console.log(`(CSS.js): Generated css file -> ${outputFilePath}`),
        );
        if (result.map) {
          fs.writeFile(
            outputFilePath + '.map',
            result.map.toString(),
            () => true,
          );
        }
      })
      .catch((error) =>
        console.error('(CSS.js): Failed to process CSS file ->', error),
      );
  });
};

// Execute the CSS processing
processCSS();
