const fs = require('fs');
const path = require('path');
const { fr, rp } = require('./resolve-path');

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

console.log(`Generated ${outputPath}`);
