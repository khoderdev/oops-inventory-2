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
 * ESC/POS Commands for thermal printers
 */
const ESC_POS = {
  INIT: '\x1B\x40',           // Initialize printer
  BOLD_ON: '\x1B\x45\x01',    // Bold text on
  BOLD_OFF: '\x1B\x45\x00',   // Bold text off
  DOUBLE_HEIGHT_ON: '\x1B\x21\x10',  // Double height on
  DOUBLE_HEIGHT_OFF: '\x1B\x21\x00', // Double height off
  UNDERLINE_ON: '\x1B\x2D\x01',      // Underline on
  UNDERLINE_OFF: '\x1B\x2D\x00',     // Underline off
  ALIGN_CENTER: '\x1B\x61\x01',      // Center alignment
  ALIGN_LEFT: '\x1B\x61\x00',        // Left alignment
  ALIGN_RIGHT: '\x1B\x61\x02',       // Right alignment
  CUT_PAPER: '\x1D\x56\x00',         // Full cut
  FEED_LINES: (lines: number) => '\x1B\x64' + String.fromCharCode(lines), // Feed n lines
  LARGE_TEXT: '\x1D\x21\x11',        // Double width and height
  NORMAL_TEXT: '\x1D\x21\x00'        // Normal text size
} as const;

export const formatItemsForPrinter = ({ items, currentOrder, orderType, selectedTable, selectedEmployee, generatePreviewOrderNumber }: FormatItemsForPrinterParams): string => {
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

  // Initialize printer
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

  return content;
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
