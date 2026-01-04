/**
 * Parses a custom date format (DD.MM.YYYY) into a Date object.
 * @param {string} dateString - The date string to parse.
 * @returns {Date} - The parsed Date object.
 * @throws {Error} - If the date string is invalid or in wrong format.
 */
export const parseDate = (dateString) => {
  if (!dateString || typeof dateString !== 'string') {
    throw new Error('Date string must be a non-empty string');
  }

  const parts = dateString.split('.');
  if (parts.length !== 3) {
    throw new Error(
      `Invalid date format. Expected DD.MM.YYYY, got: ${dateString}`,
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

  // Validate the date is actually valid (catches cases like 32.13.2024)
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    throw new Error(`Invalid date: ${dateString}`);
  }

  return date;
};

/**
 * Formats a Date object into a human-readable string.
 * @param {Date} date - The date object to format.
 * @returns {string} - The formatted date string.
 * @throws {Error} - If the date object is invalid.
 */
export const formatDate = (date) => {
  if (!(date instanceof Date)) {
    throw new Error('Invalid date object');
  }
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  return date.toLocaleDateString('en-US', options);
};
