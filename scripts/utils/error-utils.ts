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

/**
 * Wraps an error with additional context.
 * Useful for adding context to errors before re-throwing.
 * @param error - The original error.
 * @param context - Additional context about where the error occurred.
 * @returns A new Error with formatted message.
 */
export function wrapError(error: unknown, context: string): Error {
  if (error instanceof Error) {
    return new Error(formatError(error, context));
  }
  return new Error(`${context}: ${String(error)}`);
}

/**
 * Handles errors consistently with optional re-throwing.
 * Useful for error handling patterns where you may or may not want to throw.
 * @param error - The error to handle.
 * @param context - Context about where the error occurred.
 * @param shouldThrow - Whether to re-throw the error (default: true).
 * @returns The formatted error message if not throwing.
 */
export function handleError(error: unknown, context: string, shouldThrow: boolean = true): string {
  const errorMessage =
    error instanceof Error ? formatError(error, context) : `${context}: ${String(error)}`;

  if (shouldThrow) {
    throw new Error(errorMessage);
  }

  return errorMessage;
}
