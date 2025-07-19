import { inventoryAPI } from "@/api/inventory.api";
import { Material, MaterialWithStock, MenuItem, Section, SectionAssignment, StockEntry, StockEntryWithMaterial } from "@/types/inventory";
import { atom } from "jotai";
import { materialsAtom, menuItemsAtom, optimisticAssignmentsAtom, optimisticMaterialsAtom, optimisticSectionsAtom, optimisticStockEntriesAtom, sectionAssignmentsAtom, sectionsAtom, stockEntriesAtom, tabErrorAtom, tabLoadingAtom } from "./inventoryAtoms";

// Data fetching actions
export const fetchMaterialsAction = atom(null, async (get, set) => {
  set(tabLoadingAtom, prev => ({ ...prev, material: true }));
  set(tabErrorAtom, prev => ({ ...prev, material: null }));

  try {
    const response = await inventoryAPI.materials.getMaterials();
    const transformedMaterials: MaterialWithStock[] = response.data.map(material => ({
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
    const transformedStockEntries: StockEntryWithMaterial[] = response.data.map((entry: StockEntry & { material?: Material }) => ({
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
      costPerBaseUnit: data.costPerBaseUnit,
      packageQuantity: data.packageQuantity,
      description: data.description
    };

    console.log("Creating material with data:", createData);

    // Make API call
    const response = await inventoryAPI.materials.createMaterial(createData);

    console.log("Material created successfully:", response.data);

    // Update optimistic state with real data from server
    const realMaterial: MaterialWithStock = {
      ...response.data,
      id: response.data.id.toString(),
      createdAt: response.data.createdAt ? new Date(response.data.createdAt) : new Date(),
      updatedAt: response.data.updatedAt ? new Date(response.data.updatedAt) : new Date(),
      stockEntries: [],
      totalQuantityInBaseUnit: 0,
      totalValue: 0,
      averageCostPerBaseUnit: response.data.costPerBaseUnit || 0,
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
    // Make API call
    // await inventoryAPI.materials.updateMaterial(id, data);
  } catch (error) {
    // Revert optimistic update
    set(optimisticMaterialsAtom, currentMaterials);
    throw error;
  }
});

export const deleteMaterialAction = atom(null, async (get, set, id: string) => {
  // Get current state before optimistic update
  const currentMaterials = get(optimisticMaterialsAtom);

  // Optimistic update - remove material immediately
  set(optimisticMaterialsAtom, prev => prev.filter(material => material.id !== id));

  try {
    console.log("Deleting material with ID:", id);

    // Make API call
    await inventoryAPI.materials.deleteMaterial(id);

    console.log("Material deleted successfully");

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
    console.log("Deleting stock entry with ID:", id);

    // Make API call
    await inventoryAPI.stock.deleteStockEntry(id);

    console.log("Stock entry deleted successfully");

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
    console.log("Creating stock entry with data:", data);

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

    console.log("Stock entry created successfully:", response.data);

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
    console.log("Updating stock entry with ID:", id, "and data:", data);

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

    console.log("Stock entry updated successfully:", response.data);

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
      await set(fetchMaterialsAction);
      break;
    case "stock":
      await set(fetchStockEntriesAction);
      break;
    case "sections":
      await set(fetchSectionsAction);
      break;
    case "menu":
      // Menu tab needs both stock entries (for available materials) and menu items
      await Promise.all([
        set(fetchStockEntriesAction),
        set(fetchMenuItemsAction)
      ]);
      break;
    case "conversions":
      await set(fetchMaterialsAction); // Reuse materials for conversions
      break;
    default:
      console.log(`No specific data fetching defined for tab: ${tabValue}`);
  }
});

// Menu Item CRUD Actions
export const createMenuItemAction = atom(
  null,
  async (get, set, data: MenuItem) => {
    try {
      console.log('Creating menu item with data:', data);
      
      // Optimistic update - add menu item immediately
      set(menuItemsAtom, prev => [...prev, data]);
      
      // Make API call
      const response = await inventoryAPI.menu.createMenuItem(data);
      
      console.log('Menu item created successfully:', response.data);
      
      // Update with server response
      const transformedMenuItem: MenuItem = {
        ...response.data,
        id: response.data.id.toString(),
        createdAt: response.data.createdAt ? new Date(response.data.createdAt) : new Date(),
        updatedAt: response.data.updatedAt ? new Date(response.data.updatedAt) : new Date()
      };
      
      set(menuItemsAtom, prev => prev.map(item => 
        item.id === data.id ? transformedMenuItem : item
      ));
      
    } catch (error) {
      // Revert optimistic update
      set(menuItemsAtom, prev => prev.filter(item => item.id !== data.id));
      console.error('Failed to create menu item:', error);
      throw error;
    }
  }
);

export const updateMenuItemAction = atom(
  null,
  async (get, set, { id, data }: { id: string; data: MenuItem }) => {
    // Get current state before optimistic update
    const currentMenuItems = get(menuItemsAtom);
    
    // Optimistic update
    set(menuItemsAtom, prev => prev.map(item => 
      item.id === id ? { ...item, ...data, updatedAt: new Date() } : item
    ));
    
    try {
      console.log('Updating menu item with ID:', id, 'data:', data);
      
      // Make API call
      const response = await inventoryAPI.menu.updateMenuItem(id, data);
      
      console.log('Menu item updated successfully:', response.data);
      
      // Update with server response
      const transformedMenuItem: MenuItem = {
        ...response.data,
        id: response.data.id.toString(),
        createdAt: response.data.createdAt ? new Date(response.data.createdAt) : new Date(),
        updatedAt: response.data.updatedAt ? new Date(response.data.updatedAt) : new Date()
      };
      
      set(menuItemsAtom, prev => prev.map(item => 
        item.id === id ? transformedMenuItem : item
      ));
      
    } catch (error) {
      // Revert optimistic update
      set(menuItemsAtom, currentMenuItems);
      console.error('Failed to update menu item:', error);
      throw error;
    }
  }
);

export const deleteMenuItemAction = atom(
  null,
  async (get, set, id: string) => {
    // Get current state before optimistic update
    const currentMenuItems = get(menuItemsAtom);
    
    // Optimistic update - remove menu item immediately
    set(menuItemsAtom, prev => prev.filter(item => item.id !== id));
    
    try {
      console.log('Deleting menu item with ID:', id);
      
      // Make API call
      await inventoryAPI.menu.deleteMenuItem(id);
      
      console.log('Menu item deleted successfully');
      
    } catch (error) {
      // Revert optimistic update
      set(menuItemsAtom, currentMenuItems);
      console.error('Failed to delete menu item:', error);
      throw error;
    }
  }
);
