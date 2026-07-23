import fsPromises from 'fs/promises';
import postcss from 'postcss';
import tailwindcss from '@tailwindcss/postcss';
import autoprefixer from 'autoprefixer';
import config from '../config/config.js';
import { ensureDirectoryExists } from '../shared/path-and-file-utils.js';
import { formatError } from '../internal/error-utils.js';
import { logger } from '../shared/logger.js';

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
    const css = await fsPromises.readFile(inputFilePath, 'utf8');

    // Process the CSS with PostCSS, Tailwind CSS, and Autoprefixer
    const result = await postcss([tailwindcss, autoprefixer]).process(css, {
      from: inputFilePath,
      to: outputFilePath,
    });

    // Write the processed CSS to the output file
    await fsPromises.writeFile(outputFilePath, result.css);
    logger.info('build-css.ts', `Generated css file -> ${outputFilePath}`);

    // Write source map if available
    if (result.map) {
      await fsPromises.writeFile(outputFilePath + '.map', result.map.toString());
    }
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('build-css.ts', formatError(err, 'Failed to process CSS file'));
    throw error;
  }
};

// Execute CSS processing
processCSS().catch((error) => {
  const err = error instanceof Error ? error : new Error(String(error));
  logger.error('build-css.ts', formatError(err, 'Failed to process CSS'));
  process.exit(1);
});
