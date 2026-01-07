import config from '../config.js';
import type { Config } from '../types/config.js';

/**
 * Parses a date string in either ISO 8601 format (YYYY-MM-DD) or DD.MM.YYYY format into a Date object.
 * @param dateString - The date string to parse.
 * @returns The parsed Date object.
 * @throws {Error} If the date string is invalid or in wrong format.
 */
export const parseDate = (dateString: string): Date => {
  if (!dateString || typeof dateString !== 'string') {
    throw new Error('Date string must be a non-empty string');
  }

  // Try ISO 8601 format first (YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss)
  const isoDate = new Date(dateString);
  if (!isNaN(isoDate.getTime())) {
    // Check if it's a valid ISO date format (YYYY-MM-DD)
    const isoMatch = dateString.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (isoMatch) {
      const [, year, month, day] = isoMatch.map(Number);
      const date = new Date(year, month - 1, day);
      // Validate the date is actually valid
      if (date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day) {
        return date;
      }
    }
  }

  // Fall back to DD.MM.YYYY format
  const parts = dateString.split('.');
  if (parts.length !== 3) {
    throw new Error(
      `Invalid date format. Expected DD.MM.YYYY or YYYY-MM-DD (ISO 8601), got: ${dateString}`,
    );
  }

  const [day, month, year] = parts.map(Number);

  // Validate numbers
  if (
    isNaN(day) ||
    isNaN(month) ||
    isNaN(year) ||
    day < 1 ||
    day > 31 ||
    month < 1 ||
    month > 12 ||
    year < 1000 ||
    year > 9999
  ) {
    throw new Error(`Invalid date values: ${dateString}`);
  }

  const date = new Date(year, month - 1, day);

  // Validate the date is actually valid (catches cases like 32.13.2026)
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    throw new Error(`Invalid date: ${dateString}`);
  }

  return date;
};

/**
 * Formats a Date object into a human-readable string.
 * Uses the locale from config if available, otherwise defaults to 'en-US'.
 * @param date - The date object to format.
 * @returns The formatted date string.
 * @throws {Error} If the date object is invalid.
 */
export const formatDate = (date: Date): string => {
  if (!(date instanceof Date)) {
    throw new Error('Invalid date object');
  }

  // Get locale from config, defaulting to 'en-US' if not available
  const locale = (config as Config).dateLocale || 'en-US';

  const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' };
  return date.toLocaleDateString(locale, options);
};

/**
 * Formats a Date object into an ISO 8601 date string (YYYY-MM-DD).
 * @param date - The date object to format.
 * @returns The ISO 8601 formatted date string.
 * @throws {Error} If the date object is invalid.
 */
export const formatDateISO = (date: Date): string => {
  if (!(date instanceof Date)) {
    throw new Error('Invalid date object');
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};
