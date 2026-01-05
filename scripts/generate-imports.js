import fs from 'fs';
import { fpr } from './utils/path-and-file-utils.js';

const dirPath = fpr('src/ts');
const outputPath = fpr('src/ts/main.ts');

/**
 * Generates the main.ts file by reading all .ts files in the src/ts directory except main.ts.
 */
const generateImports = () => {
  // Read all .ts files in the directory except main.ts
  const files = fs
    .readdirSync(dirPath)
    .filter((file) => file.endsWith('.ts') && file !== 'main.ts');

  // Generate import statements
  const imports = files
    .map((file) => `import './${file.replace('.ts', '')}';`)
    .join('\n');

  // Generate main.ts content with imports and initialization
  const mainContent = `
${imports}

// Initialization logic
document.addEventListener('DOMContentLoaded', () => {
    // Website initialized
});
`;

  // Ensure the output path is not a directory
  if (fs.existsSync(outputPath) && fs.lstatSync(outputPath).isDirectory()) {
    throw new Error(`Output path is a directory: ${outputPath}`);
  }

  // Write the main.ts file
  fs.writeFileSync(outputPath, mainContent);

  console.log(`(Imports.js): Generated imports file -> ${outputPath}`);
};

// Execute the imports generation
generateImports();
