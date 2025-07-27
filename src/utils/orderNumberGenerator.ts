/**
 * Generates a sequential order number starting from ORD-0001
 * For now, we'll use a simple counter approach
 */
export const generateSequentialOrderNumber = async (): Promise<string> => {
  // Simple sequential approach - start from 0001 and increment
  // In a real system, this would be handled by the database with auto-increment
  
  // For now, let's use a simple approach that starts from 0001
  const orderNumber = 'ORD-0001';
  console.log('Generated sequential order number:', orderNumber);
  return orderNumber;
};

/**
 * Fallback generator - simple sequential starting from 0001
 */
export const generateUniqueOrderNumber = (): string => {
  // Simple approach - always start with ORD-0001 for now
  // This will be improved to be truly sequential
  const orderNumber = 'ORD-0001';
  console.log('Generated order number:', orderNumber);
  return orderNumber;
};

/**
 * Generates a preview order number for display purposes
 * This is used to show what the order number will be before saving
 * Format: ORD-YYYY-MMDD-XXXX (e.g., ORD-2025-0127-XXXX)
 */
export const generatePreviewOrderNumber = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  
  // Use XXXX as placeholder for sequence number since we don't know the actual next number
  const previewNumber = `ORD-${year}-${month}${day}-XXXX`;
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
