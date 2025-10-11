/**
 * Fetches the next sequential order number from backend API
 * This ensures consistency across all order types
 * Format: ORD-XXXX (e.g., ORD-0001, ORD-0002, etc.)
 */
export const fetchNextOrderNumber = async (): Promise<string> => {
  try {
    const token = localStorage.getItem("token");
    const response = await fetch("/api/tables/next-order-number", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log("✅ Fetched next order number from backend:", data.orderNumber);
    return data.orderNumber;
  } catch (error) {
    console.error("❌ Error fetching order number from backend:", error);
    // Return placeholder that will be replaced by backend during order creation
    return "ORD-XXXX";
  }
};
