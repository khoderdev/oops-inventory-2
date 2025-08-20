/**
 * Formats a number to remove unnecessary trailing zeros and decimal places
 * Examples:
 * - 8.0000 -> "8"
 * - 8.5000 -> "8.5"
 * - 8.1234 -> "8.1234"
 * - 0.0000 -> "0"
 */
export function formatCleanNumber(value: number | string, maxDecimals: number = 4): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(num)) {
    return "0";
  }
  
  // Convert to fixed decimal places first
  const fixed = num.toFixed(maxDecimals);
  
  // Remove trailing zeros and unnecessary decimal point
  return parseFloat(fixed).toString();
}

/**
 * Formats a currency value with clean number formatting
 * Examples:
 * - 8.0000 -> "$8"
 * - 8.5000 -> "$8.5"
 * - 8.12 -> "$8.12"
 * - 0.008 -> "$0.008" (when maxDecimals > 2)
 */
export function formatCleanCurrency(value: number | string, maxDecimals: number = 2): string {
  // For very small values like gram costs, we need to preserve more decimal places
  const num = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(num)) {
    return "$0";
  }
  
  // For very small values (< 0.01), ensure we show enough decimal places
  // but don't round up to 0.01 when the actual value is smaller
  if (num < 0.01 && num > 0 && maxDecimals <= 2) {
    maxDecimals = 6;
  }
  
  const cleanNumber = formatCleanNumber(value, maxDecimals);
  return `$${cleanNumber}`;
}

/**
 * Formats a cost per unit value with appropriate precision
 * For very small values (< 0.01), shows up to 6 decimal places
 * For larger values, shows up to 4 decimal places
 * Always removes trailing zeros
 */
export function formatCostPerUnit(value: number | string): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(num)) {
    return "0";
  }
  
  // For very small values, use more precision
  const maxDecimals = num < 0.01 ? 6 : 4;
  return formatCleanNumber(num, maxDecimals);
}
