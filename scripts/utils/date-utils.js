// Description: Utility functions for parsing and formatting dates.
/**
 * Parses a custom date format (DD.MM.YYYY) into a Date object.
 * @param {string} dateString - The date string to parse.
 * @returns {Date} - The parsed Date object.
 */
const parseDate = (dateString) => {
  const [day, month, year] = dateString.split('.').map(Number);
  return new Date(year, month - 1, day);
};

/**
 * Formats a Date object into a human-readable string.
 * @param {Date} date - The date object to format.
 * @returns {string} - The formatted date string.
 * @throws {Error} - If the date object is invalid.
 */
const formatDate = (date) => {
  if (!(date instanceof Date)) {
    throw new Error('Invalid date object');
  }
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  return date.toLocaleDateString('en-US', options);
};

module.exports = {
  parseDate,
  formatDate,
};
