/**
 * Generates a sequential order number using ORD-MMDD format
 * For now, we'll use a simple date-based approach
 */
export const generateSequentialOrderNumber = async (): Promise<string> => {
  // Simple date-based approach - use current date
  // In a real system, this would be handled by the database with auto-increment
  
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const orderNumber = `ORD-${month}${day}`;
  console.log('Generated sequential order number:', orderNumber);
  return orderNumber;
};

/**
 * Fallback generator - uses date-based format
 */
export const generateUniqueOrderNumber = (): string => {
  // Simple approach - use current date format
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const orderNumber = `ORD-${month}${day}`;
  console.log('Generated order number:', orderNumber);
  return orderNumber;
};

/**
 * Generates a preview order number for display purposes
 * This is used to show what the order number will be before saving
 * Format: ORD-MMDD (e.g., ORD-0801)
 */
export const generatePreviewOrderNumber = (): string => {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  
  // Simple format: ORD-MMDD
  const previewNumber = `ORD-${month}${day}`;
  return previewNumber;
};

/**
 * Generates a temporary order number for local display
 * This creates a unique identifier for unsaved orders
 */
export const generateTempOrderNumber = (): string => {
  const timestamp = Date.now();
  const randomSuffix = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `DRAFT-${timestamp}-${randomSuffix}`;
};
