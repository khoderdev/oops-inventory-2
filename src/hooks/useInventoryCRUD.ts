import { inventoryAPI } from "@/api/inventory.api";
import { CreateInnerSectionData, CreateMaterialData, CreateMenuItemData, CreateSectionAssignmentData, CreateSectionData, CreateStockEntryData, CreateTableData, InnerSection, Material, MenuItem, Section, SectionAssignment, StockEntry, Tables, UpdateInnerSectionData, UpdateMaterialData, UpdateMenuItemData, UpdateSectionAssignmentData, UpdateSectionData, UpdateStockEntryData, UpdateTableData } from "@/types/inventory";
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

  // Inner Sections CRUD
  const createInnerSection = async (data: CreateInnerSectionData): Promise<InnerSection> => {
    try {
      setLoading(true);
      setError(null);
      const response = await inventoryAPI.sections.createInnerSection(data);
      refetch();
      return {
        ...response.data,
        id: response.data.id.toString(),
        sectionId: response.data.sectionId.toString(),
        createdAt: new Date(),
        updatedAt: new Date(),
        tables: []
      };
    } catch (error) {
      handleError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateInnerSection = async (id: string, data: UpdateInnerSectionData): Promise<InnerSection> => {
    try {
      setLoading(true);
      setError(null);
      const response = await inventoryAPI.sections.updateInnerSection(id, data);
      refetch();
      return {
        ...response.data,
        id: response.data.id.toString(),
        sectionId: response.data.sectionId.toString(),
        updatedAt: new Date()
      };
    } catch (error) {
      handleError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const getInnerSections = async (sectionId: string): Promise<InnerSection[]> => {
    try {
      setLoading(true);
      setError(null);
      const response = await inventoryAPI.sections.getInnerSections(sectionId);
      return response.data.map(section => ({
        ...section,
        id: section.id.toString(),
        sectionId: section.sectionId.toString(),
        createdAt: new Date(section.createdAt),
        updatedAt: new Date(section.updatedAt)
      }));
    } catch (error) {
      handleError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const deleteInnerSection = async (id: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      await inventoryAPI.sections.deleteInnerSection(id);
      refetch();
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  };

  // Tables CRUD Operations
  const createTable = async (data: CreateTableData): Promise<Tables> => {
    try {
      setLoading(true);
      setError(null);

      // Ensure proper data formatting
      const formattedData = {
        ...data,
        innerSectionId: String(data.innerSectionId), // Convert to string
        capacity: Number(data.capacity) // Ensure number
      };

      const response = await inventoryAPI.sections.createTable(formattedData);

      // Refresh data
      await refetch();

      // Return properly formatted response
      return {
        ...response.data,
        id: String(response.data.id),
        innerSectionId: String(response.data.innerSectionId),
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

  const updateTable = async (id: string, data: UpdateTableData): Promise<Tables> => {
    try {
      setLoading(true);
      setError(null);

      const formattedData = {
        ...data,
        innerSectionId: String(data.innerSectionId),
        capacity: Number(data.capacity)
      };

      const response = await inventoryAPI.sections.updateTable(id, formattedData);
      await refetch();

      return {
        ...response.data,
        id: String(response.data.id),
        innerSectionId: String(response.data.innerSectionId),
        updatedAt: new Date()
      };
    } catch (error) {
      handleError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const deleteTable = async (id: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      await inventoryAPI.sections.deleteTable(id);
      await refetch();
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
    // Inner Sections
    createInnerSection,
    getInnerSections,
    updateInnerSection,
    deleteInnerSection,
    // Tables
    createTable,
    updateTable,
    deleteTable,
    // Assignments
    createAssignment,
    updateAssignment,
    deleteAssignment
  };
};
