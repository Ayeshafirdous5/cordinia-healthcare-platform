/**
 * Common Utilities Placeholder
 * Helper functions for formatting times, bed codes, and round queue calculations.
 */

/**
 * Format relative time/ETA placeholder
 * @param {number} minutes
 * @returns {string}
 */
export function formatETA(minutes) {
  if (!minutes || minutes <= 0) return 'Arriving soon';
  if (minutes < 60) return `~${minutes} mins`;
  const hrs = Math.floor(minutes / 60);
  const rem = minutes % 60;
  return `~${hrs} hr ${rem > 0 ? `${rem} min` : ''}`.trim();
}
