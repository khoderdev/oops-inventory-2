import { FurnitureTemplate } from "../../types/floor-plan";

export const furnitureTemplates: FurnitureTemplate[] = [
  // Tables
  {
    type: "round-table",
    name: "Round Table",
    icon: "⭕",
    defaultDimensions: { width: 100, height: 100 },
    defaultColor: "#8B4513",
    seatingCapacity: 4,
    category: "tables"
  },
  {
    type: "square-table",
    name: "Square Table",
    icon: "⬜",
    defaultDimensions: { width: 100, height: 100 },
    defaultColor: "#8B4513",
    seatingCapacity: 4,
    category: "tables"
  },
  {
    type: "rectangular-table",
    name: "Rectangular Table",
    icon: "▭",
    defaultDimensions: { width: 170, height: 100 },
    defaultColor: "#8B4513",
    seatingCapacity: 6,
    category: "tables"
  },

  // Seating
  {
    type: "chair",
    name: "Chair",
    icon: "🪑",
    defaultDimensions: { width: 40, height: 40 },
    defaultColor: "#654321",
    seatingCapacity: 1,
    category: "seating"
  },

  // Service
  {
    type: "bar",
    name: "Bar Counter",
    icon: "🍺",
    defaultDimensions: { width: 460, height: 60 },
    defaultColor: "#2F4F4F",
    seatingCapacity: 8,
    category: "service"
  }
];
