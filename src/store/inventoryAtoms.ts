import { InnerSection, MaterialCategory, MaterialWithStock, MenuItem, Section, SectionAssignment, StockEntryWithMaterial, Tables } from "@/types/inventory";
import { calculateMaterialInventory } from "@/utils/inventoryCalculations";
import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";

// Base data atoms
// export const materialsAtom = atom<Material[]>([]);
// export const stockEntriesAtom = atom<StockEntry[]>([]);
// export const sectionsAtom = atom<Section[]>([]);
// export const innerSectionsAtom = atom<InnerSection[]>([]);
// export const sectionAssignmentsAtom = atom<SectionAssignment[]>([]);
// export const menuItemsAtom = atom<MenuItem[]>([]);

// // Optimistic state atoms (for temporary updates before API confirmation)
// export const optimisticMaterialsAtom = atom<MaterialWithStock[]>([]);
// export const optimisticStockEntriesAtom = atom<StockEntryWithMaterial[]>([]);
// export const optimisticSectionsAtom = atom<Section[]>([]);
export const optimisticInnerSectionsAtom = atom<InnerSection[]>([]);
// export const optimisticAssignmentsAtom = atom<SectionAssignment[]>([]);

// // Loading and error states
// export const loadingStatesAtom = atom<Record<string, boolean>>({});
// export const errorStatesAtom = atom<Record<string, string | null>>({});

// // UI state atoms
// export const activeTabAtom = atomWithStorage("inventoryManagementActiveTab", "sections");
// export const searchTermAtom = atom<string>("");
// export const categoryFilterAtom = atom<string>("all");
// export const lowStockFilterAtom = atom<boolean>(false);

// export const tablesAtom = atom<Tables[]>([]);

export const materialsAtom = atom<MaterialWithStock[]>([]);
export const optimisticMaterialsAtom = atom<MaterialWithStock[]>([]);
export const stockEntriesAtom = atom<StockEntryWithMaterial[]>([]);
export const optimisticStockEntriesAtom = atom<StockEntryWithMaterial[]>([]);
export const sectionsAtom = atom<Section[]>([]);
export const optimisticSectionsAtom = atom<Section[]>([]);
export const sectionAssignmentsAtom = atom<SectionAssignment[]>([]);
export const optimisticAssignmentsAtom = atom<SectionAssignment[]>([]);
export const menuItemsAtom = atom<MenuItem[]>([]);
export const innerSectionsAtom = atom<InnerSection[]>([]);
export const tablesAtom = atom<Tables[]>([]);
export const activeTabAtom = atomWithStorage<string>("inventoryActiveTab", "material");
export const searchTermAtom = atomWithStorage<string>("inventorySearchTerm", "");
export const categoryFilterAtom = atomWithStorage<MaterialCategory | "">("inventoryCategoryFilter", "");
export const lowStockFilterAtom = atomWithStorage<boolean>("inventoryLowStockFilter", false);
export const showMaterialFormAtom = atom<boolean>(false);
export const showStockFormAtom = atom<boolean>(false);
export const showSectionFormAtom = atom<boolean>(false);
export const selectedMaterialAtom = atom<MaterialWithStock | null>(null);
export const selectedStockEntryAtom = atom<StockEntryWithMaterial | null>(null);
export const selectedSectionAtom = atom<Section | null>(null);
export const tabLoadingAtom = atom<{ [key: string]: boolean }>({
  material: false,
  stock: false,
  sections: false,
  menu: false,
  tables: false,
  conversions: false
});
export const tabErrorAtom = atom<{ [key: string]: string | null }>({
  material: null,
  stock: null,
  sections: null,
  menu: null,
  tables: null,
  conversions: null
});

// UI state for POS panel
export const showPOSPanelAtom = atomWithStorage<boolean>("showPOSPanel", false);
export const selectedPOSPanelTableAtom = atom<Tables | null>(null);

// Derived atom for POS panel data
export const posPanelDataAtom = atom(get => {
  const selectedTable = get(selectedPOSPanelTableAtom);
  const sections = get(optimisticSectionsAtom);
  const innerSections = get(optimisticInnerSectionsAtom);
  const assignments = get(optimisticAssignmentsAtom);
  const materials = get(optimisticMaterialsAtom);

  if (!selectedTable) {
    return { materials, sectionAssignments: [], selectedSectionId: "" };
  }

  // Find the inner section and parent section for the selected table
  const innerSection = innerSections.find(is => is.id === selectedTable.innerSectionId);
  const section = innerSection ? sections.find(s => s.id === innerSection.sectionId) : null;

  // Filter assignments for the parent section
  const sectionAssignments = section ? assignments.filter(a => a.sectionId === section.id) : [];

  return {
    materials,
    sectionAssignments,
    selectedSectionId: section?.id || ""
  };
});

// Derived atoms
export const materialsWithStockAtom = atom<MaterialWithStock[]>(get => {
  const materials = get(optimisticMaterialsAtom);
  const stockEntries = get(optimisticStockEntriesAtom);
  const assignments = get(optimisticAssignmentsAtom);

  return materials.map(material => {
    const materialStockEntries = stockEntries.filter(entry => entry.materialId === material.id);
    const materialInventory = calculateMaterialInventory(material, materialStockEntries);

    // Calculate assigned quantities
    const materialAssignments = assignments.filter(assignment => assignment.materialId === material.id && assignment.itemType === "stockEntry");

    const totalAssignedIndividualQuantity = materialAssignments.reduce((sum, assignment) => {
      const individualQty = assignment.assignedIndividualQuantity || (assignment.assignedQuantity || 0) * (material.packageQuantity || 1);
      return sum + individualQty;
    }, 0);

    const availableQuantity = Math.max(0, materialInventory.totalQuantityInBaseUnit - totalAssignedIndividualQuantity);

    return {
      ...materialInventory,
      availableQuantity
    };
  });
});

export const filteredMaterialsAtom = atom<MaterialWithStock[]>(get => {
  const materials = get(materialsWithStockAtom);
  const searchTerm = get(searchTermAtom);
  const categoryFilter = get(categoryFilterAtom);
  const lowStockFilter = get(lowStockFilterAtom);

  return materials.filter(material => {
    const matchesSearch = !searchTerm || material.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "all" || material.category === categoryFilter;
    const matchesLowStock = !lowStockFilter || material.availableQuantity < 10;
    return matchesSearch && matchesCategory && matchesLowStock;
  });
});

// Tab-specific loading states
// export const tabLoadingAtom = atom<Record<string, boolean>>({});
// export const tabErrorAtom = atom<Record<string, string | null>>({});

// Success/Error message atoms
export const successMessageAtom = atom<string | null>(null);
export const errorMessageAtom = atom<string | null>(null);

// Form state atoms
// export const showMaterialFormAtom = atom<boolean>(false);
// export const showStockFormAtom = atom<boolean>(false);
// export const showSectionFormAtom = atom<boolean>(false);
export const showInnerSectionFormAtom = atom<boolean>(false);
export const showTableFormAtom = atom<boolean>(false);
// export const selectedMaterialAtom = atom<MaterialWithStock | null>(null);
// export const selectedStockEntryAtom = atom<StockEntry | null>(null);
// export const selectedSectionAtom = atom<Section | null>(null);
export const selectedInnerSectionAtom = atom<InnerSection | null>(null);
export const selectedTableAtom = atom<Tables | null>(null);
