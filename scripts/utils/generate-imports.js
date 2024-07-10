// Description: This script generates the main.ts file by reading all .ts files in the src/ts directory except main.ts.
import fs from 'fs';
import { fr } from './resolve-path.js';

const dirPath = fr('src/ts');
const outputPath = fr('src/ts/main.ts');

// Read all .ts files in the directory except main.ts
const files = fs
  .readdirSync(dirPath)
  .filter((file) => file.endsWith('.ts') && file !== 'main.ts');

// Generate import statements
const imports = files.map((file) => `import './${file}';`).join('\n');

// Add initialization logic to the main.ts content
const mainContent = `
${imports}

// Initialization logic
document.addEventListener('DOMContentLoaded', () => {
    console.log('Website loaded');
    // Additional website logic here
});
`;

// Write the main.ts file
fs.writeFileSync(outputPath, mainContent);

console.log(`(Imports.js): Generated ${outputPath}`);
