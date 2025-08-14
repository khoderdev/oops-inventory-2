/**
 * Generates a sequential order number using ORD-XXXX format
 * This now uses the backend API to ensure consistency and proper sequencing
 */
export const generateSequentialOrderNumber = async (): Promise<string> => {
  try {
    // Get next order number from backend API
    const response = await fetch('/api/tables/next-order-number', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Generated sequential order number from backend:', data.orderNumber);
    return data.orderNumber;
  } catch (error) {
    console.error('Error fetching order number from backend:', error);
    
    // Fallback to date-based approach if backend fails
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const fallbackNumber = `ORD-${month}${day}`;
    console.log('Using fallback order number:', fallbackNumber);
    return fallbackNumber;
  }
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
