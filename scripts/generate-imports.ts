import fsPromises from 'fs/promises';
import { fpr, writeFileContent } from './utils/path-and-file-utils.js';
import { formatError } from './utils/error-utils.js';
import { logger } from './utils/logger.js';

const dirPath = fpr('src/ts');
const outputPath = fpr('src/ts/main.ts');

/**
 * Generates the main.ts file by reading all .ts files in the src/ts directory except main.ts.
 * Only includes root-level files (not files in subdirectories like utils/).
 * @throws {Error} If the directory cannot be read, output path is a directory, or file writing fails.
 */
const generateImports = async (): Promise<void> => {
  // Read all entries in the directory
  const entries = await fsPromises.readdir(dirPath, { withFileTypes: true });

  // Filter for .ts files only (not directories) and exclude main.ts
  const files = entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.ts') && entry.name !== 'main.ts')
    .map((entry) => entry.name)
    .sort(); // Sort for consistent output

  // Generate import statements
  const imports = files.map((file) => `import './${file.replace('.ts', '')}';`).join('\n');

  // Generate main.ts content with imports and initialization
  const mainContent = `
${imports}

// Initialization logic
document.addEventListener('DOMContentLoaded', () => {
    // Website initialized
});
`;

  // Ensure the output path is not a directory
  try {
    const stats = await fsPromises.lstat(outputPath);
    if (stats.isDirectory()) {
      throw new Error(`Output path is a directory: ${outputPath}`);
    }
  } catch (error) {
    // If file doesn't exist, that's fine - we'll create it
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      throw error;
    }
  }

  // Write the main.ts file
  await writeFileContent(outputPath, mainContent);

  logger.info('generate-imports.ts', `Generated imports file -> ${outputPath}`);
};

// Execute the imports generation
generateImports().catch((error) => {
  const err = error instanceof Error ? error : new Error(String(error));
  logger.error('generate-imports.ts', formatError(err, 'Error generating imports'));
  process.exit(1);
});
