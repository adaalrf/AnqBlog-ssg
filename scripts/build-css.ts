import fs from 'fs/promises';
import postcss from 'postcss';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';
import config from './config.js';
import { ensureDirectoryExists } from './utils/path-and-file-utils.js';

/**
 * Processes the input CSS file with PostCSS, Tailwind CSS, and Autoprefixer.
 * Reads the source CSS, processes it through Tailwind and Autoprefixer, then writes the output.
 * Also generates a source map if available.
 * @throws {Error} If file reading, processing, or writing fails.
 */
const processCSS = async (): Promise<void> => {
  try {
    const inputFilePath = config.inputCSS;
    const outputFilePath = config.outputCSS;

    // Ensure the output directory exists
    ensureDirectoryExists(outputFilePath);

    // Read the input CSS file
    const css = await fs.readFile(inputFilePath, 'utf8');

    // Process the CSS with PostCSS, Tailwind CSS, and Autoprefixer
    const result = await postcss([tailwindcss, autoprefixer]).process(css, {
      from: inputFilePath,
      to: outputFilePath,
    });

    // Write the processed CSS to the output file
    await fs.writeFile(outputFilePath, result.css);
    console.log(`(CSS.ts): Generated css file -> ${outputFilePath}`);

    // Write source map if available
    if (result.map) {
      await fs.writeFile(outputFilePath + '.map', result.map.toString());
    }
  } catch (error) {
    console.error('(CSS.ts): Failed to process CSS file ->', error);
    throw error;
  }
};

// Execute CSS processing
(async () => {
  try {
    await processCSS();
  } catch (error) {
    console.error('(CSS.ts): Failed to process CSS:', error);
    process.exit(1);
  }
})();

