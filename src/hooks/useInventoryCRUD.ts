import { inventoryAPI } from "@/api/inventory.api";
import { CreateMaterialData, CreateMenuItemData, CreateSectionAssignmentData, CreateSectionData, CreateStockEntryData, Material, MenuItem, Section, SectionAssignment, StockEntry, UpdateMaterialData, UpdateMenuItemData, UpdateSectionAssignmentData, UpdateSectionData, UpdateStockEntryData } from "@/types/inventory";
import { useState } from "react";

export const useInventoryCRUD = (refetch: () => void) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleError = (error: unknown) => {
    const message = error instanceof Error ? error.message : "An error occurred";
    setError(message);
    console.error("Inventory CRUD Error:", error);
    throw new Error(message);
  };

  // Materials CRUD
  const createMaterial = async (data: CreateMaterialData): Promise<Material> => {
    try {
      setLoading(true);
      setError(null);
      const response = await inventoryAPI.materials.createMaterial(data);
      refetch();
      return {
        ...response.data,
        id: response.data.id.toString(),
        createdAt: new Date(),
        updatedAt: new Date()
      };
    } catch (error) {
      handleError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateMaterial = async (id: string, data: UpdateMaterialData): Promise<Material> => {
    try {
      setLoading(true);
      setError(null);
      const response = await inventoryAPI.materials.updateMaterial(id, data);
      refetch();
      return {
        ...response.data,
        id: response.data.id.toString(),
        updatedAt: new Date()
      };
    } catch (error) {
      handleError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const deleteMaterial = async (id: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      await inventoryAPI.materials.deleteMaterial(id);
      refetch();
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  };

  // Stock Entries CRUD
  const createStockEntry = async (data: CreateStockEntryData): Promise<StockEntry> => {
    try {
      setLoading(true);
      setError(null);
      const response = await inventoryAPI.stock.createStockEntry(data);
      refetch();
      return {
        ...response.data,
        id: response.data.id.toString(),
        materialId: response.data.materialId.toString(),
        purchaseDate: new Date(response.data.purchaseDate),
        expiryDate: response.data.expiryDate ? new Date(response.data.expiryDate) : undefined,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    } catch (error) {
      handleError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateStockEntry = async (id: string, data: UpdateStockEntryData): Promise<StockEntry> => {
    try {
      setLoading(true);
      setError(null);
      const response = await inventoryAPI.stock.updateStockEntry(id, data);
      refetch();
      return {
        ...response.data,
        id: response.data.id.toString(),
        materialId: response.data.materialId.toString(),
        purchaseDate: new Date(response.data.purchaseDate),
        expiryDate: response.data.expiryDate ? new Date(response.data.expiryDate) : undefined,
        updatedAt: new Date()
      };
    } catch (error) {
      handleError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const deleteStockEntry = async (id: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      await inventoryAPI.stock.deleteStockEntry(id);
      refetch();
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  };

  // Menu Items CRUD
  const createMenuItem = async (data: CreateMenuItemData): Promise<MenuItem> => {
    try {
      setLoading(true);
      setError(null);
      const response = await inventoryAPI.menu.createMenuItem(data);
      refetch();
      return {
        ...response.data,
        id: response.data.id.toString(),
        createdAt: new Date(),
        updatedAt: new Date()
      };
    } catch (error) {
      handleError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateMenuItem = async (id: string, data: UpdateMenuItemData): Promise<MenuItem> => {
    try {
      setLoading(true);
      setError(null);
      const response = await inventoryAPI.menu.updateMenuItem(id, data);
      refetch();
      return {
        ...response.data,
        id: response.data.id.toString(),
        updatedAt: new Date()
      };
    } catch (error) {
      handleError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const deleteMenuItem = async (id: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      await inventoryAPI.menu.deleteMenuItem(id);
      refetch();
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  };

  // Sections CRUD
  const createSection = async (data: CreateSectionData): Promise<Section> => {
    try {
      setLoading(true);
      setError(null);
      const response = await inventoryAPI.sections.createSection(data);
      refetch();
      return {
        ...response.data,
        id: response.data.id.toString(),
        createdAt: new Date(),
        updatedAt: new Date()
      };
    } catch (error) {
      handleError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateSection = async (id: string, data: UpdateSectionData): Promise<Section> => {
    try {
      setLoading(true);
      setError(null);
      const response = await inventoryAPI.sections.updateSection(id, data);
      refetch();
      return {
        ...response.data,
        id: response.data.id.toString(),
        updatedAt: new Date()
      };
    } catch (error) {
      handleError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const deleteSection = async (id: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      await inventoryAPI.sections.deleteSection(id);
      refetch();
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  };

  // Assignments CRUD
  const createAssignment = async (data: CreateSectionAssignmentData): Promise<SectionAssignment> => {
    try {
      setLoading(true);
      setError(null);
      const response = await inventoryAPI.assignments.createAssignment(data);
      refetch();
      return {
        ...response.data,
        id: response.data.id.toString(),
        sectionId: response.data.sectionId.toString(),
        materialId: response.data.materialId?.toString(),
        menuItemId: response.data.menuItemId?.toString(),
        stockEntryId: response.data.stockEntryId?.toString(),
        createdAt: new Date(),
        updatedAt: new Date()
      };
    } catch (error) {
      handleError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateAssignment = async (id: string, data: UpdateSectionAssignmentData): Promise<SectionAssignment> => {
    try {
      setLoading(true);
      setError(null);
      const response = await inventoryAPI.assignments.updateAssignment(id, data);
      refetch();
      return {
        ...response.data,
        id: response.data.id.toString(),
        sectionId: response.data.sectionId.toString(),
        materialId: response.data.materialId?.toString(),
        menuItemId: response.data.menuItemId?.toString(),
        stockEntryId: response.data.stockEntryId?.toString(),
        updatedAt: new Date()
      };
    } catch (error) {
      handleError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const deleteAssignment = async (id: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      await inventoryAPI.assignments.deleteAssignment(id);
      refetch();
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    // Materials
    createMaterial,
    updateMaterial,
    deleteMaterial,
    // Stock Entries
    createStockEntry,
    updateStockEntry,
    deleteStockEntry,
    // Menu Items
    createMenuItem,
    updateMenuItem,
    deleteMenuItem,
    // Sections
    createSection,
    updateSection,
    deleteSection,
    // Assignments
    createAssignment,
    updateAssignment,
    deleteAssignment
  };
};
