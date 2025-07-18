import {
  // UI state atoms
  activeTabAtom,
  categoryFilterAtom,
  filteredMaterialsAtom,
  lowStockFilterAtom,
  // Data atoms
  materialsWithStockAtom,
  menuItemsAtom,
  optimisticStockEntriesAtom,
  searchTermAtom,
  sectionAssignmentsAtom,
  sectionsAtom,
  selectedMaterialAtom,
  selectedSectionAtom,
  selectedStockEntryAtom,
  // Form state atoms
  showMaterialFormAtom,
  showSectionFormAtom,
  showStockFormAtom,
  // Loading atoms
  tabLoadingAtom,
  tabErrorAtom
} from "@/store/inventoryAtoms";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { useCallback } from "react";

import { createMaterialAction, createStockEntryAction, fetchTabDataAction, updateMaterialAction } from "@/store/inventoryActions";
import { MaterialWithStock, StockEntry } from "@/types/inventory";

// Main inventory store hook
export function useInventoryStore() {
  // Data
  const materialsWithStock = useAtomValue(materialsWithStockAtom);
  const filteredMaterials = useAtomValue(filteredMaterialsAtom);
  const stockEntries = useAtomValue(optimisticStockEntriesAtom);
  const sections = useAtomValue(sectionsAtom);
  const sectionAssignments = useAtomValue(sectionAssignmentsAtom);
  const menuItems = useAtomValue(menuItemsAtom);

  // UI state
  const [activeTab, setActiveTab] = useAtom(activeTabAtom);
  const [searchTerm, setSearchTerm] = useAtom(searchTermAtom);
  const [categoryFilter, setCategoryFilter] = useAtom(categoryFilterAtom);
  const [lowStockFilter, setLowStockFilter] = useAtom(lowStockFilterAtom);

  // Form state
  const [showMaterialForm, setShowMaterialForm] = useAtom(showMaterialFormAtom);
  const [showStockForm, setShowStockForm] = useAtom(showStockFormAtom);
  const [showSectionForm, setShowSectionForm] = useAtom(showSectionFormAtom);
  const [selectedMaterial, setSelectedMaterial] = useAtom(selectedMaterialAtom);
  const [selectedStockEntry, setSelectedStockEntry] = useAtom(selectedStockEntryAtom);
  const [selectedSection, setSelectedSection] = useAtom(selectedSectionAtom);

  // Loading states
  const tabLoading = useAtomValue(tabLoadingAtom);
  const tabError = useAtomValue(tabErrorAtom);

  // Actions
  const fetchTabData = useSetAtom(fetchTabDataAction);
  const createMaterial = useSetAtom(createMaterialAction);
  const updateMaterial = useSetAtom(updateMaterialAction);
  const createStockEntry = useSetAtom(createStockEntryAction);

  // Tab change handler
  const handleTabChange = useCallback(
    (value: string) => {
      setActiveTab(value);
      fetchTabData(value);
    },
    [setActiveTab, fetchTabData]
  );

  // Form handlers
  const handleMaterialSubmit = useCallback(
    (data: MaterialWithStock) => {
      try {
        if (selectedMaterial) {
          updateMaterial({ id: selectedMaterial.id, data });
        } else {
          createMaterial(data);
        }
        setShowMaterialForm(false);
        setSelectedMaterial(null);
      } catch (error) {
        // Error is already handled in the action
      }
    },
    [selectedMaterial, updateMaterial, createMaterial, setShowMaterialForm, setSelectedMaterial]
  );

  const handleStockSubmit = useCallback(
    (data: StockEntry) => {
      try {
        if (selectedStockEntry) {
          // await updateStockEntry({ id: selectedStockEntry.id, data });
        } else {
          createStockEntry(data);
        }
        setShowStockForm(false);
        setSelectedStockEntry(null);
      } catch (error) {
        // Error is already handled in the action
      }
    },
    [selectedStockEntry, createStockEntry, setShowStockForm, setSelectedStockEntry]
  );

  const handleEditMaterial = useCallback(
    (material: MaterialWithStock) => {
      setSelectedMaterial(material);
      setShowMaterialForm(true);
    },
    [setSelectedMaterial, setShowMaterialForm]
  );

  const handleEditStockEntry = useCallback(
    (stockEntry: StockEntry) => {
      setSelectedStockEntry(stockEntry);
      setShowStockForm(true);
    },
    [setSelectedStockEntry, setShowStockForm]
  );

  const handleAddStock = useCallback(
    (materialId: string) => {
      const material = materialsWithStock.find(m => m.id === materialId);
      setSelectedMaterial(material || null);
      setShowStockForm(true);
    },
    [materialsWithStock, setSelectedMaterial, setShowStockForm]
  );

  return {
    // Data
    materialsWithStock,
    filteredMaterials,
    stockEntries,
    sections,
    sectionAssignments,
    menuItems,

    // UI state
    activeTab,
    searchTerm,
    categoryFilter,
    lowStockFilter,
    setSearchTerm,
    setCategoryFilter,
    setLowStockFilter,

    // Form state
    showMaterialForm,
    showStockForm,
    showSectionForm,
    selectedMaterial,
    selectedStockEntry,
    selectedSection,
    setShowMaterialForm,
    setShowStockForm,
    setShowSectionForm,

    // Loading states
    tabLoading,
    tabError,

    // Handlers
    handleTabChange,
    handleMaterialSubmit,
    handleStockSubmit,
    handleEditMaterial,
    handleEditStockEntry,
    handleAddStock,

    // Actions
    fetchTabData
  };
}

// Specialized hooks for specific components
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
