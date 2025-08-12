import { useState, useEffect, useCallback } from "react";
import { menuAPI } from "@/api/menu.api.ts.tsx";
import { ordersAPI } from "@/api/orders.api";
import { tablesAPI } from "@/api/tables.api";
import { stockAPI } from "@/api/stock.api.ts.tsx";
import { useOrdersPrefetch } from "@/hooks/useOrdersPrefetch";
import { MenuItem, StockEntryWithMaterial, POSItem, Table, SectionAssignment } from "@/types/inventory";
import { OrderSummary as OrderSummaryType } from "@/types/orders";
import { UsePOSDataProps } from "@/types/pos";

export const usePOSData = ({ sectionAssignments, showError }: UsePOSDataProps) => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [stockEntries, setStockEntries] = useState<StockEntryWithMaterial[]>([]);
  const [posItems, setPosItems] = useState<POSItem[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [optimisticAssignments, setOptimisticAssignments] = useState<SectionAssignment[]>(sectionAssignments);
  // Disable prefetch hook and use direct loading instead
  const [isLoading, setIsLoading] = useState(true);
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [stock, setStock] = useState<StockEntryWithMaterial[]>([]);
  const status = { isLoading, error: null };
  
  // Load data directly without prefetch system
  const refreshInventory = useCallback(async () => {
    try {
      setIsLoading(true);
      const [menuResponse, stockResponse] = await Promise.all([
        menuAPI.getMenus(),
        stockAPI.getStockEntriesWithPrinters()
      ]);
      
      setMenu(menuResponse.data);
      setStock(stockResponse);
      setIsLoading(false);
    } catch (error) {
      console.error("Failed to load inventory data:", error);
      setIsLoading(false);
    }
  }, []);

  // Initial data load
  useEffect(() => {
    refreshInventory();
  }, [refreshInventory]);
  

  const handleOrdersError = useCallback((error: Error) => {
    console.error("Failed to load orders data:", error);
  }, []);
  const orderDataTypes = ["orderSummaries"] as ("orderSummaries" | "orders")[];
  const { refresh: refreshOrders } = useOrdersPrefetch({ autoFetch: true, dataTypes: orderDataTypes, onError: handleOrdersError });

  const fetchTablesData = useCallback(async () => {
    try {
      const tablesResponse = await tablesAPI.getTables({ includeOrders: true });
      const responseData = tablesResponse.data as Table[] | { data: Table[] };
      const tablesData = Array.isArray(responseData) ? responseData : responseData.data || [];
      setTables(tablesData);
    } catch (error) {
      console.error("❌ Failed to refresh tables data:", error);
    }
  }, []);

  const refreshOrderData = useCallback(async () => {
    await Promise.all([refreshOrders(), fetchTablesData()]);
  }, [refreshOrders, fetchTablesData]);

  const refreshAllCounts = useCallback(async () => {
    await Promise.all([refreshOrders(), refreshInventory(), fetchTablesData()]);
  }, [refreshOrders, refreshInventory, fetchTablesData]);

  // Fetch incomplete orders
  const fetchIncompleteOrders = useCallback(async () => {
    try {
      const response = await ordersAPI.getOrders();
      if (response?.data) {
        let ordersArray: OrderSummaryType[];
        type NestedResponse = { data: OrderSummaryType[] };

        if (Array.isArray(response.data)) {
          ordersArray = response.data;
        } else if (response.data && typeof response.data === "object" && "data" in response.data && Array.isArray((response.data as NestedResponse).data)) {
          ordersArray = (response.data as NestedResponse).data;
        } else {
          return {
            incompleteOrdersCount: 0,
            tableOrders: {},
            incompleteTableOrdersCount: 0,
            incompleteDeliveryTakeawayCount: 0
          };
        }
        const incompleteStatuses = ["draft", "confirmed", "preparing", "ready"];
        const incompleteOrders = ordersArray.filter(order => incompleteStatuses.includes(order.status));
        const deliveryCount = incompleteOrders.filter(order => order.orderType === "delivery").length;
        const takeawayCount = incompleteOrders.filter(order => order.orderType === "takeaway").length;
        const deliveryTakeawayCount = deliveryCount + takeawayCount;
        const uniqueTablesWithOrders = new Set(incompleteOrders.filter(order => order.orderType === "table" && order.tableNumber).map(order => order.tableNumber));
        const tableOrdersCount = uniqueTablesWithOrders.size;
        const tableOrdersMap: { [tableId: string]: number } = {};
        incompleteOrders.forEach(order => {
          if (order.tableNumber) {
            const tableKey = order.tableNumber.toString();
            tableOrdersMap[tableKey] = (tableOrdersMap[tableKey] || 0) + 1;
          }
        });
        return {
          incompleteOrdersCount: incompleteOrders.length,
          tableOrders: tableOrdersMap,
          incompleteTableOrdersCount: tableOrdersCount,
          incompleteDeliveryTakeawayCount: deliveryTakeawayCount
        };
      }
    } catch (error) {
      console.error("Error fetching incomplete orders:", error);
    }

    return {
      incompleteOrdersCount: 0,
      tableOrders: {},
      incompleteTableOrdersCount: 0,
      incompleteDeliveryTakeawayCount: 0
    };
  }, []);

  // Effects
  useEffect(() => {
    setOptimisticAssignments(sectionAssignments);
  }, [sectionAssignments]);

  useEffect(() => {
    if (stock && stock.length > 0) {
      setStockEntries(stock);
    }
  }, [stock]);

  useEffect(() => {
    if (menu && menu.length > 0) {
      setMenuItems(menu);
    }
  }, [menu]);

  // Convert menu and stock to POS items - simple and stable
  useEffect(() => {
    if (menu.length > 0 && stock.length > 0) {
      const posItemsFromData: POSItem[] = [];

      menu.forEach(menuItem => {
        if (menuItem.isPOSItem) {
          posItemsFromData.push({
            id: `menu-${menuItem.id}`,
            name: menuItem.name,
            price: menuItem.price,
            category: menuItem.category,
            type: "menu_item",
            menuItemId: menuItem.id,
            unit: menuItem.unit,
            availableQuantity: menuItem.availableQuantity,
            costPerUnit: menuItem.costPerUnit,
            createdAt: menuItem.createdAt.toString(),
            updatedAt: menuItem.updatedAt.toString(),
            description: menuItem.description,
            image: menuItem.image
          });
        }
      });

      stock.forEach(stockEntry => {
        if (stockEntry.isPOSItem && stockEntry.material) {
          posItemsFromData.push({
            id: `stock-${stockEntry.id}`,
            name: stockEntry.material.name,
            price: stockEntry.costPerBaseUnit || 0,
            category: stockEntry.material.category,
            type: "stock_entry",
            materialId: Number(stockEntry.materialId),
            unit: stockEntry.material.baseUnit,
            description: `${stockEntry.material.name} - ${stockEntry.material.baseUnit}`,
            availableQuantity: 0,
            costPerUnit: stockEntry.costPerBaseUnit || 0,
            createdAt: "",
            updatedAt: ""
          });
        }
      });

      setPosItems(posItemsFromData);
    }
  }, [menu.length, stock.length]);

  // Fetch additional data when inventory is loaded
  useEffect(() => {
    const fetchAdditionalData = async () => {
      try {
        const tablesResponse = await tablesAPI.getTables({ includeOrders: true });
        const responseData = tablesResponse.data as Table[] | { data: Table[] };
        const tablesData = Array.isArray(responseData) ? responseData : responseData.data || [];
        setTables(tablesData);
      } catch (error) {
        showError("Failed to load additional data");
      }
    };

    if (!status.isLoading && menu.length > 0 && stock.length > 0) {
      fetchAdditionalData();
    }
  }, [status.isLoading, menu.length, stock.length, showError]);

  // Menu items are already fetched via prefetch hook

  return {
    // Data
    menuItems,
    setMenuItems,
    stockEntries,
    setStockEntries,
    posItems,
    setPosItems,
    tables,
    setTables,
    optimisticAssignments,
    setOptimisticAssignments,

    // Status
    status,

    // Refresh functions
    refreshInventory,
    refreshOrders,
    refreshOrderData,
    refreshAllCounts,
    fetchIncompleteOrders,
    fetchTablesData
  };
};
