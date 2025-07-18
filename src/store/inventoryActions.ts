import { atom } from 'jotai';
import { inventoryAPI } from '@/api/inventory.api';
import { Material, MaterialWithStock, StockEntry, Section, SectionAssignment, MenuItem } from '@/types/inventory';
import {
  materialsAtom,
  stockEntriesAtom,
  sectionsAtom,
  sectionAssignmentsAtom,
  menuItemsAtom,
  optimisticMaterialsAtom,
  optimisticStockEntriesAtom,
  optimisticSectionsAtom,
  optimisticAssignmentsAtom,
  tabLoadingAtom,
  tabErrorAtom
} from './inventoryAtoms';

// Data fetching actions
export const fetchMaterialsAction = atom(
  null,
  async (get, set) => {
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
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch materials';
      set(tabErrorAtom, prev => ({ ...prev, material: errorMessage }));
    } finally {
      set(tabLoadingAtom, prev => ({ ...prev, material: false }));
    }
  }
);

export const fetchStockEntriesAction = atom(
  null,
  async (get, set) => {
    set(tabLoadingAtom, prev => ({ ...prev, stock: true }));
    set(tabErrorAtom, prev => ({ ...prev, stock: null }));
    
    try {
      const response = await inventoryAPI.stock.getStockEntries();
      const transformedStockEntries: StockEntry[] = response.data.map(entry => ({
        ...entry,
        id: entry.id.toString(),
        materialId: entry.materialId.toString(),
        purchaseDate: new Date(entry.purchaseDate),
        expiryDate: entry.expiryDate ? new Date(entry.expiryDate) : undefined,
        createdAt: entry.createdAt ? new Date(entry.createdAt) : new Date(),
        updatedAt: entry.updatedAt ? new Date(entry.updatedAt) : new Date()
      }));
      
      set(stockEntriesAtom, transformedStockEntries);
      set(optimisticStockEntriesAtom, transformedStockEntries);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch stock entries';
      set(tabErrorAtom, prev => ({ ...prev, stock: errorMessage }));
    } finally {
      set(tabLoadingAtom, prev => ({ ...prev, stock: false }));
    }
  }
);

export const fetchSectionsAction = atom(
  null,
  async (get, set) => {
    set(tabLoadingAtom, prev => ({ ...prev, sections: true }));
    set(tabErrorAtom, prev => ({ ...prev, sections: null }));
    
    try {
      const [sectionsRes, assignmentsRes] = await Promise.all([
        inventoryAPI.sections.getSections(),
        inventoryAPI.assignments.getAssignments()
      ]);
      
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
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch sections';
      set(tabErrorAtom, prev => ({ ...prev, sections: errorMessage }));
    } finally {
      set(tabLoadingAtom, prev => ({ ...prev, sections: false }));
    }
  }
);

export const fetchMenuItemsAction = atom(
  null,
  async (get, set) => {
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
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch menu items';
      set(tabErrorAtom, prev => ({ ...prev, menu: errorMessage }));
    } finally {
      set(tabLoadingAtom, prev => ({ ...prev, menu: false }));
    }
  }
);

// CRUD actions with optimistic updates
export const createMaterialAction = atom(
  null,
  async (get, set, data: MaterialWithStock) => {
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
      // Make API call (assuming you have this function)
      // await inventoryAPI.materials.createMaterial(data);
    } catch (error) {
      // Revert optimistic update
      set(optimisticMaterialsAtom, currentMaterials);
      throw error;
    }
  }
);

export const updateMaterialAction = atom(
  null,
  async (get, set, { id, data }: { id: string; data: MaterialWithStock }) => {
    // Optimistic update
    const currentMaterials = get(optimisticMaterialsAtom);
    set(optimisticMaterialsAtom, prev => 
      prev.map(material => 
        material.id === id 
          ? { ...material, ...data, updatedAt: new Date() }
          : material
      )
    );
    
    try {
      // Make API call
      // await inventoryAPI.materials.updateMaterial(id, data);
    } catch (error) {
      // Revert optimistic update
      set(optimisticMaterialsAtom, currentMaterials);
      throw error;
    }
  }
);

export const createStockEntryAction = atom(
  null,
  async (get, set, data: StockEntry) => {
    // Optimistic update
    const tempStockEntry: StockEntry = {
      ...data,
      id: `temp-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    set(optimisticStockEntriesAtom, prev => [...prev, tempStockEntry]);
    
    try {
      // Make API call
      // await inventoryAPI.stock.createStockEntry(data);
    } catch (error) {
      // Revert optimistic update
      set(optimisticStockEntriesAtom, get(stockEntriesAtom));
      throw error;
    }
  }
);

// Tab data fetching action
export const fetchTabDataAction = atom(
  null,
  async (get, set, tabValue: string) => {
    switch (tabValue) {
      case 'material':
        await set(fetchMaterialsAction);
        break;
      case 'stock':
        await set(fetchStockEntriesAction);
        break;
      case 'sections':
        await set(fetchSectionsAction);
        break;
      case 'menu':
        await set(fetchMenuItemsAction);
        break;
      case 'conversions':
        await set(fetchMaterialsAction); // Reuse materials for conversions
        break;
      default:
        console.log(`No specific data fetching defined for tab: ${tabValue}`);
    }
  }
);
