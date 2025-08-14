import { Order } from "../models/index.js";
import { Op } from "sequelize";

/**
 * Generates a sequential order number in ORD-XXXX format
 * This ensures consistency between frontend and backend
 * Format: ORD-0814, ORD-0815, etc.
 */
export const generateSequentialOrderNumber = async () => {
  try {
    // Find all orders with ORD-XXXX pattern and get the highest number
    const orders = await Order.findAll({
      where: {
        orderNumber: {
          [Op.like]: 'ORD-%'
        }
      },
      attributes: ['orderNumber'],
      raw: true
    });

    let maxNumber = 0;

    // Extract numeric parts and find the maximum
    for (const order of orders) {
      const match = order.orderNumber.match(/^ORD-(\d+)$/);
      if (match) {
        const number = parseInt(match[1], 10);
        if (number > maxNumber) {
          maxNumber = number;
        }
      }
    }

    // If no valid orders found, start with current date-based number
    if (maxNumber === 0) {
      const now = new Date();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      maxNumber = parseInt(`${month}${day}`, 10);
    }

    const nextNumber = maxNumber + 1;

    // Format as ORD-XXXX with zero padding
    const orderNumber = `ORD-${String(nextNumber).padStart(4, '0')}`;
    
    console.log(`Generated sequential order number: ${orderNumber}`);
    return orderNumber;

  } catch (error) {
    console.error('Error generating sequential order number:', error);
    
    // Fallback to timestamp-based generation
    const timestamp = Date.now().toString().slice(-4);
    const fallbackNumber = `ORD-${timestamp}`;
    console.log(`Using fallback order number: ${fallbackNumber}`);
    return fallbackNumber;
  }
};

/**
 * Validates if an order number follows the ORD-XXXX format
 */
export const isValidOrderNumber = (orderNumber) => {
  return /^ORD-\d{4}$/.test(orderNumber);
};

/**
 * Gets the next available order number without saving it
 * Useful for previews
 */
export const getNextOrderNumber = async () => {
  return await generateSequentialOrderNumber();
};
