import { OrderItem } from "@/types/orders";

const ORDER_STORAGE_KEY = "pos_current_order";
const DRAFT_ORDERS_KEY = "pos_draft_orders";
const ORDER_BACKUP_KEY = "pos_order_backup";

export interface LocalOrderData {
  orderId?: string;
  orderType: "delivery" | "takeaway" | "table" | "employees" | "bar";
  tableId?: string;
  tableNumber?: number;
  customerName?: string;
  customerPhone?: string;
  customerAddress?: string;
  items: OrderItem[];
  notes?: string;
  lastModified: number;
  autoSaveEnabled: boolean;
}

export class OrderPersistence {
  // Save current order to localStorage
  static saveCurrentOrder(orderData: LocalOrderData): void {
    try {
      const dataWithTimestamp = {
        ...orderData,
        lastModified: Date.now()
      };
      localStorage.setItem(ORDER_STORAGE_KEY, JSON.stringify(dataWithTimestamp));

      // Also create a backup
      this.createBackup(dataWithTimestamp);
    } catch (error) {
      console.error("Failed to save order to localStorage:", error);
    }
  }

  // Load current order from localStorage
  static loadCurrentOrder(): LocalOrderData | null {
    try {
      const stored = localStorage.getItem(ORDER_STORAGE_KEY);
      if (!stored) return null;

      const orderData = JSON.parse(stored) as LocalOrderData;

      // Check if order is too old (older than 24 hours)
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours
      if (Date.now() - orderData.lastModified > maxAge) {
        this.clearCurrentOrder();
        return null;
      }

      return orderData;
    } catch (error) {
      console.error("Failed to load order from localStorage:", error);
      return null;
    }
  }

  // Clear current order from localStorage
  static clearCurrentOrder(): void {
    try {
      localStorage.removeItem(ORDER_STORAGE_KEY);
    } catch (error) {
      console.error("Failed to clear order from localStorage:", error);
    }
  }

  // Save multiple draft orders
  static saveDraftOrder(orderId: string, orderData: LocalOrderData): void {
    try {
      const drafts = this.loadDraftOrders();
      drafts[orderId] = {
        ...orderData,
        lastModified: Date.now()
      };
      localStorage.setItem(DRAFT_ORDERS_KEY, JSON.stringify(drafts));
    } catch (error) {
      console.error("Failed to save draft order:", error);
    }
  }

  // Load all draft orders
  static loadDraftOrders(): Record<string, LocalOrderData> {
    try {
      const stored = localStorage.getItem(DRAFT_ORDERS_KEY);
      if (!stored) return {};

      const drafts = JSON.parse(stored) as Record<string, LocalOrderData>;

      // Clean up old drafts (older than 7 days)
      const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
      const now = Date.now();
      const cleanedDrafts: Record<string, LocalOrderData> = {};

      Object.entries(drafts).forEach(([id, draft]) => {
        if (now - draft.lastModified <= maxAge) {
          cleanedDrafts[id] = draft;
        }
      });

      // Save cleaned drafts back
      if (Object.keys(cleanedDrafts).length !== Object.keys(drafts).length) {
        localStorage.setItem(DRAFT_ORDERS_KEY, JSON.stringify(cleanedDrafts));
      }

      return cleanedDrafts;
    } catch (error) {
      console.error("Failed to load draft orders:", error);
      return {};
    }
  }

  // Remove a specific draft order
  static removeDraftOrder(orderId: string): void {
    try {
      const drafts = this.loadDraftOrders();
      delete drafts[orderId];
      localStorage.setItem(DRAFT_ORDERS_KEY, JSON.stringify(drafts));
    } catch (error) {
      console.error("Failed to remove draft order:", error);
    }
  }

  // Create backup of order data
  private static createBackup(orderData: LocalOrderData): void {
    try {
      const backups = this.loadBackups();
      const backupId = `backup_${Date.now()}`;

      backups[backupId] = orderData;

      // Keep only last 10 backups
      const sortedBackups = Object.entries(backups)
        .sort(([, a], [, b]) => b.lastModified - a.lastModified)
        .slice(0, 10);

      const trimmedBackups = Object.fromEntries(sortedBackups);
      localStorage.setItem(ORDER_BACKUP_KEY, JSON.stringify(trimmedBackups));
    } catch (error) {
      console.error("Failed to create order backup:", error);
    }
  }

  // Load order backups
  static loadBackups(): Record<string, LocalOrderData> {
    try {
      const stored = localStorage.getItem(ORDER_BACKUP_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error("Failed to load order backups:", error);
      return {};
    }
  }

  // Restore from backup
  static restoreFromBackup(backupId: string): LocalOrderData | null {
    try {
      const backups = this.loadBackups();
      return backups[backupId] || null;
    } catch (error) {
      console.error("Failed to restore from backup:", error);
      return null;
    }
  }

  // Check if there's unsaved data
  static hasUnsavedData(): boolean {
    const currentOrder = this.loadCurrentOrder();
    return currentOrder !== null && currentOrder.items.length > 0;
  }

  // Get storage usage info
  static getStorageInfo(): {
    currentOrderSize: number;
    draftOrdersCount: number;
    backupsCount: number;
    totalSize: number;
  } {
    try {
      const currentOrder = localStorage.getItem(ORDER_STORAGE_KEY);
      const draftOrders = localStorage.getItem(DRAFT_ORDERS_KEY);
      const backups = localStorage.getItem(ORDER_BACKUP_KEY);

      const currentOrderSize = currentOrder ? currentOrder.length : 0;
      const draftOrdersSize = draftOrders ? draftOrders.length : 0;
      const backupsSize = backups ? backups.length : 0;

      const draftOrdersCount = draftOrders ? Object.keys(JSON.parse(draftOrders)).length : 0;
      const backupsCount = backups ? Object.keys(JSON.parse(backups)).length : 0;

      return {
        currentOrderSize,
        draftOrdersCount,
        backupsCount,
        totalSize: currentOrderSize + draftOrdersSize + backupsSize
      };
    } catch (error) {
      console.error("Failed to get storage info:", error);
      return {
        currentOrderSize: 0,
        draftOrdersCount: 0,
        backupsCount: 0,
        totalSize: 0
      };
    }
  }

  // Clear all stored data
  static clearAllData(): void {
    try {
      localStorage.removeItem(ORDER_STORAGE_KEY);
      localStorage.removeItem(DRAFT_ORDERS_KEY);
      localStorage.removeItem(ORDER_BACKUP_KEY);
    } catch (error) {
      console.error("Failed to clear all order data:", error);
    }
  }
}
