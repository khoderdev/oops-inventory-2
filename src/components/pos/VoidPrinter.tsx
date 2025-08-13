import { useCallback } from "react";
import { printerAPI } from "@/api/printers.api";
import { POSCartItem } from "@/types/inventory";
import { formatCurrency } from "@/utils/conversionLogic";

interface VoidPrinterProps {
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
}

interface VoidReceiptContext {
  currentOrder?: {
    id?: string | number;
    orderNumber?: string;
  };
  selectedTable?: {
    number?: number;
  };
}

export const useVoidPrinter = ({ showSuccess, showError }: VoidPrinterProps) => {
  const printVoidReceiptsForRemovedItems = useCallback(
    async (removedItems: POSCartItem[], context?: VoidReceiptContext) => {
      if (removedItems.length === 0) return;

      console.log("🗑️🖨️ Printing void receipts for removed items:", { itemCount: removedItems.length });
      try {
        const itemsByPrinter = new Map<number, POSCartItem[]>();
        removedItems.forEach(item => {
          const printerId = item.printerId || item.assignedPrinter?.id;
          if (printerId) {
            if (!itemsByPrinter.has(printerId)) {
              itemsByPrinter.set(printerId, []);
            }
            itemsByPrinter.get(printerId)!.push(item);
          }
        });

        console.log("🗑️🖨️ Void items grouped by printer:", { printerCount: itemsByPrinter.size });
        const printPromises = Array.from(itemsByPrinter.entries()).map(async ([printerId, items]) => {
          try {
            // Format void receipt content
            const voidContent = `
            ========== VOID RECEIPT ==========
            DATE: ${new Date().toLocaleString()}
            ORDER: ${context?.currentOrder?.orderNumber || context?.currentOrder?.id || "N/A"}
            TABLE: ${context?.selectedTable?.number || "N/A"}

            --- CANCELLED ITEMS ---
            ${items.map(item => `${item.name}\nQty: ${item.quantity} x ${formatCurrency(item.price)} = ${formatCurrency(item.price * item.quantity)}${item.notes ? `\nNotes: ${item.notes}` : ""}\n`).join("\n")}

            *** ITEM(S) CANCELLED ***
            *** DO NOT PREPARE ***
            ================================\n\n`;

            const printJobData = {
              printerId: printerId,
              jobType: "void" as const,
              content: {
                rawContent: voidContent,
                format: "text",
                encoding: "utf8"
              },
              priority: 2, // Higher priority for void receipts
              metadata: {
                orderType: "void_receipt",
                itemCount: items.length,
                orderId: context?.currentOrder?.id,
                orderNumber: context?.currentOrder?.orderNumber,
                timestamp: new Date().toISOString()
              }
            };

            console.log("🗑️🖨️ Creating void print job for printer:", { printerId, itemCount: items.length });
            const result = await printerAPI.createPrintJob(printJobData);
            console.log("🗑️🖨️ Void print job created:", { printerId, jobId: result.job?.id });
            return { printerId, success: true, jobId: result.job?.id };
          } catch (error) {
            console.error(`❌ Failed to print void receipt to printer ${printerId}:`, error);
            return { printerId, success: false, error };
          }
        });

        const results = await Promise.allSettled(printPromises);
        const successfulPrints = results.filter(result => result.status === "fulfilled" && result.value.success).length;
        const totalPrinters = itemsByPrinter.size;

        if (successfulPrints > 0) {
          console.log("🗑️🖨️ Void receipt print results:", { successful: successfulPrints, total: totalPrinters });
          if (successfulPrints === totalPrinters) {
            showSuccess(`🗑️ Void receipts printed to ${successfulPrints} station(s) successfully!`);
          } else {
            showSuccess(`⚠️ Void receipts printed to ${successfulPrints}/${totalPrinters} stations. Check printer status for failed prints.`);
          }
        } else if (totalPrinters > 0) {
          console.log("🗑️🖨️ All void print jobs failed");
          showError(`❌ Failed to print void receipts to assigned stations. Please notify stations manually.`);
        }
      } catch (error) {
        console.error("❌ Error in printVoidReceiptsForRemovedItems:", error);
        showError("Failed to print void receipts. Please notify stations manually about cancelled items.");
      }
    },
    [showSuccess, showError]
  );

  return {
    printVoidReceiptsForRemovedItems
  };
};

// Export types for use in other components
export type { VoidPrinterProps, VoidReceiptContext };
