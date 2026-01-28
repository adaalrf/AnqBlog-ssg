/**
 * Logging utility for consistent log formatting across the build system.
 */
class Logger {
  /**
   * Logs an info message.
   * @param module - The module name (e.g., 'Generate.ts').
   * @param message - The message to log.
   */
  info(module: string, message: string): void {
    console.log(`[${module}] ${message}`);
  }

  /**
   * Logs a warning message.
   * @param module - The module name (e.g., 'Generate.ts').
   * @param message - The message to log.
   */
  warn(module: string, message: string): void {
    console.warn(`[${module}] ⚠ ${message}`);
  }

  /**
   * Logs an error message.
   * @param module - The module name (e.g., 'Generate.ts').
   * @param message - The message to log.
   */
  error(module: string, message: string): void {
    console.error(`[${module}] ❌ ${message}`);
  }
}

/**
 * Singleton logger instance.
 */
export const logger = new Logger();
