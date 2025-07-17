import { useEffect, useState } from "react";
import { inventoryAPI } from "@/api/inventory.api";
import { Material, StockEntry, MenuItem, Section, SectionAssignment } from "@/types/inventory";

interface InventoryData {
  materials: Material[];
  stockEntries: StockEntry[];
  menuItems: MenuItem[];
  sections: Section[];
  sectionAssignments: SectionAssignment[];
}

interface InventoryDataState extends InventoryData {
  loading: boolean;
  error: string | null;
}

export const useInventoryData = () => {
  const [state, setState] = useState<InventoryDataState>({
    materials: [],
    stockEntries: [],
    menuItems: [],
    sections: [],
    sectionAssignments: [],
    loading: true,
    error: null
  });

  const fetchAllData = async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      const [materialsRes, stockRes, menuRes, sectionsRes, assignmentsRes] = await Promise.all([
        inventoryAPI.materials.getMaterials(),
        inventoryAPI.stock.getStockEntries(),
        inventoryAPI.menu.getMenus(),
        inventoryAPI.sections.getSections(),
        inventoryAPI.assignments.getAssignments()
      ]);

      setState(prev => ({
        ...prev,
        materials: materialsRes.data.map(material => ({
          ...material,
          id: material.id.toString(),
          createdAt: material.createdAt ? new Date(material.createdAt) : new Date(),
          updatedAt: material.updatedAt ? new Date(material.updatedAt) : new Date()
        })),
        stockEntries: stockRes.data.map(entry => ({
          ...entry,
          id: entry.id.toString(),
          materialId: entry.materialId.toString(),
          purchaseDate: new Date(entry.purchaseDate),
          expiryDate: entry.expiryDate ? new Date(entry.expiryDate) : undefined,
          createdAt: entry.createdAt ? new Date(entry.createdAt) : new Date(),
          updatedAt: entry.updatedAt ? new Date(entry.updatedAt) : new Date()
        })),
        menuItems: menuRes.data.map(item => ({
          ...item,
          id: item.id.toString(),
          createdAt: item.createdAt ? new Date(item.createdAt) : new Date(),
          updatedAt: item.updatedAt ? new Date(item.updatedAt) : new Date()
        })),
        sections: sectionsRes.data.map(section => ({
          ...section,
          id: section.id.toString(),
          createdAt: section.createdAt ? new Date(section.createdAt) : new Date(),
          updatedAt: section.updatedAt ? new Date(section.updatedAt) : new Date()
        })),
        sectionAssignments: assignmentsRes.data.map(assignment => ({
          ...assignment,
          id: assignment.id.toString(),
          sectionId: assignment.sectionId.toString(),
          materialId: assignment.materialId?.toString(),
          menuItemId: assignment.menuItemId?.toString(),
          stockEntryId: assignment.stockEntryId?.toString(),
          createdAt: assignment.createdAt ? new Date(assignment.createdAt) : new Date(),
          updatedAt: assignment.updatedAt ? new Date(assignment.updatedAt) : new Date()
        })),
        loading: false
      }));
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message || "Failed to fetch inventory data"
      }));
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const refetch = () => {
    fetchAllData();
  };

  return {
    ...state,
    refetch
  };
};
