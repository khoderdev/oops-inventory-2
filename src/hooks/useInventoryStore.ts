import { activeTabAtom, categoryFilterAtom, filteredMaterialsAtom, lowStockFilterAtom, materialsWithStockAtom, menuItemsAtom, optimisticStockEntriesAtom, searchTermAtom, sectionAssignmentsAtom, sectionsAtom, selectedMaterialAtom, selectedSectionAtom, selectedStockEntryAtom, showMaterialFormAtom, showSectionFormAtom, showStockFormAtom, tabErrorAtom, tabLoadingAtom } from "@/store/inventoryAtoms";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { useCallback } from "react";

import { createMaterialAction, createStockEntryAction, deleteMaterialAction, fetchTabDataAction, updateMaterialAction } from "@/store/inventoryActions";
import { MaterialCategory, MaterialWithStock, StockEntry, UnitType } from "@/types/inventory";

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

  const handleTabChange = useCallback(
    (value: string) => {
      setActiveTab(value);
      fetchTabData(value);
    },
    [setActiveTab, fetchTabData]
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
    (data: StockEntry) => {
      try {
        if (selectedStockEntry) {
          // await updateStockEntry({ id: selectedStockEntry.id, data });
        } else {
          createStockEntry(data);
        }
        setShowStockFormTyped(false);
        setSelectedStockEntryTyped(null);
      } catch (error) {
        // Error is already handled in the action
      }
    },
    [selectedStockEntry, createStockEntry, setShowStockFormTyped, setSelectedStockEntryTyped]
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
      setSelectedStockEntryTyped(stockEntry);
      setShowStockFormTyped(true);
    },
    [setSelectedStockEntryTyped, setShowStockFormTyped]
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
    tabLoading,
    tabError,
    handleTabChange,
    handleMaterialSubmit,
    handleStockSubmit,
    handleEditMaterial,
    handleEditStockEntry,
    handleAddStock,
    handleDeleteMaterial,
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
