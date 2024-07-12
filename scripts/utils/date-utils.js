// Description: Utility functions for parsing and formatting dates.
/**
 * Parses a custom date format (DD.MM.YYYY) into a Date object.
 * @param {string} dateString - The date string to parse.
 * @returns {Date} - The parsed Date object.
 */
export const parseDate = (dateString) => {
  const [day, month, year] = dateString.split('.').map(Number);
  console.log(`date-utils1.js: `, new Date(year, month - 1, day));
  return new Date(year, month - 1, day);
};

/**
 * Formats a Date object into a human-readable string.
 * @param {Date} date - The date object to format.
 * @returns {string} - The formatted date string.
 * @throws {Error} - If the date object is invalid.
 */
export const formatDate = (date) => {
  console.log(`date-utils2.js: `, date);
  if (!(date instanceof Date)) {
    throw new Error('Invalid date object');
  }
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  return date.toLocaleDateString('en-US', options);
};
