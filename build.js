#!/usr/bin/env node
// build.js
import fs from 'fs/promises';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const rootDir = process.cwd();

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
    try {
      await execAsync('node scripts/generate-imports.js');
    } catch (error) {
      throw new Error(`generate-imports.js failed: ${error.message}`);
    }

    // Bundle website code using Webpack
    console.log('Bundling website code using Webpack...');
    try {
      await execAsync('npx webpack --config webpack.config.js');
    } catch (error) {
      throw new Error(`Webpack failed: ${error.message}`);
    }

    // Copy necessary assets to the public directory
    const assetsSrc = path.join(rootDir, 'src', 'assets');
    const assetsDest = path.join(rootDir, 'public', 'assets');
    try {
      await fs.access(assetsSrc);
      await copyDirectory(assetsSrc, assetsDest);
    } catch (error) {
      if (error.code === 'ENOENT') {
        console.warn('Assets directory not found, skipping asset copy.');
      } else {
        throw error;
      }
    }

    // Run the generation scripts to generate the output files
    console.log('Running the generation scripts...');
    try {
      await execAsync('node scripts/generate.js');
    } catch (error) {
      throw new Error(`generate.js failed: ${error.message}`);
    }

    // Process Tailwind CSS using PostCSS
    console.log('Processing Tailwind CSS...');
    try {
      await execAsync('node scripts/build-css.js');
    } catch (error) {
      throw new Error(`build-css.js failed: ${error.message}`);
    }

    // Copy root index.html and fix paths
    const pagesIndexPath = path.join(publicDir, 'pages', 'index.html');
    const rootIndexPath = path.join(publicDir, 'index.html');
    try {
      const indexContent = await fs.readFile(pagesIndexPath, 'utf8');
      // Fix paths: replace /pages/ with / for root
      const fixedContent = indexContent.replace(/\/pages\//g, '/');
      await fs.writeFile(rootIndexPath, fixedContent);
      console.log('Created root index.html');
    } catch (error) {
      // Ignore if pages/index.html doesn't exist
    }

    // Verify critical build outputs
    const criticalFiles = [
      path.join(publicDir, 'styles', 'styles.css'),
      path.join(publicDir, 'js', 'bundle.js'),
    ];

    const missingFiles = [];
    for (const file of criticalFiles) {
      try {
        await fs.access(file);
      } catch {
        missingFiles.push(path.relative(rootDir, file));
      }
    }

    if (missingFiles.length > 0) {
      console.warn('Warning: Some expected files were not generated:');
      missingFiles.forEach(file => console.warn(`  - ${file}`));
    }

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
    process.exit(1);
  }
})();
/**
 * Recursively copies a directory and its contents.
 * @param {string} src - The source directory path.
 * @param {string} dest - The destination directory path.
 * @throws {Error} - If copying fails.
 */
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
    throw error; // Re-throw to fail the build if asset copy fails
  }
}
