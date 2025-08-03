import { Employee } from "@/types/employee";
import { POSCartItem, Table } from "@/types/inventory";
import { Order, OrderType } from "@/types/orders";

interface FormatItemsForPrinterParams {
  items: POSCartItem[];
  currentOrder?: Order | null;
  orderType: OrderType;
  selectedTable?: Table | null;
  selectedEmployee?: Employee | null;
  generatePreviewOrderNumber: () => string;
}

/**
 * Simple thermal printer formatter without ESC/POS commands
 * This version uses plain text formatting for maximum compatibility
 */
export const formatItemsForPrinterSimple = ({ items, currentOrder, orderType, selectedTable, selectedEmployee, generatePreviewOrderNumber }: FormatItemsForPrinterParams): string => {
  try {
    const now = new Date();
    const date = now.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric"
    });
    const time = now.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true
    });
    const orderNumber = currentOrder?.orderNumber || generatePreviewOrderNumber();

    // Get printer name from the first item (all items in this group go to same printer)
    const printerName = items[0]?.assignedPrinter?.name || `Printer ${items[0]?.printerId || "Unknown"}`;
    const stationName = printerName.toUpperCase();

    // 80mm thermal receipt formatting (48 characters wide)
    let content = "";

    // Function to create separator lines
    const createSeparator = (char: string = "=", width: number = 48): string => {
      return char.repeat(width);
    };

    // Function to center text
    const centerText = (text: string, width: number = 48): string => {
      const padding = Math.max(0, Math.floor((width - text.length) / 2));
      return " ".repeat(padding) + text;
    };

    // Function to handle Arabic text encoding for thermal printers
    const handleArabicText = (text: string): string => {
      if (!text) return text;
      return text
        .replace(/[\u4e00-\u9fff]+/g, '') // Remove Chinese character sequences
        .replace(/[\u3400-\u4dbf]+/g, '') // Remove CJK Extension A sequences
        .replace(/[^\x20-\x7E\u0600-\u06FF\u0750-\u077F]/g, '') // Keep ASCII and Arabic
        .trim();
    };

    // Function to pad text for left-right alignment
    const padLeftRight = (left: string, right: string, width: number = 48): string => {
      const totalContentLength = left.length + right.length;
      const padding = Math.max(1, width - totalContentLength);
      return left + " ".repeat(padding) + right;
    };

    // ==================== HEADER SECTION ====================
    content += centerText(`*** ${stationName} ***`) + "\n";
    content += centerText("KITCHEN ORDER") + "\n";
    content += createSeparator("=") + "\n";
    
    // ==================== ORDER INFO SECTION ====================
    content += `ORDER #${orderNumber}\n`;
    content += createSeparator("-") + "\n";
    
    content += padLeftRight("Date:", date) + "\n";
    content += padLeftRight("Time:", time) + "\n";
    content += padLeftRight("Type:", orderType.toUpperCase()) + "\n";

    if (selectedTable) {
      content += padLeftRight("*** TABLE ***:", `#${selectedTable.number}`) + "\n";
    }

    if (selectedEmployee) {
      const employeeName = `${selectedEmployee.user?.firstName || ''} ${selectedEmployee.user?.lastName || ''}`.trim();
      content += padLeftRight("Staff:", employeeName) + "\n";
    }

    content += "\n";
    content += createSeparator("=") + "\n";
    
    // ==================== ITEMS SECTION ====================
    content += centerText("*** ORDER ITEMS ***") + "\n";
    content += createSeparator("=") + "\n";
    
    // Group items by name to consolidate quantities
    const groupedItems = items.reduce((acc, item) => {
      const cleanName = handleArabicText(item.name);
      const key = cleanName.toLowerCase();
      if (acc[key]) {
        acc[key].quantity += item.quantity;
      } else {
        acc[key] = { ...item, name: cleanName };
      }
      return acc;
    }, {} as Record<string, POSCartItem>);

    const consolidatedItems = Object.values(groupedItems);
    
    consolidatedItems.forEach((item, index) => {
      const itemName = item.name.length > 35 ? item.name.substring(0, 32) + "..." : item.name;
      
      // Item quantity and name with enhanced visibility
      content += `>>> ${item.quantity}x <<<\n`;
      content += `${itemName}\n`;
      
      // Add item separator (except for last item)
      if (index < consolidatedItems.length - 1) {
        content += createSeparator(".", 24) + "\n";
      }
      content += "\n";
    });

    // ==================== SUMMARY SECTION ====================
    content += createSeparator("=") + "\n";
    
    const totalItems = consolidatedItems.reduce((sum, item) => sum + item.quantity, 0);
    const uniqueItems = consolidatedItems.length;
    
    content += centerText(`*** TOTAL: ${totalItems} ITEMS ***`) + "\n";
    content += centerText(`(${uniqueItems} unique items)`) + "\n";
    content += "\n";
    
    // ==================== FOOTER ====================
    content += centerText("*** PREPARE WITH CARE ***") + "\n";
    content += createSeparator("=") + "\n";
    
    // Feed extra lines for easy tearing
    content += "\n\n\n";

    return content;
  } catch (error) {
    console.error('Error formatting items for printer (simple):', error);
    
    // Return a very basic fallback format if there's an error
    const orderNumber = currentOrder?.orderNumber || generatePreviewOrderNumber();
    const now = new Date();
    const time = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
    
    let fallbackContent = "";
    fallbackContent += "KITCHEN ORDER\n";
    fallbackContent += "================\n";
    fallbackContent += `Order: ${orderNumber}\n`;
    fallbackContent += `Time: ${time}\n`;
    fallbackContent += "\nITEMS:\n";
    fallbackContent += "--------\n";
    
    items.forEach(item => {
      const cleanName = item.name.replace(/[^\x20-\x7E]/g, ''); // Remove non-ASCII chars
      fallbackContent += `${item.quantity}x ${cleanName}\n`;
    });
    
    fallbackContent += `\nTotal: ${items.reduce((sum, item) => sum + item.quantity, 0)} items\n`;
    fallbackContent += "\n\n\n"; // Extra line feeds
    
    return fallbackContent;
  }
};

/**
 * Utility functions for simple thermal printer formatting
 */
export const simpleThermalPrinterUtils = {
  /**
   * Center text for thermal printer
   */
  centerText: (text: string, width: number = 48): string => {
    const padding = Math.max(0, Math.floor((width - text.length) / 2));
    return " ".repeat(padding) + text;
  },

  /**
   * Create separator lines
   */
  createSeparator: (char: string = "=", width: number = 48): string => {
    return char.repeat(width);
  },

  /**
   * Pad text for left-right alignment
   */
  padLeftRight: (left: string, right: string, width: number = 48): string => {
    const totalContentLength = left.length + right.length;
    const padding = Math.max(1, width - totalContentLength);
    return left + " ".repeat(padding) + right;
  },

  /**
   * Clean text for thermal printer compatibility
   */
  cleanText: (text: string): string => {
    if (!text) return text;
    return text
      .replace(/[\u4e00-\u9fff]+/g, '') // Remove Chinese character sequences
      .replace(/[\u3400-\u4dbf]+/g, '') // Remove CJK Extension A sequences
      .replace(/[^\x20-\x7E\u0600-\u06FF\u0750-\u077F]/g, '') // Keep ASCII and Arabic
      .trim();
  }
};
