import React from 'react';
import { POSItem } from '../types/inventory';

/**
 * This is a simple test script to verify that different variants of the same beverage item
 * are treated as separate cart items in the POS system.
 * 
 * To use this test:
 * 1. Open the browser console in development mode
 * 2. Add different variants of the same beverage item to the cart
 * 3. Check the console logs to verify that each variant is added as a separate cart item
 */

// Mock beverage item with variants
const mockBeverageItem: POSItem = {
  id: "test-beverage-1",
  type: "menu_item",
  name: "Test Beverage",
  price: 5.00,
  category: "beverages",
  unit: "cl",
  availableQuantity: 100,
  costPerUnit: 2.00,
  menuItemId: "123",
  variants: [
    {
      id: "1",
      name: "Small",
      volume: 25,
      unit: "cl",
      price: 5.00
    },
    {
      id: "2",
      name: "Medium",
      volume: 33,
      unit: "cl",
      price: 7.00
    },
    {
      id: "3",
      name: "Large",
      volume: 50,
      unit: "cl",
      price: 9.00
    }
  ]
};

// Test function to simulate adding different variants to cart
export function testVariantCartAddition() {
  console.log("=== VARIANT CART ADDITION TEST ===");
  
  // Create a mock addToCart function similar to the one in POSClient.tsx
  const addToCart = (posItem: POSItem) => {
    // Generate cart ID based on item and variant
    let cartId = `pos-${posItem.id}`;
    
    if (posItem.selectedVariant) {
      const variant = posItem.selectedVariant;
      cartId = `pos-${posItem.id}-variant-${variant.name}-${variant.volume}${variant.unit}`;
      console.log(`Adding item with variant: ${variant.name} (${variant.volume}${variant.unit})`);
      console.log(`Generated cart ID: ${cartId}`);
    } else {
      console.log(`Adding item without variant`);
      console.log(`Generated cart ID: ${cartId}`);
    }
    
    return cartId;
  };
  
  // Test adding the same item with different variants
  const smallVariant = {
    ...mockBeverageItem,
    selectedVariant: mockBeverageItem.variants?.[0],
    displayName: `${mockBeverageItem.name} (Small - 25cl)`,
    price: 5.00
  };
  
  const mediumVariant = {
    ...mockBeverageItem,
    selectedVariant: mockBeverageItem.variants?.[1],
    displayName: `${mockBeverageItem.name} (Medium - 33cl)`,
    price: 7.00
  };
  
  const largeVariant = {
    ...mockBeverageItem,
    selectedVariant: mockBeverageItem.variants?.[2],
    displayName: `${mockBeverageItem.name} (Large - 50cl)`,
    price: 9.00
  };
  
  // Add each variant to the cart
  const smallCartId = addToCart(smallVariant);
  const mediumCartId = addToCart(mediumVariant);
  const largeCartId = addToCart(largeVariant);
  
  // Verify that each variant gets a unique cart ID
  console.log("\n=== TEST RESULTS ===");
  console.log("Small variant cart ID:", smallCartId);
  console.log("Medium variant cart ID:", mediumCartId);
  console.log("Large variant cart ID:", largeCartId);
  
  const allUnique = smallCartId !== mediumCartId && 
                   mediumCartId !== largeCartId && 
                   smallCartId !== largeCartId;
                   
  console.log("\nAll cart IDs unique:", allUnique ? "✅ PASS" : "❌ FAIL");
  
  return {
    smallCartId,
    mediumCartId,
    largeCartId,
    allUnique
  };
}

// Export a function to run the test from the browser console
(window as any).runVariantCartTest = testVariantCartAddition;

console.log("Variant cart test loaded. Run window.runVariantCartTest() in the console to test.");

export default testVariantCartAddition;
