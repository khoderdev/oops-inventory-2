/**
 * Utility functions for consistent number formatting throughout the application
 */

/**
 * Formats a number with consistent decimal places
 * @param value - The number to format
 * @param minDecimals - Minimum decimal places (default: 2)
 * @param maxDecimals - Maximum decimal places (default: 2)
 * @returns Formatted number string
 */
export const formatNumber = (
  value: number | string | undefined | null,
  minDecimals: number = 2,
  maxDecimals: number = 2
): string => {
  if (value === undefined || value === null || value === "") return "";
  
  const num = typeof value === "string" ? parseFloat(value) : value;
  
  if (isNaN(num) || !isFinite(num)) return "";
  
  return num.toLocaleString(undefined, {
    minimumFractionDigits: minDecimals,
    maximumFractionDigits: maxDecimals
  });
};

/**
 * Formats a currency value with consistent decimal places
 * @param value - The currency value to format
 * @param minDecimals - Minimum decimal places (default: 2)
 * @param maxDecimals - Maximum decimal places (default: 2)
 * @returns Formatted currency string with $ prefix
 */
export const formatCurrency = (
  value: number | string | undefined | null,
  minDecimals: number = 2,
  maxDecimals: number = 2
): string => {
  const formatted = formatNumber(value, minDecimals, maxDecimals);
  return formatted ? `$${formatted}` : "";
};
