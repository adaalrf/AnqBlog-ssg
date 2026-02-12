#!/usr/bin/env node
import fs from 'fs/promises';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { existsSync } from 'fs';
import { pathToFileURL } from 'url';

const execAsync = promisify(exec);
const rootDir = process.cwd();

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

function formatErrorPreCompile(error: Error, context: string): string {
  const isDev = process.env.NODE_ENV === 'development';
  const stack = isDev && error.stack ? `\nStack: ${error.stack}` : '';
  return `${context}: ${error.message}${stack}`;
}

interface BuildStep {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
}

const buildSteps: BuildStep[] = [];

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

async function withTimedStep<T>(stepName: string, fn: () => Promise<T>): Promise<T> {
  const stepIndex = buildSteps.length;
  startStep(stepName);
  try {
    return await fn();
  } finally {
    endStep(stepIndex);
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
  const configPath = path.join(rootDir, 'core', 'config', 'config.ts');
  const exampleConfigPath = path.join(rootDir, 'core', 'config', 'example.config.ts');

  if (!existsSync(configPath)) {
    if (existsSync(exampleConfigPath)) {
      preCompileLogger.info('build.ts', '📝 Config file not found. Creating from example...');
      await fs.copyFile(exampleConfigPath, configPath);
      preCompileLogger.info('build.ts', '✓ Created core/config/config.ts');
      preCompileLogger.warn(
        'build.ts',
        '⚠️  Please edit core/config/config.ts with your settings and run build again.',
      );
      process.exit(0);
    } else {
      throw new Error(
        'Config file (core/config/config.ts) not found and example config (core/config/example.config.ts) is missing.',
      );
    }
  }
}

/**
 * Ensures a dist output path exists before importing/running compiled code.
 */
function requireDistPath(distPath: string, label: string): void {
  if (!existsSync(distPath)) {
    console.error(`Error: ${label} not found at ${distPath}`);
    console.error('Please run `tsc` before running this script.');
    process.exit(1);
  }
}

/**
 * Loads runtime logger + error formatter from compiled dist output.
 */
async function loadRuntimeUtils(): Promise<{
  logger: typeof preCompileLogger;
  formatError: (error: Error, context: string) => string;
}> {
  const loggerPath = path.join(rootDir, 'dist', 'core', 'shared', 'logger.js');
  const errorUtilsPath = path.join(rootDir, 'dist', 'core', 'internal', 'error-utils.js');

  requireDistPath(loggerPath, 'logger module');
  requireDistPath(errorUtilsPath, 'error-utils module');

  const loggerModule = (await import(pathToFileURL(loggerPath).href)) as {
    logger: typeof preCompileLogger;
  };
  const errorUtilsModule = (await import(pathToFileURL(errorUtilsPath).href)) as {
    formatError: (error: Error, context: string) => string;
  };

  return {
    logger: loggerModule.logger,
    formatError: errorUtilsModule.formatError,
  };
}

/**
 * Runs a shell command as a timed build step with standardized error wrapping.
 */
async function runCommandStep(
  stepName: string,
  command: string,
  failContext: string,
  formatError: (error: Error, context: string) => string,
): Promise<void> {
  try {
    await withTimedStep(stepName, async () => {
      await execAsync(command);
    });
  } catch (error) {
    const err = error as Error;
    throw new Error(formatError(err, failContext));
  }
}

void (async (): Promise<void> => {
  try {
    const args = process.argv.slice(2);
    if (args.length > 0) {
      throw new Error(`Unexpected build arguments: ${args.join(' ')}. Run build with no flags.`);
    }

    await ensureConfigExists();

    const overallStartTime = Date.now();

    const publicDir = path.join(rootDir, 'public');
    await withTimedStep('Clean directories', async () => {
      await fs.rm(publicDir, { recursive: true, force: true });
      const tempDir = path.join(rootDir, '.build');
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    const distDir = path.join(rootDir, 'dist');
    requireDistPath(distDir, 'dist directory');
    const { logger, formatError } = await loadRuntimeUtils();

    await withTimedStep('Configuration validation', async () => {
      const validateConfigPath = path.join(rootDir, 'dist', 'core', 'config', 'validate-config.js');
      const validateConfigModule = (await import(pathToFileURL(validateConfigPath).href)) as {
        validateConfig: () => void;
      };
      validateConfigModule.validateConfig();
    });

    logger.info('build.ts', 'Generating dynamic imports...');
    await runCommandStep(
      'Generate imports',
      'node dist/core/pipeline/generate-imports.js',
      'generate-imports.js failed',
      formatError,
    );

    logger.info('build.ts', 'Bundling website code using Webpack...');
    await runCommandStep(
      'Webpack bundling',
      'npx webpack --config webpack.config.js',
      'Webpack failed',
      formatError,
    );

    const assetsSrc = path.join(rootDir, 'assets');
    const assetsDest = path.join(rootDir, 'public', 'assets');
    await withTimedStep('Copy assets', async () => {
      try {
        await fs.access(assetsSrc);
        await copyDirectory(assetsSrc, assetsDest);
      } catch (error) {
        const err = error as NodeJS.ErrnoException;
        if (err.code === 'ENOENT') {
          logger.warn('build.ts', 'Assets directory not found, skipping asset copy.');
          return;
        }
        throw new Error(formatError(err, 'Asset copy failed'));
      }
    });

    logger.info('build.ts', 'Running the generation scripts...');
    await runCommandStep(
      'Generate HTML content',
      'node dist/core/pipeline/generate.js',
      'generate.js failed',
      formatError,
    );

    logger.info('build.ts', 'Processing Tailwind CSS...');
    await runCommandStep(
      'Process CSS',
      'node dist/core/pipeline/build-css.js',
      'build-css.js failed',
      formatError,
    );

    const pagesIndexPath = path.join(publicDir, 'pages', 'index.html');
    const rootIndexPath = path.join(publicDir, 'index.html');
    await withTimedStep('Copy root index', async () => {
      try {
        const indexContent = await fs.readFile(pagesIndexPath, 'utf8');
        const fixedContent = indexContent.replace(/\/pages\//g, '/');
        await fs.writeFile(rootIndexPath, fixedContent);
        logger.info('build.ts', 'Created root index.html');
      } catch {
        if (process.env.NODE_ENV === 'development') {
          logger.info('build.ts', 'No pages/index.html found, skipping root index creation');
        }
      }
    });

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

    let fileCount = 0;
    let htmlCount = 0;
    await withTimedStep('Verify outputs', async () => {
      try {
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
        // Ignore counting errors if output directory is missing.
      }
    });

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
    let errorMessage: string;
    try {
      const errorUtilsPath = path.join(rootDir, 'dist', 'core', 'internal', 'error-utils.js');
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
