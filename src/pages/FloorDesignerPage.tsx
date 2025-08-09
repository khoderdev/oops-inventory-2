import { FloorPlanCanvas } from "@/components/floor-designer/FloorPlanCanvas";
import { FurniturePalette } from "@/components/floor-designer/FurniturePalette";
import { LayoutManager } from "@/components/floor-designer/LayoutManager";
import { PropertiesPanel } from "@/components/floor-designer/PropertiesPanel";
import { useFloorPlan } from "@/hooks/useFloorPlan";
import { FurnitureTemplate } from "@/types/floor-plan";

function FloorDesignerPage() {
  const { currentPlan, selectedFurniture, selectedFurnitureId, setSelectedFurnitureId, addFurniture, updateFurniture, deleteFurniture, duplicateFurniture, savePlan, loadPlan, newPlan, getSavedPlans, deleteSavedPlan, linkChairToTable, unlinkChairFromTable, getChildFurniture, getParentFurniture, moveTableWithChairs } = useFloorPlan();

  const currentArea = currentPlan.areas[0];
  const handleAddFurniture = (template: FurnitureTemplate) => {
    addFurniture(template, currentArea.id);
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <LayoutManager currentPlan={currentPlan} onSavePlan={savePlan} onLoadPlan={loadPlan} onNewPlan={newPlan} getSavedPlans={getSavedPlans} onDeletePlan={deleteSavedPlan} />

      <div className="flex-1 flex overflow-hidden">
        <FurniturePalette onAddFurniture={handleAddFurniture} />

        <FloorPlanCanvas area={currentArea} onUpdateFurniture={updateFurniture} selectedFurnitureId={selectedFurnitureId} onSelectFurniture={setSelectedFurnitureId} onLinkChairToTable={linkChairToTable} onUnlinkChairFromTable={unlinkChairFromTable} onMoveTableWithChairs={moveTableWithChairs} onDuplicateFurniture={duplicateFurniture} onDeleteFurniture={deleteFurniture} getChildFurniture={getChildFurniture} getParentFurniture={getParentFurniture} />

        <PropertiesPanel selectedFurniture={selectedFurniture} onUpdateFurniture={updateFurniture} onDeleteFurniture={deleteFurniture} onDuplicateFurniture={duplicateFurniture} parentTable={selectedFurniture ? getParentFurniture(selectedFurniture.id) : null} childChairs={selectedFurniture ? getChildFurniture(selectedFurniture.id) : []} />
      </div>

      {/* Status Bar */}
      <div className="bg-white border-t border-gray-200 px-6 py-3 flex items-center justify-between text-sm text-gray-600">
        <div className="flex items-center gap-6">
          <span>Total Furniture: {currentArea.furniture.length}</span>
          <span>Total Seating: {currentArea.furniture.reduce((sum, f) => sum + (f.seatingCapacity || 0), 0)}</span>
          <span>
            Area: {currentArea.bounds.width}" × {currentArea.bounds.height}"
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span>Grid Snap: 10"</span>
          <span>Units: Inches</span>
        </div>
      </div>
    </div>
  );
}

export default FloorDesignerPage;
