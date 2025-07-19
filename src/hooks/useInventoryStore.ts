import { activeTabAtom, categoryFilterAtom, filteredMaterialsAtom, lowStockFilterAtom, materialsWithStockAtom, menuItemsAtom, optimisticStockEntriesAtom, searchTermAtom, sectionAssignmentsAtom, sectionsAtom, selectedMaterialAtom, selectedSectionAtom, selectedStockEntryAtom, showMaterialFormAtom, showSectionFormAtom, showStockFormAtom, tabErrorAtom, tabLoadingAtom } from "@/store/inventoryAtoms";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { useCallback, useEffect } from "react";

import { createMaterialAction, createMenuItemAction, createStockEntryAction, deleteMaterialAction, deleteMenuItemAction, deleteStockEntryAction, fetchTabDataAction, updateMaterialAction, updateMenuItemAction, updateStockEntryAction } from "@/store/inventoryActions";
import { MaterialCategory, MaterialWithStock, MenuItem, Section, StockEntry, UnitType } from "@/types/inventory";

// Form data interface
interface MaterialFormData {
  name: string;
  category: MaterialCategory;
  baseUnit: string;
  unitType: UnitType;
  inputUnit: string;
  costPerBaseUnit: number;
  packageQuantity?: number;
  description?: string;
}

export function useInventoryStore() {
  const materialsWithStock = useAtomValue(materialsWithStockAtom);
  const filteredMaterials = useAtomValue(filteredMaterialsAtom);
  const stockEntries = useAtomValue(optimisticStockEntriesAtom);
  const sections = useAtomValue(sectionsAtom);
  const sectionAssignments = useAtomValue(sectionAssignmentsAtom);
  const menuItems = useAtomValue(menuItemsAtom);
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
  const updateStockEntry = useSetAtom(updateStockEntryAction);
  const deleteStockEntry = useSetAtom(deleteStockEntryAction);
  const createMenuItem = useSetAtom(createMenuItemAction);
  const updateMenuItem = useSetAtom(updateMenuItemAction);
  const deleteMenuItem = useSetAtom(deleteMenuItemAction);

  // Initialize data loading on mount and when active tab changes
  useEffect(() => {
    // Load data for the current active tab when component mounts or when tab changes
    fetchTabData(activeTab);
  }, [activeTab, fetchTabData]);

  const handleTabChange = useCallback(
    (value: string) => {
      setActiveTab(value);
      // Data will be loaded automatically by the useEffect above
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
          costPerUnit: data.costPerBaseUnit,
          costPerBaseUnit: data.costPerBaseUnit,
          packageQuantity: data.packageQuantity,
          description: data.description,
          createdAt: selectedMaterial?.createdAt || new Date(),
          updatedAt: new Date(),
          stockEntries: selectedMaterial?.stockEntries || [],
          totalQuantityInBaseUnit: selectedMaterial?.totalQuantityInBaseUnit || 0,
          totalValue: selectedMaterial?.totalValue || 0,
          averageCostPerBaseUnit: data.costPerBaseUnit || 0,
          availableQuantity: selectedMaterial?.availableQuantity || 0
        };

        if (selectedMaterial) {
          await updateMaterial({ id: selectedMaterial.id, data: materialData });
        } else {
          await createMaterial(materialData);
        }
        setShowMaterialFormTyped(false);
        setSelectedMaterialTyped(null);
      } catch (error) {
        console.error("Failed to submit material:", error);
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
        setShowStockFormTyped(false);
        setSelectedStockEntryTyped(null);
        setSelectedMaterialTyped(null);
      } catch (error) {
        console.error('Failed to submit stock entry:', error);
        // Error is already handled in the action
      }
    },
    [selectedStockEntry, createStockEntry, updateStockEntry, setShowStockFormTyped, setSelectedStockEntryTyped, setSelectedMaterialTyped]
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
      } catch (error) {
        console.error('Failed to delete material:', error);
        // Error handling is already done in the action
      }
    },
    [deleteMaterial]
  );

  const handleDeleteStockEntry = useCallback(
    async (id: string) => {
      try {
        await deleteStockEntry(id);
      } catch (error) {
        console.error('Failed to delete stock entry:', error);
        // Error handling is already done in the action
      }
    },
    [deleteStockEntry]
  );

  const handleCreateMenuItem = useCallback(
    async (data: MenuItem) => {
      try {
        await createMenuItem(data);
      } catch (error) {
        console.error('Failed to create menu item:', error);
        // Error handling is already done in the action
      }
    },
    [createMenuItem]
  );

  const handleUpdateMenuItem = useCallback(
    async (id: string, data: MenuItem) => {
      try {
        await updateMenuItem({ id, data });
      } catch (error) {
        console.error('Failed to update menu item:', error);
        // Error handling is already done in the action
      }
    },
    [updateMenuItem]
  );

  const handleDeleteMenuItem = useCallback(
    async (id: string) => {
      try {
        await deleteMenuItem(id);
      } catch (error) {
        console.error('Failed to delete menu item:', error);
        // Error handling is already done in the action
      }
    },
    [deleteMenuItem]
  );

  return {
    materialsWithStock,
    filteredMaterials,
    stockEntries,
    sections,
    sectionAssignments,
    menuItems,
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
    fetchTabData
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
