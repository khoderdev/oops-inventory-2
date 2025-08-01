import { FurnitureTemplate } from "../../types/floor-plan";

export const furnitureTemplates: FurnitureTemplate[] = [
  // Tables
  {
    type: "round-table",
    name: "Round Table",
    icon: "⭕",
    defaultDimensions: { width: 60, height: 60 },
    defaultColor: "#8B4513",
    seatingCapacity: 4,
    category: "tables"
  },
  {
    type: "square-table",
    name: "Square Table",
    icon: "⬜",
    defaultDimensions: { width: 50, height: 50 },
    defaultColor: "#8B4513",
    seatingCapacity: 4,
    category: "tables"
  },
  {
    type: "rectangular-table",
    name: "Rectangular Table",
    icon: "▭",
    defaultDimensions: { width: 80, height: 40 },
    defaultColor: "#8B4513",
    seatingCapacity: 6,
    category: "tables"
  },

  // Seating
  {
    type: "chair",
    name: "Chair",
    icon: "🪑",
    defaultDimensions: { width: 20, height: 20 },
    defaultColor: "#654321",
    seatingCapacity: 1,
    category: "seating"
  },
  {
    type: "booth",
    name: "Booth",
    icon: "🛋️",
    defaultDimensions: { width: 100, height: 60 },
    defaultColor: "#800000",
    seatingCapacity: 6,
    category: "seating"
  },

  // Service
  {
    type: "bar",
    name: "Bar Counter",
    icon: "🍺",
    defaultDimensions: { width: 120, height: 30 },
    defaultColor: "#2F4F4F",
    seatingCapacity: 8,
    category: "service"
  },
  {
    type: "host-station",
    name: "Host Station",
    icon: "🏢",
    defaultDimensions: { width: 60, height: 40 },
    defaultColor: "#4A4A4A",
    category: "service"
  },
  {
    type: "service-station",
    name: "Service Station",
    icon: "🍽️",
    defaultDimensions: { width: 50, height: 30 },
    defaultColor: "#708090",
    category: "service"
  }
];
