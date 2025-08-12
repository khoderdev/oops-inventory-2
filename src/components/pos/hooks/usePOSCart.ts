import { useCallback, useEffect } from "react";
import { POSCartItem, POSItem, MenuItem, StockEntryWithMaterial } from "@/types/inventory";
import { OrderPersistence } from "@/utils/orderPersistence";
import { UsePOSCartProps } from "@/types/pos";

export const usePOSCart = ({ cart, setCart, menuItems, stockEntries, tables, optimisticAssignments, showSuccess, recalculateEmployeeDiscount, setHasUnsavedChanges }: UsePOSCartProps) => {
  const addToCart = useCallback(
    (posItem: POSItem) => {
      const cartId = `pos-${posItem.id}`;
      setCart(prevCart => {
        const currentCart = prevCart || [];
        const existingItem = currentCart.find(cartItem => cartItem.id === cartId);
        let newCart: POSCartItem[];
        if (existingItem) {
          newCart = currentCart.map(cartItem => (cartItem.id === cartId ? { ...cartItem, quantity: cartItem.quantity + 1 } : cartItem));
        } else {
          if (posItem.type === "menu_item") {
            const menuItemId = posItem.menuItemId;
            const menuItem = menuItems.find(mi => {
              const miId = typeof mi.id === "string" ? parseInt(mi.id) || 0 : mi.id;
              const targetId = typeof menuItemId === "string" ? parseInt(menuItemId) || 0 : menuItemId;
              return miId === targetId;
            });
            if (!menuItem) {
              console.warn("Menu item not found for POS item:", posItem);
              return currentCart;
            }
            const newItem: POSCartItem = {
              id: cartId,
              name: posItem.name,
              price: posItem.price,
              quantity: 1,
              type: "menu_item",
              originalItem: menuItem,
              posItem,
              stockEntryId: undefined,
              menuItemId: typeof menuItemId === "string" ? parseInt(menuItemId) || 0 : menuItemId,
              printerId: menuItem?.printerId || posItem?.printerId,
              assignedPrinter: menuItem?.assignedPrinter || posItem?.assignedPrinter
            };
            newCart = [...currentCart, newItem];
          } else {
            const stockEntry = stockEntries.find(se => {
              const stockEntryMaterialId = String(se.materialId);
              const posItemMaterialId = String(posItem.materialId);
              return stockEntryMaterialId === posItemMaterialId;
            });
            if (!stockEntry) {
              console.warn("Stock entry not found:", posItem);
              return currentCart;
            }
            const newItem: POSCartItem = {
              id: cartId,
              name: posItem.name,
              price: posItem.price,
              quantity: 1,
              type: "material",
              originalItem: stockEntry,
              posItem,
              stockEntryId: posItem.materialId,
              materialId: posItem.materialId,
              menuItemId: undefined,
              printerId: stockEntry.printerId || posItem.printerId,
              assignedPrinter: stockEntry.assignedPrinter || posItem.assignedPrinter
            };
            newCart = [...currentCart, newItem];
          }
        }
        setTimeout(() => {
          recalculateEmployeeDiscount(newCart);
        }, 0);
        return newCart;
      });
    },
    [menuItems, stockEntries, recalculateEmployeeDiscount, setCart]
  );

  useEffect(() => {
    const loadSavedOrder = async () => {
      const savedOrder = OrderPersistence.loadCurrentOrder();
      if (savedOrder && savedOrder.items && savedOrder.items.length > 0) {
        const cartItems: POSCartItem[] = savedOrder.items
          .map(item => {
            let originalItem: StockEntryWithMaterial | MenuItem;
            if (item.type === "material" && item.materialId) {
              originalItem = stockEntries.find(se => se.materialId === item.materialId);
            } else if (item.type === "menu_item" && item.menuItemId) {
              originalItem = menuItems.find(m => m.id === item.menuItemId);
            }
            if (!originalItem) {
              return null;
            }
            return {
              id: item.id,
              name: item.name,
              price: item.unitPrice,
              quantity: item.quantity,
              type: item.type as "material" | "menu_item",
              originalItem,
              notes: item.notes || undefined
            };
          })
          .filter(Boolean) as POSCartItem[];
        setCart(cartItems);
        setHasUnsavedChanges(true);
        showSuccess("Previous order restored from auto-save");
      }
    };
    if (optimisticAssignments.length > 0 && menuItems.length > 0) {
      loadSavedOrder();
    }
  }, [optimisticAssignments, menuItems, stockEntries, tables, showSuccess, setCart, setHasUnsavedChanges]);

  useEffect(() => {
    if (cart && cart.length > 0) {
      setHasUnsavedChanges(true);
    } else {
      setHasUnsavedChanges(false);
    }
  }, [cart, setHasUnsavedChanges]);
  return {
    addToCart
  };
};
