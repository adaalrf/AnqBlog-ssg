#!/usr/bin/env node
/**
 * Main build orchestrator for the static site generator.
 *
 * This script:
 * 1. Checks and auto-generates config if missing
 * 2. Compiles TypeScript source files to JavaScript in dist/
 * 3. Validates configuration
 * 4. Generates dynamic imports
 * 5. Bundles client-side code with Webpack
 * 6. Copies assets
 * 7. Generates HTML content from Markdown
 * 8. Processes CSS with Tailwind and PostCSS
 * 9. Minifies HTML output
 *
 * The compiled JavaScript files are placed in the dist/ directory,
 * which is gitignored and regenerated on each build.
 */
import fs from 'fs/promises';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { readFileSync, existsSync } from 'fs';
import { pathToFileURL } from 'url';

const execAsync = promisify(exec);
const rootDir = process.cwd();

// Simple logger for pre-compilation steps (before dist/ is available)
// After TypeScript compilation, we'll use the compiled logger utility
const preCompileLogger = {
  info: (module: string, message: string): void => {
    console.log(`[${module}] ${message}`);
  },
  warn: (module: string, message: string): void => {
    console.warn(`[${module}] ⚠ ${message}`);
  },
  error: (module: string, message: string): void => {
    console.error(`[${module}] ❌ ${message}`);
  },
};

// Simple error formatter for pre-compilation steps
// After TypeScript compilation, we'll use the compiled error-utils
function formatErrorPreCompile(error: Error, context: string): string {
  const isDev = process.env.NODE_ENV === 'development';
  const stack = isDev && error.stack ? `\nStack: ${error.stack}` : '';
  return `${context}: ${error.message}${stack}`;
}

// Build step timing
interface BuildStep {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
}

const buildSteps: BuildStep[] = [];

/**
 * Gets the version from package.json
 */
function getVersion(): string {
  try {
    const packageJson = JSON.parse(readFileSync(path.join(rootDir, 'package.json'), 'utf8')) as {
      version?: string;
    };
    return packageJson.version || 'unknown';
  } catch {
    return 'unknown';
  }
}

/**
 * Times a build step
 */
function startStep(name: string): number {
  const startTime = Date.now();
  buildSteps.push({ name, startTime });
  return startTime;
}

function endStep(stepIndex: number): void {
  const step = buildSteps[stepIndex];
  if (step) {
    step.endTime = Date.now();
    step.duration = step.endTime - step.startTime;
  }
}

/**
 * Prints build time breakdown
 */
function printBuildBreakdown(): void {
  console.log('\nBuild time breakdown:');
  buildSteps.forEach((step, index) => {
    if (step.duration !== undefined) {
      const seconds = (step.duration / 1000).toFixed(2);
      console.log(`  ${index + 1}. ${step.name}: ${seconds}s`);
    }
  });
}

/**
 * Checks if config file exists and creates it from example if missing.
 */
async function ensureConfigExists(): Promise<void> {
  const configPath = path.join(rootDir, 'scripts', 'config.ts');
  const exampleConfigPath = path.join(rootDir, 'scripts', 'example.config.ts');

  if (!existsSync(configPath)) {
    if (existsSync(exampleConfigPath)) {
      preCompileLogger.info('build.ts', '📝 Config file not found. Creating from example...');
      await fs.copyFile(exampleConfigPath, configPath);
      preCompileLogger.info('build.ts', '✓ Created scripts/config.ts');
      preCompileLogger.warn(
        'build.ts',
        '⚠️  Please edit scripts/config.ts with your settings and run build again.',
      );
      process.exit(0);
    } else {
      throw new Error(
        'Config file (scripts/config.ts) not found and example config (scripts/example.config.ts) is missing.',
      );
    }
  }
}

void (async (): Promise<void> => {
  try {
    // Handle command line arguments
    const args = process.argv.slice(2);

    if (args.includes('--version') || args.includes('-v')) {
      console.log(getVersion());
      process.exit(0);
    }

    // Check and create config if missing (before TypeScript compilation)
    await ensureConfigExists();

    const isDryRun = args.includes('--dry-run');
    const isIncremental = args.includes('--incremental');
    // Dry runs should not delete or write build outputs.
    const shouldClean = !isDryRun && (!isIncremental || args.includes('--clean'));

    if (isDryRun) {
      preCompileLogger.info(
        'build.ts',
        'Dry run: compiling + validating config — TypeScript will emit to dist/ but final outputs (e.g. public/) will NOT be generated',
      );
    }

    const overallStartTime = Date.now();

    // Remove the public directory (unless incremental build)
    const publicDir = path.join(rootDir, 'public');
    if (shouldClean) {
      const stepIndex = buildSteps.length;
      startStep('Clean directories');
      await fs.rm(publicDir, { recursive: true, force: true });
      const tempDir = path.join(rootDir, '.build');
      await fs.rm(tempDir, { recursive: true, force: true });
      endStep(stepIndex);
    } else {
      if (isDryRun) {
        preCompileLogger.info('build.ts', 'Dry run: skipping clean...');
      } else {
        preCompileLogger.info('build.ts', 'Using incremental build (skipping clean)...');
      }
    }

    // Compile TypeScript first (with incremental compilation)
    // This build orchestrator runs from `dist/build.js` (after `tsc`).
    // Do not invoke a second TypeScript compilation here.
    const distDir = path.join(rootDir, 'dist');
    if (!existsSync(distDir)) {
      console.error('Error: dist/ directory not found.');
      console.error('Please run `tsc` before running this script.');
      process.exit(1);
    }

    const loggerPath = path.join(rootDir, 'dist', 'scripts', 'utils', 'logger.js');
    const errorUtilsPath = path.join(rootDir, 'dist', 'scripts', 'utils', 'error-utils.js');

    if (!existsSync(loggerPath)) {
      console.error(`Error: logger module not found at ${loggerPath}`);
      console.error('Please run `tsc` before running this script.');
      process.exit(1);
    }

    if (!existsSync(errorUtilsPath)) {
      console.error(`Error: error-utils module not found at ${errorUtilsPath}`);
      console.error('Please run `tsc` before running this script.');
      process.exit(1);
    }

    const loggerModule = (await import(pathToFileURL(loggerPath).href)) as {
      logger: {
        info: (module: string, message: string) => void;
        warn: (module: string, message: string) => void;
        error: (module: string, message: string) => void;
      };
    };
    const errorUtilsModule = (await import(pathToFileURL(errorUtilsPath).href)) as {
      formatError: (error: Error, context: string) => string;
    };
    const logger = loggerModule.logger;
    const formatError = errorUtilsModule.formatError;

    // Validate configuration after compilation (runs from dist/)
    const validateStepIndex = buildSteps.length;
    startStep('Configuration validation');
    const validateConfigPath = path.join(rootDir, 'dist', 'scripts', 'validate-config.js');
    const validateConfigModule = (await import(pathToFileURL(validateConfigPath).href)) as {
      validateConfig: () => void;
    };
    validateConfigModule.validateConfig();
    endStep(validateStepIndex);

    if (isDryRun) {
      logger.info('build.ts', '✓ Dry run complete (no outputs generated)');
      printBuildBreakdown();
      process.exit(0);
    }

    // Generate dynamic imports
    logger.info('build.ts', 'Generating dynamic imports...');
    const importsStepIndex = buildSteps.length;
    startStep('Generate imports');
    try {
      await execAsync('node dist/scripts/generate-imports.js');
      endStep(importsStepIndex);
    } catch (error) {
      endStep(importsStepIndex);
      const err = error as Error;
      throw new Error(formatError(err, 'generate-imports.js failed'));
    }

    // Bundle website code using Webpack
    logger.info('build.ts', 'Bundling website code using Webpack...');
    const webpackStepIndex = buildSteps.length;
    startStep('Webpack bundling');
    try {
      await execAsync('npx webpack --config webpack.config.js');
      endStep(webpackStepIndex);
    } catch (error) {
      endStep(webpackStepIndex);
      const err = error as Error;
      throw new Error(formatError(err, 'Webpack failed'));
    }

    // Copy necessary assets to the public directory
    const assetsStepIndex = buildSteps.length;
    startStep('Copy assets');
    const assetsSrc = path.join(rootDir, 'src', 'assets');
    const assetsDest = path.join(rootDir, 'public', 'assets');
    try {
      await fs.access(assetsSrc);
      await copyDirectory(assetsSrc, assetsDest);
      endStep(assetsStepIndex);
    } catch (error) {
      endStep(assetsStepIndex);
      const err = error as NodeJS.ErrnoException;
      if (err.code === 'ENOENT') {
        logger.warn('build.ts', 'Assets directory not found, skipping asset copy.');
      } else {
        throw new Error(formatError(err, 'Asset copy failed'));
      }
    }

    // Run the generation scripts to generate the output files
    logger.info('build.ts', 'Running the generation scripts...');
    const generateStepIndex = buildSteps.length;
    startStep('Generate HTML content');
    try {
      await execAsync('node dist/scripts/generate.js');
      endStep(generateStepIndex);
    } catch (error) {
      endStep(generateStepIndex);
      const err = error as Error;
      throw new Error(formatError(err, 'generate.js failed'));
    }

    // Process Tailwind CSS using PostCSS
    logger.info('build.ts', 'Processing Tailwind CSS...');
    const cssStepIndex = buildSteps.length;
    startStep('Process CSS');
    try {
      await execAsync('node dist/scripts/build-css.js');
      endStep(cssStepIndex);
    } catch (error) {
      endStep(cssStepIndex);
      const err = error as Error;
      throw new Error(formatError(err, 'build-css.js failed'));
    }

    // Copy root index.html and fix paths
    const indexStepIndex = buildSteps.length;
    startStep('Copy root index');
    const pagesIndexPath = path.join(publicDir, 'pages', 'index.html');
    const rootIndexPath = path.join(publicDir, 'index.html');
    try {
      const indexContent = await fs.readFile(pagesIndexPath, 'utf8');
      // Fix paths: replace /pages/ with / for root
      // This handles all path references (href, src, action, etc.)
      const fixedContent = indexContent.replace(/\/pages\//g, '/');
      await fs.writeFile(rootIndexPath, fixedContent);
      logger.info('build.ts', 'Created root index.html');
      endStep(indexStepIndex);
    } catch {
      endStep(indexStepIndex);
      // Ignore if pages/index.html doesn't exist (not all sites have a root page)
      if (process.env.NODE_ENV === 'development') {
        logger.info('build.ts', 'No pages/index.html found, skipping root index creation');
      }
    }

    // Verify critical build outputs and count files
    const verifyStepIndex = buildSteps.length;
    startStep('Verify outputs');
    const criticalFiles = [
      path.join(publicDir, 'styles', 'styles.css'),
      path.join(publicDir, 'js', 'bundle.js'),
    ];

    const missingFiles: string[] = [];
    for (const file of criticalFiles) {
      try {
        await fs.access(file);
      } catch {
        missingFiles.push(path.relative(rootDir, file));
      }
    }

    // Count generated files
    let fileCount = 0;
    let htmlCount = 0;
    try {
      // Check if directory exists before counting
      await fs.access(publicDir);
      const countFiles = async (dir: string): Promise<void> => {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          if (entry.isDirectory()) {
            await countFiles(fullPath);
          } else if (entry.isFile()) {
            fileCount++;
            if (entry.name.endsWith('.html')) {
              htmlCount++;
            }
          }
        }
      };
      await countFiles(publicDir);
    } catch {
      // Ignore counting errors (directory might not exist in incremental builds)
    }

    endStep(verifyStepIndex);

    if (missingFiles.length > 0) {
      logger.warn('build.ts', 'Some expected files were not generated:');
      missingFiles.forEach((file) => logger.warn('build.ts', `  - ${file}`));
    }

    const overallEndTime = Date.now();
    const overallBuildTimeMs = overallEndTime - overallStartTime;
    const overallBuildTimeSec = Math.floor(overallBuildTimeMs / 1000);
    const remainingMs = overallBuildTimeMs % 1000;

    console.log('\n' + '='.repeat(50));
    console.log(`Build complete. Generated files are in the 'public' directory.`);
    console.log(`Total build time: ${overallBuildTimeSec}s ${remainingMs}ms`);
    if (fileCount > 0) {
      console.log(
        `Generated ${fileCount} file${fileCount !== 1 ? 's' : ''} (${htmlCount} HTML page${htmlCount !== 1 ? 's' : ''})`,
      );
    }
    printBuildBreakdown();
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    // Try to use compiled error formatter, fallback to pre-compile version
    let errorMessage: string;
    try {
      const errorUtilsPath = path.join(rootDir, 'dist', 'scripts', 'utils', 'error-utils.js');
      const errorUtilsModule = (await import(pathToFileURL(errorUtilsPath).href)) as {
        formatError: (error: Error, context: string) => string;
      };
      errorMessage = errorUtilsModule.formatError(err, 'Build process');
    } catch {
      errorMessage = formatErrorPreCompile(err, 'Build process');
    }
    console.error('\n❌ Error during build process:');
    console.error(errorMessage);
    process.exit(1);
  }
})();

/**
 * Recursively copies a directory and its contents.
 * @param src - The source directory path.
 * @param dest - The destination directory path.
 * @throws {Error} If copying fails.
 */
async function copyDirectory(src: string, dest: string): Promise<void> {
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
    const err = error as Error;
    throw new Error(`Error copying directory from ${src} to ${dest}: ${err.message}`);
  }
}
