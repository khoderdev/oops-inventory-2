// import { activeTabAtom, categoryFilterAtom, filteredMaterialsAtom, innerSectionsAtom, lowStockFilterAtom, materialsWithStockAtom, menuItemsAtom, optimisticStockEntriesAtom, searchTermAtom, sectionAssignmentsAtom, sectionsAtom, selectedMaterialAtom, selectedSectionAtom, selectedStockEntryAtom, showMaterialFormAtom, showSectionFormAtom, showStockFormAtom, tabErrorAtom, tabLoadingAtom } from "@/store/inventoryAtoms";
// import { useAtom, useAtomValue, useSetAtom } from "jotai";
// import { useCallback, useEffect } from "react";

// import { addToSpecificEntryAction, addToStockAction, createMaterialAction, createMenuItemAction, createStockEntryAction, deleteMaterialAction, deleteMenuItemAction, deleteStockEntryAction, fetchTabDataAction, recordWasteAction, updateMaterialAction, updateMenuItemAction, updateStockEntryAction, wasteFromSpecificEntryAction } from "@/store/inventoryActions";
// import { AddStockData, MaterialCategory, MaterialWithStock, MenuItem, RecordWasteData, Section, StockEntry, StockFormData, UnitType } from "@/types/inventory";
// import { toast } from "./use-toast";

// // Form data interface
// interface MaterialFormData {
//   name: string;
//   category: MaterialCategory;
//   baseUnit: string;
//   unitType: UnitType;
//   inputUnit: string;
//   packageQuantity?: number;
//   description?: string;
// }

// export function useInventoryStore() {
//   const materialsWithStock = useAtomValue(materialsWithStockAtom);
//   const filteredMaterials = useAtomValue(filteredMaterialsAtom);
//   const stockEntries = useAtomValue(optimisticStockEntriesAtom);
//   const sections = useAtomValue(sectionsAtom);
//   const innerSections = useAtomValue(innerSectionsAtom);
//   const sectionAssignments = useAtomValue(sectionAssignmentsAtom);
//   const menuItems = useAtomValue(menuItemsAtom);
//   const [activeTab, setActiveTab] = useAtom(activeTabAtom);
//   const [searchTerm, setSearchTerm] = useAtom(searchTermAtom);
//   const [categoryFilter, setCategoryFilter] = useAtom(categoryFilterAtom);
//   const [lowStockFilter, setLowStockFilter] = useAtom(lowStockFilterAtom);
//   const [showMaterialForm, setShowMaterialForm] = useAtom(showMaterialFormAtom);
//   const [showStockForm, setShowStockForm] = useAtom(showStockFormAtom);
//   const [showSectionForm, setShowSectionForm] = useAtom(showSectionFormAtom);
//   const [selectedMaterial, setSelectedMaterial] = useAtom(selectedMaterialAtom);
//   const [selectedStockEntry, setSelectedStockEntry] = useAtom(selectedStockEntryAtom);
//   const [selectedSection, setSelectedSection] = useAtom(selectedSectionAtom);
//   const setSelectedSectionTyped = setSelectedSection as (value: Section | null) => void;
//   const setSelectedMaterialTyped = setSelectedMaterial as (value: MaterialWithStock | null) => void;
//   const setShowMaterialFormTyped = setShowMaterialForm as (value: boolean) => void;
//   const setSelectedStockEntryTyped = setSelectedStockEntry as (value: StockEntry | null) => void;
//   const setShowStockFormTyped = setShowStockForm as (value: boolean) => void;
//   const tabLoading = useAtomValue(tabLoadingAtom);
//   const tabError = useAtomValue(tabErrorAtom);
//   const fetchTabData = useSetAtom(fetchTabDataAction);
//   const createMaterial = useSetAtom(createMaterialAction);
//   const updateMaterial = useSetAtom(updateMaterialAction);
//   const deleteMaterial = useSetAtom(deleteMaterialAction);
//   const createStockEntry = useSetAtom(createStockEntryAction);
//   const addToStock = useSetAtom(addToStockAction);
//   const recordWaste = useSetAtom(recordWasteAction);
//   const addToSpecificEntry = useSetAtom(addToSpecificEntryAction);
//   const wasteFromSpecificEntry = useSetAtom(wasteFromSpecificEntryAction);
//   const updateStockEntry = useSetAtom(updateStockEntryAction);
//   const deleteStockEntry = useSetAtom(deleteStockEntryAction);
//   const createMenuItem = useSetAtom(createMenuItemAction);
//   const updateMenuItem = useSetAtom(updateMenuItemAction);
//   const deleteMenuItem = useSetAtom(deleteMenuItemAction);

//   // Initialize data loading on mount and when active tab changes
//   useEffect(() => {
//     // Load data for the current active tab when component mounts or when tab changes
//     fetchTabData(activeTab);
//   }, [activeTab, fetchTabData]);

//   const handleTabChange = useCallback(
//     (value: string) => {
//       setActiveTab(value);
//       // Data will be loaded automatically by the useEffect above
//     },
//     [setActiveTab]
//   );

//   const handleMaterialSubmit = useCallback(
//     async (data: MaterialFormData) => {
//       try {
//         const materialData: MaterialWithStock = {
//           id: selectedMaterial?.id || "",
//           name: data.name,
//           category: data.category,
//           baseUnit: data.baseUnit,
//           unitType: data.unitType,
//           inputUnit: data.inputUnit,
//           costPerUnit: selectedMaterial?.costPerUnit || 0,
//           packageQuantity: data.packageQuantity,
//           description: data.description,
//           createdAt: selectedMaterial?.createdAt || new Date(),
//           updatedAt: new Date(),
//           stockEntries: selectedMaterial?.stockEntries || [],
//           totalQuantityInBaseUnit: selectedMaterial?.totalQuantityInBaseUnit || 0,
//           totalValue: selectedMaterial?.totalValue || 0,
//           averageCostPerBaseUnit: selectedMaterial?.averageCostPerBaseUnit || 0,
//           availableQuantity: selectedMaterial?.availableQuantity || 0
//         };

//         if (selectedMaterial) {
//           await updateMaterial({ id: selectedMaterial.id, data: materialData });
//         } else {
//           await createMaterial(materialData);
//         }
//         setShowMaterialFormTyped(false);
//         setSelectedMaterialTyped(null);
//       } catch (error) {
//         console.error("Failed to submit material:", error);
//       }
//     },
//     [selectedMaterial, updateMaterial, createMaterial, setShowMaterialFormTyped, setSelectedMaterialTyped]
//   );

//   const handleStockSubmit = useCallback(
//     async (data: StockEntry) => {
//       try {
//         if (selectedStockEntry) {
//           await updateStockEntry({ id: selectedStockEntry.id, data });
//         } else {
//           await createStockEntry(data);
//         }

//         // Refresh stock data to ensure materials are updated with new stock information
//         await fetchTabData("stock");

//         toast({
//           title: selectedStockEntry ? "Stock Entry Updated" : "Stock Entry Created",
//           description: selectedStockEntry ? "Stock entry has been updated successfully" : "New stock entry has been created successfully"
//         });

//         setShowStockFormTyped(false);
//         setSelectedStockEntryTyped(null);
//         setSelectedMaterialTyped(null);
//       } catch (error) {
//         console.error("Failed to submit stock entry:", error);
//         // Error is already handled in the action
//       }
//     },
//     [selectedStockEntry, createStockEntry, updateStockEntry, setShowStockFormTyped, setSelectedStockEntryTyped, setSelectedMaterialTyped, fetchTabData]
//   );

//   const handleEditMaterial = useCallback(
//     (material: MaterialWithStock) => {
//       setSelectedMaterialTyped(material);
//       setShowMaterialFormTyped(true);
//     },
//     [setSelectedMaterialTyped, setShowMaterialFormTyped]
//   );

//   const handleEditStockEntry = useCallback(
//     (stockEntry: StockEntry) => {
//       const material = materialsWithStock.find(m => m.id === stockEntry.materialId);
//       setSelectedStockEntryTyped(stockEntry);
//       setSelectedMaterialTyped(material || null);
//       setShowStockFormTyped(true);
//     },
//     [setSelectedStockEntryTyped, setSelectedMaterialTyped, setShowStockFormTyped, materialsWithStock]
//   );

//   const handleAddStock = useCallback(
//     (materialId: string) => {
//       const material = materialsWithStock.find(m => m.id === materialId);
//       setSelectedMaterialTyped(material || null);
//       setShowStockFormTyped(true);
//     },
//     [materialsWithStock, setSelectedMaterialTyped, setShowStockFormTyped]
//   );

//   const handleDeleteMaterial = useCallback(
//     async (id: string) => {
//       try {
//         await deleteMaterial(id);
//       } catch (error) {
//         console.error("Failed to delete material:", error);
//         // Error handling is already done in the action
//       }
//     },
//     [deleteMaterial]
//   );

//   const handleDeleteStockEntry = useCallback(
//     async (id: string) => {
//       try {
//         await deleteStockEntry(id);

//         // Refresh stock data to ensure materials are updated with removed stock information
//         await fetchTabData("stock");

//         toast({
//           title: "Stock Entry Deleted",
//           description: "Stock entry has been removed successfully"
//         });
//       } catch (error) {
//         console.error("Failed to delete stock entry:", error);
//         toast({
//           title: "Error",
//           description: "Failed to delete stock entry",
//           variant: "destructive"
//         });
//         // Error handling is already done in the action
//       }
//     },
//     [deleteStockEntry, fetchTabData]
//   );

//   const handleCreateMenuItem = useCallback(
//     async (data: MenuItem) => {
//       try {
//         await createMenuItem(data);
//       } catch (error) {
//         console.error("Failed to create menu item:", error);
//         // Error handling is already done in the action
//       }
//     },
//     [createMenuItem]
//   );

//   const handleUpdateMenuItem = useCallback(
//     async (id: string, data: MenuItem) => {
//       try {
//         await updateMenuItem({ id, data });
//       } catch (error) {
//         console.error("Failed to update menu item:", error);
//         // Error handling is already done in the action
//       }
//     },
//     [updateMenuItem]
//   );

//   const handleDeleteMenuItem = useCallback(
//     async (id: string) => {
//       try {
//         await deleteMenuItem(id);
//       } catch (error) {
//         console.error("Failed to delete menu item:", error);
//         // Error handling is already done in the action
//       }
//     },
//     [deleteMenuItem]
//   );

//   const handleAddStockOperation = useCallback(
//     async (data: { materialId: string; purchasedQuantity: number; purchasedUnit: string; purchaseDate: Date; notes?: string }) => {
//       try {
//         const addStockData: AddStockData = {
//           materialId: data.materialId,
//           additionalQuantity: data.purchasedQuantity,
//           unit: data.purchasedUnit,
//           additionDate: data.purchaseDate,
//           notes: data.notes
//         };
//         const result = await addToStock(addStockData);

//         // Refresh stock data to ensure materials are updated with new stock information
//         await fetchTabData("stock");

//         toast({
//           title: "Stock Added Successfully",
//           description: `Added ${data.purchasedQuantity} ${data.purchasedUnit} to inventory`
//         });

//         setShowStockFormTyped(false);
//         setSelectedMaterialTyped(null);
//         return result;
//       } catch (error) {
//         console.error("Failed to add stock:", error);
//         throw error;
//       }
//     },
//     [addToStock, setShowStockFormTyped, setSelectedMaterialTyped, fetchTabData]
//   );

//   const handleRecordWasteOperation = useCallback(
//     async (data: { materialId: string; purchasedQuantity: number; purchasedUnit: string; supplier: string; purchaseDate: Date; notes?: string }) => {
//       try {
//         const wasteData: RecordWasteData = {
//           materialId: data.materialId,
//           wasteQuantity: data.purchasedQuantity,
//           unit: data.purchasedUnit,
//           wasteReason: data.supplier, // Using supplier field for waste reason
//           wasteDate: data.purchaseDate,
//           notes: data.notes
//         };
//         const result = await recordWaste(wasteData);

//         // Refresh stock data to ensure materials are updated with new stock information
//         await fetchTabData("stock");

//         toast({
//           title: "Waste Recorded Successfully",
//           description: `Removed ${data.purchasedQuantity} ${data.purchasedUnit} from inventory`
//         });

//         setShowStockFormTyped(false);
//         setSelectedMaterialTyped(null);
//         return result;
//       } catch (error) {
//         console.error("Failed to record waste:", error);
//         throw error;
//       }
//     },
//     [recordWaste, setShowStockFormTyped, setSelectedMaterialTyped, fetchTabData]
//   );

//   const handleAddToSpecificEntryOperation = useCallback(
//     async (data: StockFormData & { stockEntryId?: string }) => {
//       try {
//         if (!data.stockEntryId) {
//           throw new Error("Stock entry ID is required for specific entry operations");
//         }

//         const result = await addToSpecificEntry({
//           entryId: data.stockEntryId,
//           additionalQuantity: data.purchasedQuantity,
//           unit: data.purchasedUnit,
//           additionDate: data.purchaseDate,
//           notes: data.notes
//         });

//         // Refresh stock data to ensure materials are updated with new stock information
//         await fetchTabData("stock");

//         toast({
//           title: "Quantity Added Successfully",
//           description: `Added ${data.purchasedQuantity} ${data.purchasedUnit} to stock entry`
//         });

//         setShowStockFormTyped(false);
//         setSelectedStockEntryTyped(null);
//         setSelectedMaterialTyped(null);
//         return result;
//       } catch (error) {
//         console.error("Failed to add to specific entry:", error);
//         throw error;
//       }
//     },
//     [addToSpecificEntry, setShowStockFormTyped, setSelectedStockEntryTyped, setSelectedMaterialTyped, fetchTabData]
//   );

//   const handleWasteFromSpecificEntryOperation = useCallback(
//     async (data: StockFormData & { stockEntryId?: string }) => {
//       try {
//         if (!data.stockEntryId) {
//           throw new Error("Stock entry ID is required for specific entry operations");
//         }

//         const result = await wasteFromSpecificEntry({
//           entryId: data.stockEntryId,
//           wasteQuantity: data.purchasedQuantity,
//           unit: data.purchasedUnit,
//           wasteReason: data.supplier, // Using supplier field for waste reason
//           wasteDate: data.purchaseDate,
//           notes: data.notes
//         });

//         // Refresh stock data to ensure materials are updated with new stock information
//         await fetchTabData("stock");

//         toast({
//           title: "Waste Recorded Successfully",
//           description: `Removed ${data.purchasedQuantity} ${data.purchasedUnit} from stock entry`
//         });

//         setShowStockFormTyped(false);
//         setSelectedStockEntryTyped(null);
//         setSelectedMaterialTyped(null);
//         return result;
//       } catch (error) {
//         console.error("Failed to record waste from specific entry:", error);
//         throw error;
//       }
//     },
//     [wasteFromSpecificEntry, setShowStockFormTyped, setSelectedStockEntryTyped, setSelectedMaterialTyped, fetchTabData]
//   );

//   return {
//     materialsWithStock,
//     filteredMaterials,
//     stockEntries,
//     sections,
//     innerSections,
//     sectionAssignments,
//     menuItems,
//     activeTab,
//     searchTerm,
//     categoryFilter,
//     lowStockFilter,
//     setSearchTerm,
//     setCategoryFilter,
//     setLowStockFilter,
//     showMaterialForm,
//     showStockForm,
//     showSectionForm,
//     selectedMaterial,
//     selectedStockEntry,
//     selectedSection,
//     setShowMaterialForm,
//     setShowStockForm,
//     setShowSectionForm,
//     setSelectedMaterial: setSelectedMaterialTyped,
//     setSelectedStockEntry: setSelectedStockEntryTyped,
//     setSelectedSection: setSelectedSectionTyped,
//     tabLoading,
//     tabError,
//     handleTabChange,
//     handleMaterialSubmit,
//     handleStockSubmit,
//     handleEditMaterial,
//     handleEditStockEntry,
//     handleAddStock,
//     handleDeleteMaterial,
//     handleDeleteStockEntry,
//     handleCreateMenuItem,
//     handleUpdateMenuItem,
//     handleDeleteMenuItem,
//     handleAddStockOperation,
//     handleRecordWasteOperation,
//     handleAddToSpecificEntryOperation,
//     handleWasteFromSpecificEntryOperation,
//     fetchTabData
//   };
// }

// export function useInventoryFilters() {
//   const [searchTerm, setSearchTerm] = useAtom(searchTermAtom);
//   const [categoryFilter, setCategoryFilter] = useAtom(categoryFilterAtom);
//   const [lowStockFilter, setLowStockFilter] = useAtom(lowStockFilterAtom);

//   return {
//     searchTerm,
//     categoryFilter,
//     lowStockFilter,
//     setSearchTerm,
//     setCategoryFilter,
//     setLowStockFilter
//   };
// }

// export function useInventoryLoading() {
//   const tabLoading = useAtomValue(tabLoadingAtom);
//   const tabError = useAtomValue(tabErrorAtom);

//   return {
//     tabLoading,
//     tabError
//   };
// }

import { addToSpecificEntryAction, addToStockAction, createMaterialAction, createMenuItemAction, createStockEntryAction, createTableAction, deleteMaterialAction, deleteMenuItemAction, deleteStockEntryAction, deleteTableAction, fetchTabDataAction, recordWasteAction, updateMaterialAction, updateMenuItemAction, updateStockEntryAction, updateTableAction, wasteFromSpecificEntryAction } from "@/store/inventoryActions";
import { activeTabAtom, categoryFilterAtom, filteredMaterialsAtom, innerSectionsAtom, lowStockFilterAtom, materialsWithStockAtom, menuItemsAtom, optimisticStockEntriesAtom, searchTermAtom, sectionAssignmentsAtom, sectionsAtom, selectedMaterialAtom, selectedSectionAtom, selectedStockEntryAtom, showMaterialFormAtom, showSectionFormAtom, showStockFormAtom, tabErrorAtom, tabLoadingAtom, tablesAtom } from "@/store/inventoryAtoms";
import { AddStockData, MaterialCategory, MaterialWithStock, MenuItem, RecordWasteData, Section, StockEntry, StockFormData, UnitType } from "@/types/inventory";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { useCallback, useEffect } from "react";
import { toast } from "./use-toast";

// Form data interface
interface MaterialFormData {
  name: string;
  category: MaterialCategory;
  baseUnit: string;
  unitType: UnitType;
  inputUnit: string;
  packageQuantity?: number;
  description?: string;
}

export function useInventoryStore() {
  const materialsWithStock = useAtomValue(materialsWithStockAtom);
  const filteredMaterials = useAtomValue(filteredMaterialsAtom);
  const stockEntries = useAtomValue(optimisticStockEntriesAtom);
  const sections = useAtomValue(sectionsAtom);
  const innerSections = useAtomValue(innerSectionsAtom);
  const sectionAssignments = useAtomValue(sectionAssignmentsAtom);
  const menuItems = useAtomValue(menuItemsAtom);
  const tables = useAtomValue(tablesAtom);
  const [activeTab, setActiveTab] = useAtom(activeTabAtom);
  const [searchTerm, setSearchTerm] = useAtom(searchTermAtom);
  const [categoryFilter, setCategoryFilter] = useAtom(categoryFilterAtom);
  const [lowStockFilter, setLowStockFilter] = useAtom(lowStockFilterAtom);
  const [showMaterialForm, setShowMaterialForm] = useAtom(showMaterialFormAtom);
  const [showStockForm, setShowStockForm] = useAtom(showStockFormAtom);
  const [showSectionForm, setShowSectionForm] = useAtom(showSectionFormAtom);
  const [selectedMaterial, setSelectedMaterial] = useAtom(selectedMaterialAtom);
  const [selectedStockEntry, setSelectedStockEntry] = useAtom(selectedStockEntryAtom);
  const [selectedSection, setSelectedSection] = useAtom(selectedSectionAtom);
  const setSelectedSectionTyped = setSelectedSection as (value: Section | null) => void;
  const setSelectedMaterialTyped = setSelectedMaterial as (value: MaterialWithStock | null) => void;
  const setShowMaterialFormTyped = setShowMaterialForm as (value: boolean) => void;
  const setSelectedStockEntryTyped = setSelectedStockEntry as (value: StockEntry | null) => void;
  const setShowStockFormTyped = setShowStockForm as (value: boolean) => void;
  const tabLoading = useAtomValue(tabLoadingAtom);
  const tabError = useAtomValue(tabErrorAtom);
  const fetchTabData = useSetAtom(fetchTabDataAction);
  const createMaterial = useSetAtom(createMaterialAction);
  const updateMaterial = useSetAtom(updateMaterialAction);
  const deleteMaterial = useSetAtom(deleteMaterialAction);
  const createStockEntry = useSetAtom(createStockEntryAction);
  const addToStock = useSetAtom(addToStockAction);
  const recordWaste = useSetAtom(recordWasteAction);
  const addToSpecificEntry = useSetAtom(addToSpecificEntryAction);
  const wasteFromSpecificEntry = useSetAtom(wasteFromSpecificEntryAction);
  const updateStockEntry = useSetAtom(updateStockEntryAction);
  const deleteStockEntry = useSetAtom(deleteStockEntryAction);
  const createMenuItem = useSetAtom(createMenuItemAction);
  const updateMenuItem = useSetAtom(updateMenuItemAction);
  const deleteMenuItem = useSetAtom(deleteMenuItemAction);
  const createTable = useSetAtom(createTableAction);
  const updateTable = useSetAtom(updateTableAction);
  const deleteTable = useSetAtom(deleteTableAction);

  // Initialize data loading on mount and when active tab changes
  useEffect(() => {
    fetchTabData(activeTab);
  }, [activeTab, fetchTabData]);

  const handleTabChange = useCallback(
    (value: string) => {
      setActiveTab(value);
    },
    [setActiveTab]
  );

  const handleMaterialSubmit = useCallback(
    async (data: MaterialFormData) => {
      try {
        const materialData: MaterialWithStock = {
          id: selectedMaterial?.id || "",
          name: data.name,
          category: data.category,
          baseUnit: data.baseUnit,
          unitType: data.unitType,
          inputUnit: data.inputUnit,
          costPerUnit: selectedMaterial?.costPerUnit || 0,
          packageQuantity: data.packageQuantity,
          description: data.description,
          createdAt: selectedMaterial?.createdAt || new Date(),
          updatedAt: new Date(),
          stockEntries: selectedMaterial?.stockEntries || [],
          totalQuantityInBaseUnit: selectedMaterial?.totalQuantityInBaseUnit || 0,
          totalValue: selectedMaterial?.totalValue || 0,
          averageCostPerBaseUnit: selectedMaterial?.averageCostPerBaseUnit || 0,
          availableQuantity: selectedMaterial?.availableQuantity || 0
        };

        if (selectedMaterial) {
          await updateMaterial({ id: selectedMaterial.id, data: materialData });
        } else {
          await createMaterial(materialData);
        }
        setShowMaterialFormTyped(false);
        setSelectedMaterialTyped(null);
        toast({
          title: selectedMaterial ? "Material Updated" : "Material Created",
          description: selectedMaterial ? "Material has been updated successfully" : "New material has been created successfully"
        });
      } catch (error) {
        console.error("Failed to submit material:", error);
        toast({
          title: "Error",
          description: "Failed to submit material",
          variant: "destructive"
        });
      }
    },
    [selectedMaterial, updateMaterial, createMaterial, setShowMaterialFormTyped, setSelectedMaterialTyped]
  );

  const handleStockSubmit = useCallback(
    async (data: StockEntry) => {
      try {
        if (selectedStockEntry) {
          await updateStockEntry({ id: selectedStockEntry.id, data });
        } else {
          await createStockEntry(data);
        }
        await fetchTabData("stock");
        toast({
          title: selectedStockEntry ? "Stock Entry Updated" : "Stock Entry Created",
          description: selectedStockEntry ? "Stock entry has been updated successfully" : "New stock entry has been created successfully"
        });
        setShowStockFormTyped(false);
        setSelectedStockEntryTyped(null);
        setSelectedMaterialTyped(null);
      } catch (error) {
        console.error("Failed to submit stock entry:", error);
        toast({
          title: "Error",
          description: "Failed to submit stock entry",
          variant: "destructive"
        });
      }
    },
    [selectedStockEntry, createStockEntry, updateStockEntry, setShowStockFormTyped, setSelectedStockEntryTyped, setSelectedMaterialTyped, fetchTabData]
  );

  const handleEditMaterial = useCallback(
    (material: MaterialWithStock) => {
      setSelectedMaterialTyped(material);
      setShowMaterialFormTyped(true);
    },
    [setSelectedMaterialTyped, setShowMaterialFormTyped]
  );

  const handleEditStockEntry = useCallback(
    (stockEntry: StockEntry) => {
      const material = materialsWithStock.find(m => m.id === stockEntry.materialId);
      setSelectedStockEntryTyped(stockEntry);
      setSelectedMaterialTyped(material || null);
      setShowStockFormTyped(true);
    },
    [setSelectedStockEntryTyped, setSelectedMaterialTyped, setShowStockFormTyped, materialsWithStock]
  );

  const handleAddStock = useCallback(
    (materialId: string) => {
      const material = materialsWithStock.find(m => m.id === materialId);
      setSelectedMaterialTyped(material || null);
      setShowStockFormTyped(true);
    },
    [materialsWithStock, setSelectedMaterialTyped, setShowStockFormTyped]
  );

  const handleDeleteMaterial = useCallback(
    async (id: string) => {
      try {
        await deleteMaterial(id);
        toast({
          title: "Material Deleted",
          description: "Material has been removed successfully"
        });
      } catch (error) {
        console.error("Failed to delete material:", error);
        toast({
          title: "Error",
          description: "Failed to delete material",
          variant: "destructive"
        });
      }
    },
    [deleteMaterial]
  );

  const handleDeleteStockEntry = useCallback(
    async (id: string) => {
      try {
        await deleteStockEntry(id);
        await fetchTabData("stock");
        toast({
          title: "Stock Entry Deleted",
          description: "Stock entry has been removed successfully"
        });
      } catch (error) {
        console.error("Failed to delete stock entry:", error);
        toast({
          title: "Error",
          description: "Failed to delete stock entry",
          variant: "destructive"
        });
      }
    },
    [deleteStockEntry, fetchTabData]
  );

  const handleCreateMenuItem = useCallback(
    async (data: MenuItem) => {
      try {
        await createMenuItem(data);
        toast({
          title: "Menu Item Created",
          description: "New menu item has been created successfully"
        });
      } catch (error) {
        console.error("Failed to create menu item:", error);
        toast({
          title: "Error",
          description: "Failed to create menu item",
          variant: "destructive"
        });
      }
    },
    [createMenuItem]
  );

  const handleUpdateMenuItem = useCallback(
    async (id: string, data: MenuItem) => {
      try {
        await updateMenuItem({ id, data });
        toast({
          title: "Menu Item Updated",
          description: "Menu item has been updated successfully"
        });
      } catch (error) {
        console.error("Failed to update menu item:", error);
        toast({
          title: "Error",
          description: "Failed to update menu item",
          variant: "destructive"
        });
      }
    },
    [updateMenuItem]
  );

  const handleDeleteMenuItem = useCallback(
    async (id: string) => {
      try {
        await deleteMenuItem(id);
        toast({
          title: "Menu Item Deleted",
          description: "Menu item has been removed successfully"
        });
      } catch (error) {
        console.error("Failed to delete menu item:", error);
        toast({
          title: "Error",
          description: "Failed to delete menu item",
          variant: "destructive"
        });
      }
    },
    [deleteMenuItem]
  );

  const handleAddStockOperation = useCallback(
    async (data: { materialId: string; purchasedQuantity: number; purchasedUnit: string; purchaseDate: Date; notes?: string }) => {
      try {
        const addStockData: AddStockData = {
          materialId: data.materialId,
          additionalQuantity: data.purchasedQuantity,
          unit: data.purchasedUnit,
          additionDate: data.purchaseDate,
          notes: data.notes
        };
        const result = await addToStock(addStockData);
        await fetchTabData("stock");
        toast({
          title: "Stock Added Successfully",
          description: `Added ${data.purchasedQuantity} ${data.purchasedUnit} to inventory`
        });
        setShowStockFormTyped(false);
        setSelectedMaterialTyped(null);
        return result;
      } catch (error) {
        console.error("Failed to add stock:", error);
        toast({
          title: "Error",
          description: "Failed to add stock",
          variant: "destructive"
        });
        throw error;
      }
    },
    [addToStock, setShowStockFormTyped, setSelectedMaterialTyped, fetchTabData]
  );

  const handleRecordWasteOperation = useCallback(
    async (data: { materialId: string; purchasedQuantity: number; purchasedUnit: string; supplier: string; purchaseDate: Date; notes?: string }) => {
      try {
        const wasteData: RecordWasteData = {
          materialId: data.materialId,
          wasteQuantity: data.purchasedQuantity,
          unit: data.purchasedUnit,
          wasteReason: data.supplier,
          wasteDate: data.purchaseDate,
          notes: data.notes
        };
        const result = await recordWaste(wasteData);
        await fetchTabData("stock");
        toast({
          title: "Waste Recorded Successfully",
          description: `Removed ${data.purchasedQuantity} ${data.purchasedUnit} from inventory`
        });
        setShowStockFormTyped(false);
        setSelectedMaterialTyped(null);
        return result;
      } catch (error) {
        console.error("Failed to record waste:", error);
        toast({
          title: "Error",
          description: "Failed to record waste",
          variant: "destructive"
        });
        throw error;
      }
    },
    [recordWaste, setShowStockFormTyped, setSelectedMaterialTyped, fetchTabData]
  );

  const handleAddToSpecificEntryOperation = useCallback(
    async (data: StockFormData & { stockEntryId?: string }) => {
      try {
        if (!data.stockEntryId) {
          throw new Error("Stock entry ID is required for specific entry operations");
        }
        const result = await addToSpecificEntry({
          entryId: data.stockEntryId,
          additionalQuantity: data.purchasedQuantity,
          unit: data.purchasedUnit,
          additionDate: data.purchaseDate,
          notes: data.notes
        });
        await fetchTabData("stock");
        toast({
          title: "Quantity Added Successfully",
          description: `Added ${data.purchasedQuantity} ${data.purchasedUnit} to stock entry`
        });
        setShowStockFormTyped(false);
        setSelectedStockEntryTyped(null);
        setSelectedMaterialTyped(null);
        return result;
      } catch (error) {
        console.error("Failed to add to specific entry:", error);
        toast({
          title: "Error",
          description: "Failed to add to specific entry",
          variant: "destructive"
        });
        throw error;
      }
    },
    [addToSpecificEntry, setShowStockFormTyped, setSelectedStockEntryTyped, setSelectedMaterialTyped, fetchTabData]
  );

  const handleWasteFromSpecificEntryOperation = useCallback(
    async (data: StockFormData & { stockEntryId?: string }) => {
      try {
        if (!data.stockEntryId) {
          throw new Error("Stock entry ID is required for specific entry operations");
        }
        const result = await wasteFromSpecificEntry({
          entryId: data.stockEntryId,
          wasteQuantity: data.purchasedQuantity,
          unit: data.purchasedUnit,
          wasteReason: data.supplier,
          wasteDate: data.purchaseDate,
          notes: data.notes
        });
        await fetchTabData("stock");
        toast({
          title: "Waste Recorded Successfully",
          description: `Removed ${data.purchasedQuantity} ${data.purchasedUnit} from stock entry`
        });
        setShowStockFormTyped(false);
        setSelectedStockEntryTyped(null);
        setSelectedMaterialTyped(null);
        return result;
      } catch (error) {
        console.error("Failed to record waste from specific entry:", error);
        toast({
          title: "Error",
          description: "Failed to record waste from specific entry",
          variant: "destructive"
        });
        throw error;
      }
    },
    [wasteFromSpecificEntry, setShowStockFormTyped, setSelectedStockEntryTyped, setSelectedMaterialTyped, fetchTabData]
  );

  return {
    materialsWithStock,
    filteredMaterials,
    stockEntries,
    sections,
    innerSections,
    sectionAssignments,
    menuItems,
    tables,
    activeTab,
    searchTerm,
    categoryFilter,
    lowStockFilter,
    setSearchTerm,
    setCategoryFilter,
    setLowStockFilter,
    showMaterialForm,
    showStockForm,
    showSectionForm,
    selectedMaterial,
    selectedStockEntry,
    selectedSection,
    setShowMaterialForm,
    setShowStockForm,
    setShowSectionForm,
    setSelectedMaterial: setSelectedMaterialTyped,
    setSelectedStockEntry: setSelectedStockEntryTyped,
    setSelectedSection: setSelectedSectionTyped,
    tabLoading,
    tabError,
    handleTabChange,
    handleMaterialSubmit,
    handleStockSubmit,
    handleEditMaterial,
    handleEditStockEntry,
    handleAddStock,
    handleDeleteMaterial,
    handleDeleteStockEntry,
    handleCreateMenuItem,
    handleUpdateMenuItem,
    handleDeleteMenuItem,
    handleAddStockOperation,
    handleRecordWasteOperation,
    handleAddToSpecificEntryOperation,
    handleWasteFromSpecificEntryOperation,
    fetchTabData,
    createTable,
    updateTable,
    deleteTable
  };
}

export function useInventoryFilters() {
  const [searchTerm, setSearchTerm] = useAtom(searchTermAtom);
  const [categoryFilter, setCategoryFilter] = useAtom(categoryFilterAtom);
  const [lowStockFilter, setLowStockFilter] = useAtom(lowStockFilterAtom);

  return {
    searchTerm,
    categoryFilter,
    lowStockFilter,
    setSearchTerm,
    setCategoryFilter,
    setLowStockFilter
  };
}

export function useInventoryLoading() {
  const tabLoading = useAtomValue(tabLoadingAtom);
  const tabError = useAtomValue(tabErrorAtom);

  return {
    tabLoading,
    tabError
  };
}
