import { FurnitureItem } from "../types/floor-plan";

/**
 * Calculate distance between two furniture items
 */
export function calculateDistance(item1: FurnitureItem, item2: FurnitureItem): number {
  const centerX1 = item1.position.x + item1.dimensions.width / 2;
  const centerY1 = item1.position.y + item1.dimensions.height / 2;
  const centerX2 = item2.position.x + item2.dimensions.width / 2;
  const centerY2 = item2.position.y + item2.dimensions.height / 2;

  return Math.sqrt(Math.pow(centerX2 - centerX1, 2) + Math.pow(centerY2 - centerY1, 2));
}

/**
 * Check if a furniture item is a table
 */
export function isTable(furniture: FurnitureItem): boolean {
  return ["round-table", "square-table", "rectangular-table"].includes(furniture.type);
}

/**
 * Check if a furniture item is a chair
 */
export function isChair(furniture: FurnitureItem): boolean {
  return furniture.type === "chair";
}

/**
 * Find the nearest table to a chair within a given radius
 */
export function findNearestTable(chair: FurnitureItem, allFurniture: FurnitureItem[], maxDistance: number = 100): FurnitureItem | null {
  const tables = allFurniture.filter(item => isTable(item) && item.id !== chair.id);

  let nearestTable: FurnitureItem | null = null;
  let minDistance = maxDistance;

  for (const table of tables) {
    const distance = calculateDistance(chair, table);
    if (distance < minDistance) {
      minDistance = distance;
      nearestTable = table;
    }
  }

  return nearestTable;
}

/**
 * Auto-link chairs to nearby tables
 */
export function autoLinkChairsToTables(furniture: FurnitureItem[], linkFunction: (chairId: string, tableId: string) => void, maxDistance: number = 80): void {
  const unlinkedChairs = furniture.filter(item => isChair(item) && !item.parentId);

  for (const chair of unlinkedChairs) {
    const nearestTable = findNearestTable(chair, furniture, maxDistance);
    if (nearestTable) {
      linkFunction(chair.id, nearestTable.id);
    }
  }
}

/**
 * Get suggested position for a chair around a table
 */
export function getSuggestedChairPosition(table: FurnitureItem, chairIndex: number, totalChairs: number, chairDimensions: { width: number; height: number }): { x: number; y: number } {
  const tableCenter = {
    x: table.position.x + table.dimensions.width / 2,
    y: table.position.y + table.dimensions.height / 2
  };

  const radius = Math.max(table.dimensions.width, table.dimensions.height) / 2 + 30;
  const angle = (chairIndex / totalChairs) * 2 * Math.PI;

  return {
    x: tableCenter.x + Math.cos(angle) * radius - chairDimensions.width / 2,
    y: tableCenter.y + Math.sin(angle) * radius - chairDimensions.height / 2
  };
}
