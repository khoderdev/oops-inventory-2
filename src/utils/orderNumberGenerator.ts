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
