import { Employee } from "@/types/employee";
import { POSCartItem, Table } from "@/types/inventory";
import { Order, OrderType } from "@/types/orders";
import { formatItemsForPrinterSimple } from "./thermalPrinterFormatterSimple";

interface FormatItemsForPrinterParams {
  items: POSCartItem[];
  currentOrder?: Order | null;
  orderType: OrderType;
  selectedTable?: Table | null;
  selectedEmployee?: Employee | null;
  generatePreviewOrderNumber: () => string;
}

/**
 * ESC/POS Commands for thermal printers - Database-safe version
 * Avoiding null bytes and problematic Unicode sequences
 */
const ESC_POS = {
  // Basic commands that work on most thermal printers (avoiding null bytes)
  INIT: '\x1B\x40',           // Initialize printer
  BOLD_ON: '\x1B\x45\x01',    // Bold text on
  BOLD_OFF: '\x1B\x45',       // Bold text off (avoiding \x00)
  UNDERLINE_ON: '\x1B\x2D\x01',      // Underline on
  UNDERLINE_OFF: '\x1B\x2D',         // Underline off (avoiding \x00)
  ALIGN_CENTER: '\x1B\x61\x01',      // Center alignment
  ALIGN_LEFT: '\x1B\x61',            // Left alignment (avoiding \x00)
  ALIGN_RIGHT: '\x1B\x61\x02',       // Right alignment
  
  // More compatible text sizing (avoiding null bytes)
  DOUBLE_HEIGHT_ON: '\x1B\x21\x10',  // Double height on
  DOUBLE_HEIGHT_OFF: '\x1B\x21',     // Double height off (avoiding \x00)
  LARGE_TEXT: '\x1B\x21\x30',        // Double width and height
  NORMAL_TEXT: '\x1B\x21',           // Normal text size (avoiding \x00)
  
  // Paper handling (database-safe)
  FEED_LINES: (lines: number) => '\n'.repeat(lines), // Use simple line feeds
  CUT_PAPER: '\x1D\x56\x42',         // Partial cut (removing null byte)
  
  // Fallback commands for compatibility
  EMPHASIS_ON: '\x1B\x45\x01',       // Same as BOLD_ON
  EMPHASIS_OFF: '\x1B\x45'           // Same as BOLD_OFF (avoiding \x00)
} as const;

export const formatItemsForPrinter = ({ items, currentOrder, orderType, selectedTable, selectedEmployee, generatePreviewOrderNumber }: FormatItemsForPrinterParams): string => {
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

    // Initialize printer with basic reset
    content += ESC_POS.INIT;

  // Function to create separator lines
  const createSeparator = (char: string = "=", width: number = 48): string => {
    return char.repeat(width);
  };

  // Function to handle Arabic text encoding for thermal printers
  const handleArabicText = (text: string): string => {
    if (!text) return text;
    return text
      .replace(/[\u4e00-\u9fff]+/g, '') // Remove Chinese character sequences
      .replace(/[\u3400-\u4dbf]+/g, '') // Remove CJK Extension A sequences
      .trim();
  };

  // Function to sanitize content for database storage (remove null bytes and problematic chars)
  const sanitizeForDatabase = (content: string): string => {
    return content
      .replace(/\u0000/g, '') // Remove null bytes
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Remove other control chars except \n, \r, \t
      .replace(/\\u0000/g, ''); // Remove escaped null bytes
  };

  // Function to pad text for left-right alignment
  const padLeftRight = (left: string, right: string, width: number = 48): string => {
    const totalContentLength = left.length + right.length;
    const padding = Math.max(1, width - totalContentLength);
    return left + " ".repeat(padding) + right;
  };

  // ==================== HEADER SECTION ====================
  content += ESC_POS.ALIGN_CENTER;
  content += ESC_POS.LARGE_TEXT + ESC_POS.BOLD_ON;
  content += `${stationName}\n`;
  content += "KITCHEN ORDER\n";
  content += ESC_POS.BOLD_OFF + ESC_POS.NORMAL_TEXT;
  
  content += ESC_POS.ALIGN_CENTER;
  content += createSeparator("=") + "\n";
  
  // ==================== ORDER INFO SECTION ====================
  content += ESC_POS.ALIGN_LEFT;
  content += ESC_POS.BOLD_ON + ESC_POS.DOUBLE_HEIGHT_ON;
  content += `ORDER #${orderNumber}\n`;
  content += ESC_POS.BOLD_OFF + ESC_POS.DOUBLE_HEIGHT_OFF;
  
  content += "\n";
  content += padLeftRight("Date:", date) + "\n";
  content += padLeftRight("Time:", time) + "\n";
  content += padLeftRight("Type:", orderType.toUpperCase()) + "\n";

  if (selectedTable) {
    content += ESC_POS.BOLD_ON;
    content += padLeftRight("TABLE:", `#${selectedTable.number}`) + "\n";
    content += ESC_POS.BOLD_OFF;
  }

  if (selectedEmployee) {
    const employeeName = `${selectedEmployee.user?.firstName || ''} ${selectedEmployee.user?.lastName || ''}`.trim();
    content += padLeftRight("Staff:", employeeName) + "\n";
  }

  content += "\n";
  content += ESC_POS.ALIGN_CENTER;
  content += createSeparator("-") + "\n";
  
  // ==================== ITEMS SECTION ====================
  content += ESC_POS.BOLD_ON + ESC_POS.UNDERLINE_ON;
  content += "ORDER ITEMS\n";
  content += ESC_POS.BOLD_OFF + ESC_POS.UNDERLINE_OFF;
  content += createSeparator("-") + "\n";
  
  content += ESC_POS.ALIGN_LEFT;
  
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
    content += ESC_POS.BOLD_ON + ESC_POS.DOUBLE_HEIGHT_ON;
    content += `${item.quantity}x\n`;
    content += ESC_POS.BOLD_OFF + ESC_POS.DOUBLE_HEIGHT_OFF;
    
    content += ESC_POS.BOLD_ON;
    content += `${itemName}\n`;
    content += ESC_POS.BOLD_OFF;
    
    // Add item separator (except for last item)
    if (index < consolidatedItems.length - 1) {
      content += createSeparator(".", 24) + "\n";
    }
    content += "\n";
  });

  // ==================== SUMMARY SECTION ====================
  content += ESC_POS.ALIGN_CENTER;
  content += createSeparator("=") + "\n";
  
  const totalItems = consolidatedItems.reduce((sum, item) => sum + item.quantity, 0);
  const uniqueItems = consolidatedItems.length;
  
  content += ESC_POS.BOLD_ON + ESC_POS.DOUBLE_HEIGHT_ON;
  content += `TOTAL: ${totalItems} ITEMS\n`;
  content += ESC_POS.BOLD_OFF + ESC_POS.DOUBLE_HEIGHT_OFF;
  
  content += `(${uniqueItems} unique items)\n`;
  content += "\n";
  
  // ==================== FOOTER ====================
  content += ESC_POS.ALIGN_CENTER;
  content += ESC_POS.BOLD_ON;
  content += "PREPARE WITH CARE\n";
  content += ESC_POS.BOLD_OFF;
  
  content += createSeparator("=") + "\n";
  
    // Feed extra lines for easy tearing
    content += ESC_POS.FEED_LINES(3);
    
    // Cut paper
    content += ESC_POS.CUT_PAPER;

    // Sanitize content for database storage
    return sanitizeForDatabase(content);
  } catch (error) {
    console.error('Error formatting items for printer with ESC/POS commands:', error);
    console.log('Falling back to simple text formatting...');
    
    // Fallback to simple formatter without ESC/POS commands
    try {
      return formatItemsForPrinterSimple({ items, currentOrder, orderType, selectedTable, selectedEmployee, generatePreviewOrderNumber });
    } catch (fallbackError) {
      console.error('Error with fallback formatter:', fallbackError);
      
      // Last resort: very basic format
      const orderNumber = currentOrder?.orderNumber || generatePreviewOrderNumber();
      const now = new Date();
      const time = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
      
      let basicContent = "";
      basicContent += "KITCHEN ORDER\n";
      basicContent += "================\n";
      basicContent += `Order: ${orderNumber}\n`;
      basicContent += `Time: ${time}\n`;
      basicContent += "\nITEMS:\n";
      basicContent += "--------\n";
      
      items.forEach(item => {
        const cleanName = item.name.replace(/[^\x20-\x7E]/g, ''); // Remove non-ASCII chars
        basicContent += `${item.quantity}x ${cleanName}\n`;
      });
      
      basicContent += `\nTotal: ${items.reduce((sum, item) => sum + item.quantity, 0)} items\n`;
      basicContent += "\n\n\n"; // Extra line feeds
      
      // Ensure fallback content is also database-safe
      return basicContent.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '');
    }
  }
};

/**
 * Utility functions for thermal printer formatting
 */
export const thermalPrinterUtils = {
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
      .trim();
  }
};

// Backward compatibility
export const centerText = thermalPrinterUtils.centerText;

// Export simple formatter for direct use when ESC/POS commands cause issues
export { formatItemsForPrinterSimple } from "./thermalPrinterFormatterSimple";

/**
 * Sanitize content for database storage by removing problematic characters
 * This prevents PostgreSQL errors when storing ESC/POS commands in JSON fields
 */
export const sanitizeContentForDatabase = (content: string): string => {
  if (!content) return content;
  
  return content
    // Remove null bytes and other problematic control characters
    // Keep only \n (0x0A), \r (0x0D), and \t (0x09)
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    // Remove escaped null bytes that might appear in strings
    .replace(/\\u0000/g, '')
    // Remove any remaining problematic sequences
    .replace(/\x00/g, '');
};
