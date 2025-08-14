import { inventoryAPI } from "@/api/inventory.api";
import { stockAPI } from "@/api/stock.api.ts.tsx";
import { AddStockData, CreateMenuItemData, Material, MaterialWithStock, MenuItem, MenuItemCategory, RecordWasteData, Section, SectionAssignment, StockEntry, StockEntryWithMaterial, UpdateMenuItemData } from "@/types/inventory";
import { atom } from "jotai";
import { materialsAtom, menuItemsAtom, optimisticAssignmentsAtom, optimisticMaterialsAtom, optimisticSectionsAtom, optimisticStockEntriesAtom, sectionAssignmentsAtom, sectionsAtom, stockEntriesAtom, tabErrorAtom, tabLoadingAtom } from "./inventoryAtoms";

// Data fetching actions
export const fetchMaterialsAction = atom(null, async (get, set) => {
  set(tabLoadingAtom, prev => ({ ...prev, material: true }));
  set(tabErrorAtom, prev => ({ ...prev, material: null }));

  try {
    const materialsData = await inventoryAPI.materials.getMaterials();
    const transformedMaterials: MaterialWithStock[] = materialsData.map(material => ({
      ...material,
      id: material.id.toString(),
      createdAt: material.createdAt ? new Date(material.createdAt) : new Date(),
      updatedAt: material.updatedAt ? new Date(material.updatedAt) : new Date(),
      stockEntries: [],
      totalQuantityInBaseUnit: 0,
      totalValue: 0,
      averageCostPerBaseUnit: 0,
      availableQuantity: 0
    }));

    set(materialsAtom, transformedMaterials);
    set(optimisticMaterialsAtom, transformedMaterials);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch materials";
    set(tabErrorAtom, prev => ({ ...prev, material: errorMessage }));
  } finally {
    set(tabLoadingAtom, prev => ({ ...prev, material: false }));
  }
});

export const fetchStockEntriesAction = atom(null, async (get, set) => {
  set(tabLoadingAtom, prev => ({ ...prev, stock: true }));
  set(tabErrorAtom, prev => ({ ...prev, stock: null }));

  try {
    const response = await inventoryAPI.stock.getStockEntries();
    const transformedStockEntries: StockEntryWithMaterial[] = response.map((entry: StockEntry & { material?: Material }) => ({
      ...entry,
      id: entry.id.toString(),
      materialId: entry.materialId.toString(),
      purchaseDate: new Date(entry.purchaseDate),
      expiryDate: entry.expiryDate ? new Date(entry.expiryDate) : undefined,
      createdAt: entry.createdAt ? new Date(entry.createdAt) : new Date(),
      updatedAt: entry.updatedAt ? new Date(entry.updatedAt) : new Date(),
      material: entry.material
    }));

    set(stockEntriesAtom, transformedStockEntries);
    set(optimisticStockEntriesAtom, transformedStockEntries);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch stock entries";
    set(tabErrorAtom, prev => ({ ...prev, stock: errorMessage }));
  } finally {
    set(tabLoadingAtom, prev => ({ ...prev, stock: false }));
  }
});

export const fetchSectionsAction = atom(null, async (get, set) => {
  set(tabLoadingAtom, prev => ({ ...prev, sections: true }));
  set(tabErrorAtom, prev => ({ ...prev, sections: null }));

  try {
    const [sectionsRes, assignmentsRes] = await Promise.all([inventoryAPI.sections.getSections(), inventoryAPI.assignments.getAssignments()]);

    const transformedSections: Section[] = sectionsRes.data.map(section => ({
      ...section,
      id: section.id.toString(),
      createdAt: section.createdAt ? new Date(section.createdAt) : new Date(),
      updatedAt: section.updatedAt ? new Date(section.updatedAt) : new Date()
    }));

    const transformedAssignments: SectionAssignment[] = assignmentsRes.data.map(assignment => ({
      ...assignment,
      id: assignment.id.toString(),
      sectionId: assignment.sectionId.toString(),
      materialId: assignment.materialId?.toString(),
      menuItemId: assignment.menuItemId?.toString(),
      stockEntryId: assignment.stockEntryId?.toString(),
      createdAt: assignment.createdAt ? new Date(assignment.createdAt) : new Date(),
      updatedAt: assignment.updatedAt ? new Date(assignment.updatedAt) : new Date()
    }));

    set(sectionsAtom, transformedSections);
    set(sectionAssignmentsAtom, transformedAssignments);
    set(optimisticSectionsAtom, transformedSections);
    set(optimisticAssignmentsAtom, transformedAssignments);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch sections";
    set(tabErrorAtom, prev => ({ ...prev, sections: errorMessage }));
  } finally {
    set(tabLoadingAtom, prev => ({ ...prev, sections: false }));
  }
});

export const fetchMenuItemsAction = atom(null, async (get, set) => {
  set(tabLoadingAtom, prev => ({ ...prev, menu: true }));
  set(tabErrorAtom, prev => ({ ...prev, menu: null }));

  try {
    const response = await inventoryAPI.menu.getMenus();
    const transformedMenuItems: MenuItem[] = response.data.map(item => ({
      ...item,
      id: item.id.toString(),
      createdAt: item.createdAt ? new Date(item.createdAt) : new Date(),
      updatedAt: item.updatedAt ? new Date(item.updatedAt) : new Date()
    }));

    set(menuItemsAtom, transformedMenuItems);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch menu items";
    set(tabErrorAtom, prev => ({ ...prev, menu: errorMessage }));
  } finally {
    set(tabLoadingAtom, prev => ({ ...prev, menu: false }));
  }
});

// CRUD actions with optimistic updates
export const createMaterialAction = atom(null, async (get, set, data: MaterialWithStock) => {
  // Get current state before optimistic update
  const currentMaterials = get(optimisticMaterialsAtom);

  // Optimistic update
  const tempMaterial: MaterialWithStock = {
    ...data,
    id: `temp-${Date.now()}`,
    createdAt: new Date(),
    updatedAt: new Date(),
    stockEntries: [],
    totalQuantityInBaseUnit: 0,
    totalValue: 0,
    averageCostPerBaseUnit: 0,
    availableQuantity: 0
  };

  set(optimisticMaterialsAtom, prev => [...prev, tempMaterial]);

  try {
    // Convert MaterialWithStock to CreateMaterialData for API
    const createData = {
      name: data.name,
      category: data.category,
      baseUnit: data.baseUnit,
      unitType: data.unitType,
      inputUnit: data.inputUnit,
      packageQuantity: data.packageQuantity,
      description: data.description
    };

    // Make API call
    const response = await inventoryAPI.materials.createMaterial(createData);
    // Update optimistic state with real data from server
    const realMaterial: MaterialWithStock = {
      ...response.data,
      id: response.data.id.toString(),
      createdAt: response.data.createdAt ? new Date(response.data.createdAt) : new Date(),
      updatedAt: response.data.updatedAt ? new Date(response.data.updatedAt) : new Date(),
      stockEntries: [],
      totalQuantityInBaseUnit: 0,
      totalValue: 0,
      averageCostPerBaseUnit: response.data.costPerUnit || 0,
      availableQuantity: 0
    };

    // Replace temp material with real material
    set(optimisticMaterialsAtom, prev => prev.map(m => (m.id === tempMaterial.id ? realMaterial : m)));
  } catch (error) {
    // Revert optimistic update
    set(optimisticMaterialsAtom, currentMaterials);
    console.error("Failed to create material:", error);
    throw error;
  }
});

export const updateMaterialAction = atom(null, async (get, set, { id, data }: { id: string; data: MaterialWithStock }) => {
  // Optimistic update
  const currentMaterials = get(optimisticMaterialsAtom);
  set(optimisticMaterialsAtom, prev => prev.map(material => (material.id === id ? { ...material, ...data, updatedAt: new Date() } : material)));

  try {
    // Convert MaterialWithStock to UpdateMaterialData for API
    const updateData = {
      name: data.name,
      category: data.category,
      baseUnit: data.baseUnit,
      unitType: data.unitType,
      inputUnit: data.inputUnit,
      packageQuantity: data.packageQuantity,
      description: data.description
    };

    // Make API call
    const response = await inventoryAPI.materials.updateMaterial(id, updateData);
    // Update with real data from server
    const realMaterial: MaterialWithStock = {
      ...response.data,
      id: response.data.id.toString(),
      createdAt: response.data.createdAt ? new Date(response.data.createdAt) : new Date(),
      updatedAt: response.data.updatedAt ? new Date(response.data.updatedAt) : new Date(),
      stockEntries: data.stockEntries || [],
      totalQuantityInBaseUnit: data.totalQuantityInBaseUnit || 0,
      totalValue: data.totalValue || 0,
      averageCostPerBaseUnit: response.data.costPerUnit || 0,
      availableQuantity: data.availableQuantity || 0
    };

    // Replace optimistic update with real data
    set(optimisticMaterialsAtom, prev => prev.map(material => (material.id === id ? realMaterial : material)));

    // Update the base materials atom as well
    set(materialsAtom, prev => prev.map(material => (material.id === id ? realMaterial : material)));
  } catch (error) {
    // Revert optimistic update
    set(optimisticMaterialsAtom, currentMaterials);
    console.error("Failed to update material:", error);
    throw error;
  }
});

export const deleteMaterialAction = atom(null, async (get, set, id: string) => {
  // Get current state before optimistic update
  const currentMaterials = get(optimisticMaterialsAtom);

  // Optimistic update - remove material immediately
  set(optimisticMaterialsAtom, prev => prev.filter(material => material.id !== id));

  try {
    // Make API call
    await inventoryAPI.materials.deleteMaterial(id);
    // Update the base materials atom as well
    set(materialsAtom, prev => prev.filter(material => material.id !== id));
  } catch (error) {
    // Revert optimistic update
    set(optimisticMaterialsAtom, currentMaterials);
    console.error("Failed to delete material:", error);
    throw error;
  }
});

export const deleteStockEntryAction = atom(null, async (get, set, id: string) => {
  // Get current state before optimistic update
  const currentStockEntries = get(optimisticStockEntriesAtom);

  // Optimistic update - remove stock entry immediately
  set(optimisticStockEntriesAtom, prev => prev.filter(stockEntry => stockEntry.id !== id));

  try {
    // Make API call
    await inventoryAPI.stock.deleteStockEntry(id);
    // Update the base stock entries atom as well
    set(stockEntriesAtom, prev => prev.filter(stockEntry => stockEntry.id !== id));
  } catch (error) {
    // Revert optimistic update
    set(optimisticStockEntriesAtom, currentStockEntries);
    console.error("Failed to delete stock entry:", error);
    throw error;
  }
});

export const createStockEntryAction = atom(null, async (get, set, data: StockEntry) => {
  // Optimistic update
  const tempStockEntry: StockEntry = {
    ...data,
    id: `temp-${Date.now()}`,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  set(optimisticStockEntriesAtom, prev => [...prev, tempStockEntry]);

  try {
    // Convert StockEntry to CreateStockEntryData by removing id, createdAt, updatedAt
    const createData = {
      materialId: data.materialId,
      supplier: data.supplier,
      purchasedQuantity: data.purchasedQuantity,
      purchasedUnit: data.purchasedUnit,
      purchasedIndividualQuantity: data.purchasedIndividualQuantity,
      purchasedIndividualUnit: data.purchasedIndividualUnit,
      costPerPurchasedUnit: data.costPerPurchasedUnit,
      totalCost: data.totalCost,
      purchaseDate: data.purchaseDate,
      expiryDate: data.expiryDate,
      batchNumber: data.batchNumber,
      notes: data.notes
    };

    // Make API call
    const response = await inventoryAPI.stock.createStockEntry(createData);

    // Update with real data from server
    const realStockEntry: StockEntry = {
      ...response.data,
      id: response.data.id.toString(),
      createdAt: new Date(response.data.createdAt),
      updatedAt: new Date(response.data.updatedAt),
      purchaseDate: new Date(response.data.purchaseDate),
      expiryDate: response.data.expiryDate ? new Date(response.data.expiryDate) : undefined
    };

    // Replace temp entry with real entry
    set(optimisticStockEntriesAtom, prev => prev.map(entry => (entry.id === tempStockEntry.id ? realStockEntry : entry)));

    // Update base atom as well
    set(stockEntriesAtom, prev => [...prev, realStockEntry]);
  } catch (error) {
    // Revert optimistic update
    set(optimisticStockEntriesAtom, get(stockEntriesAtom));
    throw error;
  }
});

export const updateStockEntryAction = atom(null, async (get, set, { id, data }: { id: string; data: StockEntry }) => {
  // Optimistic update
  const currentStockEntries = get(optimisticStockEntriesAtom);
  set(optimisticStockEntriesAtom, prev => prev.map(entry => (entry.id === id ? { ...entry, ...data, updatedAt: new Date() } : entry)));

  try {
    // Convert StockEntry to update data format
    const updateData = {
      materialId: data.materialId,
      supplier: data.supplier,
      purchasedQuantity: data.purchasedQuantity,
      purchasedUnit: data.purchasedUnit,
      purchasedIndividualQuantity: data.purchasedIndividualQuantity,
      purchasedIndividualUnit: data.purchasedIndividualUnit,
      costPerPurchasedUnit: data.costPerPurchasedUnit,
      totalCost: data.totalCost,
      purchaseDate: data.purchaseDate,
      expiryDate: data.expiryDate,
      batchNumber: data.batchNumber,
      notes: data.notes
    };

    // Make API call
    const response = await inventoryAPI.stock.updateStockEntry(id, updateData);
    // Update with real data from server
    const realStockEntry: StockEntry = {
      ...response.data,
      id: response.data.id.toString(),
      createdAt: new Date(response.data.createdAt),
      updatedAt: new Date(response.data.updatedAt),
      purchaseDate: new Date(response.data.purchaseDate),
      expiryDate: response.data.expiryDate ? new Date(response.data.expiryDate) : undefined
    };

    // Replace optimistic entry with real entry
    set(optimisticStockEntriesAtom, prev => prev.map(entry => (entry.id === id ? realStockEntry : entry)));

    // Update base atom as well
    set(stockEntriesAtom, prev => prev.map(entry => (entry.id === id ? realStockEntry : entry)));
  } catch (error) {
    // Revert optimistic update
    set(optimisticStockEntriesAtom, currentStockEntries);
    console.error("Failed to update stock entry:", error);
    throw error;
  }
});

// Tab data fetching action
export const fetchTabDataAction = atom(null, async (get, set, tabValue: string) => {
  switch (tabValue) {
    case "material":
    case "materials":
      await set(fetchMaterialsAction);
      break;
    case "stock":
      // Stock tab needs both materials (for material names and editing) and stock entries
      await Promise.all([set(fetchMaterialsAction), set(fetchStockEntriesAction)]);
      break;
    case "sections":
      // Sections tab needs materials, stock entries, menu items, sections and assignments
      await Promise.all([set(fetchMaterialsAction), set(fetchStockEntriesAction), set(fetchMenuItemsAction), set(fetchSectionsAction)]);
      break;
    case "menu":
      // Menu tab needs both stock entries (for available materials) and menu items
      await Promise.all([set(fetchStockEntriesAction), set(fetchMenuItemsAction)]);
      break;
    case "conversions":
      await set(fetchMaterialsAction); // Reuse materials for conversions
      break;
    case "categories":
      // Categories tab doesn't need specific data fetching as categories are managed separately
      // Categories are fetched via getCategoriesByType API when needed
      console.log(`Categories tab loaded - categories are fetched dynamically via API`);
      break;
    default:
      console.error(`No specific data fetching defined for tab: ${tabValue}`);
  }
});

// Menu Item CRUD Actions
export const createMenuItemAction = atom(null, async (get, set, data: MenuItem & { imageFile?: File }) => {
  try {
    // Optimistic update - add menu item immediately at the top
    set(menuItemsAtom, prev => [data, ...prev]);

    // Transform MenuItem to CreateMenuItemData format
    const createData: CreateMenuItemData = {
      name: data.name,
      description: data.description,
      category: typeof data.category === 'string' ? data.category as MenuItemCategory : 
                typeof data.category === 'object' && data.category?.name ? data.category.name as MenuItemCategory :
                'plates' as MenuItemCategory, // fallback category
      price: data.price,
      ingredients: data.ingredients,
      isPOSItem: data.isPOSItem
    };

    // Extract imageFile from data
    const imageFile = data.imageFile;
    console.log('🔍 STORE DEBUG - ImageFile extracted:', imageFile);

    // Make API call with imageFile
    const response = await inventoryAPI.menu.createMenuItem(createData, imageFile);

    // Update with server response and keep it at the top
    const transformedMenuItem: MenuItem = {
      ...response.data,
      id: response.data.id.toString(),
      createdAt: response.data.createdAt ? new Date(response.data.createdAt) : new Date(),
      updatedAt: response.data.updatedAt ? new Date(response.data.updatedAt) : new Date()
    };

    // Replace the optimistic item with server response and ensure it stays at the top
    set(menuItemsAtom, prev => {
      const filteredItems = prev.filter(item => item.id !== data.id);
      return [transformedMenuItem, ...filteredItems];
    });
  } catch (error) {
    // Revert optimistic update
    set(menuItemsAtom, prev => prev.filter(item => item.id !== data.id));
    console.error("Failed to create menu item:", error);
    throw error;
  }
});

export const updateMenuItemAction = atom(null, async (get, set, { id, data }: { id: string; data: MenuItem & { imageFile?: File } }) => {
  // Get current state before optimistic update
  const currentMenuItems = get(menuItemsAtom);

  // Optimistic update - move updated item to top
  const updatedItem = { ...currentMenuItems.find(item => item.id === id), ...data, updatedAt: new Date() };
  const otherItems = currentMenuItems.filter(item => item.id !== id);
  set(menuItemsAtom, [updatedItem, ...otherItems]);

  try {
    // Transform MenuItem to UpdateMenuItemData format
    const updateData: UpdateMenuItemData = {
      name: data.name,
      description: data.description,
      category: typeof data.category === 'string' ? data.category as MenuItemCategory : 
                typeof data.category === 'object' && data.category?.name ? data.category.name as MenuItemCategory :
                undefined, // let backend handle if undefined
      price: data.price,
      ingredients: data.ingredients,
      isPOSItem: data.isPOSItem,
      image: data.image // Include the base64 image data
    };

    // Extract imageFile from data
    const imageFile = data.imageFile;
    console.log('🔍 UPDATE STORE DEBUG - ImageFile extracted:', imageFile);

    // Make API call with imageFile
    const response = await inventoryAPI.menu.updateMenuItem(id, updateData, imageFile);

    // Update with server response and keep it at the top
    console.log('🔍 UPDATE STORE DEBUG - Server response:', response.data);
    console.log('🔍 UPDATE STORE DEBUG - Server response category:', response.data.category);
    
    const transformedMenuItem: MenuItem = {
      ...response.data,
      id: response.data.id.toString(),
      createdAt: response.data.createdAt ? new Date(response.data.createdAt) : new Date(),
      updatedAt: response.data.updatedAt ? new Date(response.data.updatedAt) : new Date()
    };
    
    console.log('🔍 UPDATE STORE DEBUG - Transformed menu item category:', transformedMenuItem.category);

    // Replace the optimistic item with server response and ensure it stays at the top
    set(menuItemsAtom, prev => {
      const filteredItems = prev.filter(item => item.id !== id);
      return [transformedMenuItem, ...filteredItems];
    });
  } catch (error) {
    // Revert optimistic update
    set(menuItemsAtom, currentMenuItems);
    console.error("Failed to update menu item:", error);
    throw error;
  }
});

export const deleteMenuItemAction = atom(null, async (get, set, id: string) => {
  console.log("🗑️ [DeleteAction] deleteMenuItemAction called with id:", id);
  
  // Get current state before optimistic update
  const currentMenuItems = get(menuItemsAtom);
  console.log("🗑️ [DeleteAction] Current menuItems count:", currentMenuItems.length);
  console.log("🗑️ [DeleteAction] Looking for item with id:", id);
  
  const itemToDelete = currentMenuItems.find(item => item.id === id);
  if (!itemToDelete) {
    console.error("❌ [DeleteAction] Menu item not found with id:", id);
    throw new Error(`Menu item with id ${id} not found`);
  }
  
  console.log("🗑️ [DeleteAction] Found item to delete:", itemToDelete.name);

  // Optimistic update - remove menu item immediately
  set(menuItemsAtom, prev => {
    const filtered = prev.filter(item => item.id !== id);
    console.log("🗑️ [DeleteAction] Optimistic update - new count:", filtered.length);
    return filtered;
  });

  try {
    console.log("🗑️ [DeleteAction] Making API call to delete item:", id);
    // Make API call
    await inventoryAPI.menu.deleteMenuItem(id);
    console.log("✅ [DeleteAction] API call successful for id:", id);
  } catch (error) {
    console.error("❌ [DeleteAction] API call failed, reverting optimistic update:", error);
    // Revert optimistic update
    set(menuItemsAtom, currentMenuItems);
    console.error("Failed to delete menu item:", error);
    throw error;
  }
});

// Add stock to existing inventory action
export const addToStockAction = atom(null, async (get, set, data: AddStockData) => {
  try {
    // Make API call to add stock
    const response = await stockAPI.addToStock(data);

    // Create a new stock entry from the response
    const newStockEntry: StockEntry = {
      ...response.data.stockEntry,
      id: response.data.stockEntry.id.toString(),
      materialId: response.data.stockEntry.materialId.toString(),
      createdAt: new Date(response.data.stockEntry.createdAt),
      updatedAt: new Date(response.data.stockEntry.updatedAt),
      purchaseDate: new Date(response.data.stockEntry.purchaseDate),
      expiryDate: response.data.stockEntry.expiryDate ? new Date(response.data.stockEntry.expiryDate) : undefined
    };

    // Add the new entry to both optimistic and base atoms
    set(optimisticStockEntriesAtom, prev => [...prev, newStockEntry]);
    set(stockEntriesAtom, prev => [...prev, newStockEntry]);

    return response.data;
  } catch (error) {
    console.error("Failed to add stock:", error);
    throw error;
  }
});

// Record waste (reduce stock) action
export const recordWasteAction = atom(null, async (get, set, data: RecordWasteData) => {
  try {
    // Make API call to record waste
    const response = await stockAPI.recordWaste(data);

    // Create the waste record entry
    const wasteRecord: StockEntry = {
      ...response.data.wasteRecord,
      id: response.data.wasteRecord.id.toString(),
      materialId: response.data.wasteRecord.materialId.toString(),
      createdAt: new Date(response.data.wasteRecord.createdAt),
      updatedAt: new Date(response.data.wasteRecord.updatedAt),
      purchaseDate: new Date(response.data.wasteRecord.purchaseDate),
      expiryDate: response.data.wasteRecord.expiryDate ? new Date(response.data.wasteRecord.expiryDate) : undefined
    };

    // Add the waste record and update existing entries
    set(optimisticStockEntriesAtom, prev => {
      // Update existing entries based on the response
      const updatedEntries = [...prev];

      // Update quantities for existing entries that were reduced
      response.data.updatedEntries.forEach(update => {
        const index = updatedEntries.findIndex(entry => entry.id === update.id);
        if (index !== -1) {
          updatedEntries[index] = {
            ...updatedEntries[index],
            purchasedIndividualQuantity: update.newQuantity,
            // Recalculate purchased quantity based on unit type
            purchasedQuantity: update.newQuantity, // This might need unit conversion
            updatedAt: new Date()
          };
        }
      });

      // Add the waste record (negative entry)
      updatedEntries.push(wasteRecord);

      return updatedEntries;
    });

    // Update base atom as well
    set(stockEntriesAtom, prev => {
      const updatedEntries = [...prev];

      response.data.updatedEntries.forEach(update => {
        const index = updatedEntries.findIndex(entry => entry.id === update.id);
        if (index !== -1) {
          updatedEntries[index] = {
            ...updatedEntries[index],
            purchasedIndividualQuantity: update.newQuantity,
            purchasedQuantity: update.newQuantity,
            updatedAt: new Date()
          };
        }
      });

      updatedEntries.push(wasteRecord);

      return updatedEntries;
    });

    return response.data;
  } catch (error) {
    console.error("Failed to record waste:", error);
    throw error;
  }
});

// Add quantity to a specific stock entry
export const addToSpecificEntryAction = atom(null, async (get, set, data: { entryId: string; additionalQuantity: number; unit: string; additionDate?: Date; notes?: string }) => {
  // Get current state before optimistic update
  const currentStockEntries = get(optimisticStockEntriesAtom);

  try {
    // Optimistic update - update the specific entry immediately
    set(optimisticStockEntriesAtom, prev =>
      prev.map(entry => {
        if (entry.id === data.entryId) {
          // For optimistic updates, only update individual quantity for display
          // The server will calculate the correct values and we'll get them back
          return {
            ...entry,
            purchasedIndividualQuantity: (entry.purchasedIndividualQuantity || 0) + data.additionalQuantity,
            updatedAt: new Date()
            // Don't modify purchasedQuantity optimistically - let server handle it
          };
        }
        return entry;
      })
    );

    // Make API call
    const response = await stockAPI.addToSpecificEntry(data.entryId, {
      additionalQuantity: data.additionalQuantity,
      unit: data.unit,
      additionDate: data.additionDate,
      notes: data.notes
    });

    // Transform response data
    const updatedStockEntry: StockEntry = {
      ...response.data.stockEntry,
      id: response.data.stockEntry.id.toString(),
      materialId: response.data.stockEntry.materialId.toString(),
      createdAt: new Date(response.data.stockEntry.createdAt),
      updatedAt: new Date(response.data.stockEntry.updatedAt),
      purchaseDate: new Date(response.data.stockEntry.purchaseDate),
      expiryDate: response.data.stockEntry.expiryDate ? new Date(response.data.stockEntry.expiryDate) : undefined
    };

    // Update both atoms with real data from server
    set(optimisticStockEntriesAtom, prev => prev.map(entry => (entry.id === data.entryId ? updatedStockEntry : entry)));

    set(stockEntriesAtom, prev => prev.map(entry => (entry.id === data.entryId ? updatedStockEntry : entry)));

    return response.data;
  } catch (error) {
    // Revert optimistic update
    set(optimisticStockEntriesAtom, currentStockEntries);
    console.error("Failed to add to specific entry:", error);
    throw error;
  }
});

// Record waste from a specific stock entry
export const wasteFromSpecificEntryAction = atom(null, async (get, set, data: { entryId: string; wasteQuantity: number; unit: string; wasteReason: string; wasteDate?: Date; notes?: string }) => {
  // Get current state before optimistic update
  const currentStockEntries = get(optimisticStockEntriesAtom);

  try {
    // Optimistic update - update the specific entry immediately
    set(optimisticStockEntriesAtom, prev =>
      prev.map(entry => {
        if (entry.id === data.entryId) {
          return {
            ...entry,
            purchasedIndividualQuantity: Math.max(0, (entry.purchasedIndividualQuantity || 0) - data.wasteQuantity),
            updatedAt: new Date()
          };
        }
        return entry;
      })
    );

    // Make API call
    const response = await stockAPI.wasteFromSpecificEntry(data.entryId, {
      wasteQuantity: data.wasteQuantity,
      unit: data.unit,
      wasteReason: data.wasteReason,
      wasteDate: data.wasteDate,
      notes: data.notes
    });

    const updatedStockEntry: StockEntry = {
      ...response.data.stockEntry,
      id: response.data.stockEntry.id.toString(),
      materialId: response.data.stockEntry.materialId.toString(),
      createdAt: new Date(response.data.stockEntry.createdAt),
      updatedAt: new Date(response.data.stockEntry.updatedAt),
      purchaseDate: new Date(response.data.stockEntry.purchaseDate),
      expiryDate: response.data.stockEntry.expiryDate ? new Date(response.data.stockEntry.expiryDate) : undefined
    };

    // Update both atoms with real data from server
    set(optimisticStockEntriesAtom, prev => prev.map(entry => (entry.id === data.entryId ? updatedStockEntry : entry)));

    set(stockEntriesAtom, prev => prev.map(entry => (entry.id === data.entryId ? updatedStockEntry : entry)));

    return response.data;
  } catch (error) {
    // Revert optimistic update
    set(optimisticStockEntriesAtom, currentStockEntries);
    console.error("Failed to record waste from specific entry:", error);
    throw error;
  }
});
