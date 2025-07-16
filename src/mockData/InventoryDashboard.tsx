import { Material, Section, SectionAssignment, StockEntry } from "@/types/inventory";

export const mockMaterials: Material[] = [
  {
    id: "1",
    name: "Ground Beef",
    category: "meat",
    baseUnit: "kg",
    unitType: "mass",
    costPerBaseUnit: 3.3,
    description: "Fresh ground beef for burger patties",
    createdAt: new Date(),
    updatedAt: new Date(),
    sectionAssignments: []
  },
  {
    id: "2",
    name: "Burger Buns",
    category: "grains",
    baseUnit: "piece",
    unitType: "piece",
    costPerBaseUnit: 0.25,
    description: "Sesame seed burger buns",
    createdAt: new Date(),
    updatedAt: new Date(),
    sectionAssignments: []
  },
  {
    id: "3",
    name: "Pickles",
    category: "vegetables",
    baseUnit: "kg",
    unitType: "mass",
    costPerBaseUnit: 1.1,
    description: "Dill pickle slices",
    createdAt: new Date(),
    updatedAt: new Date(),
    sectionAssignments: []
  }
];

export const mockSections: Section[] = [
  {
    id: "1",
    name: "Kitchen",
    description: "Main food preparation area",
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: "2",
    name: "Bar",
    description: "Beverage preparation and service",
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

export const mockAssignments: SectionAssignment[] = [
  {
    id: "1",
    sectionId: "1",
    stockEntryId: "1",
    assignedQuantity: 5,
    assignedUnit: "kg",
    notes: "For daily burger production",
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: "2",
    sectionId: "1",
    stockEntryId: "2",
    assignedQuantity: 24,
    assignedUnit: "piece",
    notes: "For lunch service",
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

export const mockStockEntries: StockEntry[] = [
  {
    id: "1",
    materialId: "1",
    supplier: "Fresh Meat Co.",
    purchasedQuantity: 10,
    purchasedUnit: "kg",
    costPerPurchasedUnit: 3.3,
    totalCost: 33.0,
    purchaseDate: new Date("2024-01-15"),
    expiryDate: new Date("2024-01-25"),
    batchNumber: "BEEF-001",
    notes: "Grade A ground beef",
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: "2",
    materialId: "2",
    supplier: "Baker's Best",
    purchasedQuantity: 48,
    purchasedUnit: "piece",
    costPerPurchasedUnit: 0.25,
    totalCost: 12.0,
    purchaseDate: new Date("2024-01-14"),
    expiryDate: new Date("2024-01-21"),
    batchNumber: "BUNS-001",
    notes: "Fresh sesame buns",
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: "3",
    materialId: "3",
    supplier: "Veggie Distributors",
    purchasedQuantity: 3,
    purchasedUnit: "kg",
    costPerPurchasedUnit: 1.1,
    totalCost: 3.3,
    purchaseDate: new Date("2024-01-13"),
    expiryDate: new Date("2024-03-13"),
    batchNumber: "PICKLE-001",
    notes: "Premium dill pickles",
    createdAt: new Date(),
    updatedAt: new Date()
  }
];
