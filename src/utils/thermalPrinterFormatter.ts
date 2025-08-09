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

export const formatItemsForPrinter = ({ items, currentOrder, orderType, selectedTable, selectedEmployee, generatePreviewOrderNumber }: FormatItemsForPrinterParams): string => {
  const now = new Date();
  const date = now.toLocaleDateString("en-US", {
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

  // Center text helper function
  const centerText = (text: string, width: number = 48) => {
    const padding = Math.max(0, Math.floor((width - text.length) / 2));
    return " ".repeat(padding) + text;
  };

  // Function to handle Arabic text encoding for thermal printers
  const handleArabicText = (text: string): string => {
    // Only remove specific problematic Chinese/Unicode characters
    // Keep normal ASCII and Arabic characters intact
    if (!text) return text;
    
    // Only remove if the text contains actual Chinese characters mixed with other text
    // This is more conservative to avoid corrupting normal English text
    return text
      .replace(/[\u4e00-\u9fff]+/g, '') // Remove Chinese character sequences only
      .replace(/[\u3400-\u4dbf]+/g, '') // Remove CJK Extension A sequences only
      .trim();
  };

  // Header with centered alignment - no top padding
  content += centerText(`${stationName} STATION`) + "\n";

  // Order information - left aligned
  content += `Order #: ${orderNumber}\n`;
  content += `Date: ${date}\n`;
  content += `Time: ${time}\n`;
  content += `Type: ${orderType.toUpperCase()}\n`;
  if (selectedTable) {
    content += `Table: ${selectedTable.number}\n`;
  }
  if (selectedEmployee) {
    const employeeName = `${selectedEmployee.user?.firstName || ''} ${selectedEmployee.user?.lastName || ''}`.trim();
    content += `Staff: ${employeeName}\n`;
  }
  content += centerText("ORDER ITEMS") + "\n";

  // Items - simplified for kitchen/station (only name and quantity)
  // Using ESC/POS bold commands for thermal printers
  items.forEach((item, index) => {
    // Handle Arabic text and truncate if too long
    const cleanItemName = handleArabicText(item.name);
    const itemName = cleanItemName.length > 40 ? cleanItemName.substring(0, 37) + "..." : cleanItemName;

    // Bold text using ESC/POS commands: ESC E (bold on), ESC F (bold off)
    content += "\x1B\x45"; // ESC E - Bold ON
    content += centerText(`${item.quantity}x ${itemName}`) + "\n";
    content += "\x1B\x46"; // ESC F - Bold OFF

    // Add item notes for kitchen/station preparation instructions
    if (item.notes && item.notes.trim()) {
      const cleanNotes = handleArabicText(item.notes.trim());
      // Format notes with indentation and italic style
      content += "\x1B\x34"; // ESC 4 - Italic ON (if supported)
      content += `   Note: ${cleanNotes}` + "\n";
      content += "\x1B\x35"; // ESC 5 - Italic OFF (if supported)
    }

    // Add spacing between items (except last item)
    if (index < items.length - 1) {
      content += "\n";
    }
  });

  content += "\n";

  // Only show item count - no monetary totals for kitchen
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  content += centerText(`Total Items: ${itemCount}`) + "\n";
  content += "\n";
  content += "\n";
  content += "\n";
  content += "\n";
  content += "\n";
  content += "\n";
  // content += "\n";
  // content += "\n";

  // Add thermal printer paper cut command (ESC/POS)
  content += "\x1B\x69"; // ESC i - Full cut command

  return content;
};

/**
 * Center text helper function for thermal printer formatting
 */
export const centerText = (text: string, width: number = 48): string => {
  const padding = Math.max(0, Math.floor((width - text.length) / 2));
  return " ".repeat(padding) + text;
};
