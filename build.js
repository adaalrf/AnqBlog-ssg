// build.js
import fs from 'fs/promises';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const rootDir = path.resolve(path.dirname(''));

(async () => {
  try {
    const startTime = Date.now();

    // Remove the public directory
    const publicDir = path.join(rootDir, 'public');
    await fs.rm(publicDir, { recursive: true, force: true });

    // Remove temp directory
    const tempDir = path.join(rootDir, 'src', 'temp');
    await fs.rm(tempDir, { recursive: true, force: true });

    // Generate dynamic imports
    console.log('Generating dynamic imports...');
    await execAsync('node scripts/generate-imports.js');

    // Bundle website code using Webpack
    console.log('Bundling website code using Webpack...');
    await execAsync('npx webpack --config webpack.config.js');

    // Copy necessary assets to the public directory
    const assetsSrc = path.join(rootDir, 'src', 'assets');
    const assetsDest = path.join(rootDir, 'public', 'assets');
    await copyDirectory(assetsSrc, assetsDest);

    // Run the generation scripts to generate the output files
    console.log('Running the generation scripts...');
    await execAsync('node scripts/generate.js');

    // Process Tailwind CSS using PostCSS
    console.log('Processing Tailwind CSS...');
    await execAsync('node scripts/build-css.js');

    const endTime = Date.now();
    const buildTimeMs = endTime - startTime;
    const buildTimeSec = Math.floor(buildTimeMs / 1000);
    const remainingMs = buildTimeMs % 1000;

    console.log(
      `Build complete. Generated files are in the 'public' directory.`,
    );
    console.log(`Build time: ${buildTimeSec}s ${remainingMs}ms.`);
  } catch (error) {
    console.error('Error during build process:', error);
  }
})();

// Helper function to copy directories recursively
async function copyDirectory(src, dest) {
  try {
    await fs.mkdir(dest, { recursive: true });
    const entries = await fs.readdir(src, { withFileTypes: true });

    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);

      if (entry.isDirectory()) {
        await copyDirectory(srcPath, destPath);
      } else if (entry.isFile()) {
        await fs.copyFile(srcPath, destPath);
      }
    }
  } catch (error) {
    console.error(`Error copying directory from ${src} to ${dest}:`, error);
  }
}
