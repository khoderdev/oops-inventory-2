import { useMemo } from "react";
import { FloorPlan } from "../types/floor-plan";

interface UseFloorDesignerHeaderProps {
  currentPlan: FloorPlan;
}

export const useFloorDesignerHeader = ({ currentPlan }: UseFloorDesignerHeaderProps) => {
  const headerInfo = useMemo(() => {
    const currentArea = currentPlan.areas[0];

    return {
      title: currentPlan.name,
      subtitle: `Last updated: ${currentPlan.updatedAt.toLocaleDateString()} • ${currentArea.furniture.length} furniture items • ${currentArea.furniture.reduce((sum, f) => sum + (f.seatingCapacity || 0), 0)} total seats`,
      stats: {
        totalFurniture: currentArea.furniture.length,
        totalSeating: currentArea.furniture.reduce((sum, f) => sum + (f.seatingCapacity || 0), 0),
        areaSize: `${currentArea.bounds.width}" × ${currentArea.bounds.height}"`,
        lastUpdated: currentPlan.updatedAt.toLocaleDateString()
      }
    };
  }, [currentPlan]);

  return headerInfo;
};
