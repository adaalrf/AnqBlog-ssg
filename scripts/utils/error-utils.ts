/**
 * Error handling utilities for consistent error formatting and reporting.
 */

/**
 * Formats an error with optional context and stack trace (in development mode).
 * @param error - The error object.
 * @param context - Additional context about where the error occurred.
 * @returns Formatted error message.
 */
export function formatError(error: Error, context: string): string {
  const isDev = process.env.NODE_ENV === 'development';
  const stack = isDev && error.stack ? `\nStack: ${error.stack}` : '';
  return `${context}: ${error.message}${stack}`;
}
