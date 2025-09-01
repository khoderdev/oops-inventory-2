/**
 * Utility functions for consistent number formatting throughout the application
 */

/**
 * Formats a number with smart decimal places - shows decimals only when needed
 * @param value - The number to format
 * @param maxDecimals - Maximum decimal places (default: 2)
 * @returns Formatted number string
 */
export const formatNumber = (
  value: number | string | undefined | null,
  maxDecimals: number = 2
): string => {
  if (value === undefined || value === null || value === "") return "";
  
  const num = typeof value === "string" ? parseFloat(value) : value;
  
  if (isNaN(num) || !isFinite(num)) return "";
  
  // Check if the number is an integer
  if (Number.isInteger(num)) {
    return num.toLocaleString(undefined);
  }
  
  // For decimal numbers, show only the necessary decimal places up to maxDecimals
  const decimalStr = num.toString();
  const decimalParts = decimalStr.split('.');
  
  if (decimalParts.length === 1) {
    // No decimal part
    return num.toLocaleString(undefined);
  }
  
  // Get the actual number of decimal places in the original number
  const actualDecimals = decimalParts[1].length;
  const decimalsToShow = Math.min(actualDecimals, maxDecimals);
  
  return num.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimalsToShow
  });
};

/**
 * Formats a currency value with smart decimal places
 * @param value - The currency value to format
 * @param maxDecimals - Maximum decimal places (default: 2)
 * @returns Formatted currency string with $ prefix
 */
export const formatCurrency = (
  value: number | string | undefined | null,
  maxDecimals: number = 2
): string => {
  // For currency, we want to show at least 2 decimal places for cents
  if (value === undefined || value === null || value === "") return "";
  
  const num = typeof value === "string" ? parseFloat(value) : value;
  
  if (isNaN(num) || !isFinite(num)) return "";
  
  // For currency, we want to show exactly 2 decimal places
  return `$${num.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
};
