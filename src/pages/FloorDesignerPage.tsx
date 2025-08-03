import { FloorDesignerHeader } from "@/components/floor-designer/FloorDesignerHeader";
import { FloorPlanCanvas } from "@/components/floor-designer/FloorPlanCanvas";
import { FurniturePalette } from "@/components/floor-designer/FurniturePalette";
import { PropertiesPanel } from "@/components/floor-designer/PropertiesPanel";
import { useHeaderActions } from "@/contexts/HeaderActionsContext";
import { useFloorDesignerHeader } from "@/hooks/useFloorDesignerHeader";
import { useFloorPlan } from "@/hooks/useFloorPlan";
import { FurnitureTemplate, FloorPlan } from "@/types/floor-plan";
import { useCallback, useEffect } from "react";

function FloorDesignerPage() {
  const { currentPlan, selectedFurniture, selectedFurnitureId, setSelectedFurnitureId, addFurniture, updateFurniture, deleteFurniture, duplicateFurniture, savePlan, loadPlan, newPlan, getSavedPlans, deleteSavedPlan, linkChairToTable, unlinkChairFromTable, getChildFurniture, getParentFurniture, moveTableWithChairs, saveToBackend, loadFromBackend, getSavedPlansFromBackend, deleteFromBackend } = useFloorPlan();

  const { title, subtitle } = useFloorDesignerHeader({ currentPlan });
  const { setHeaderActions, setPageTitle } = useHeaderActions();

  const currentArea = currentPlan.areas[0];
  const handleAddFurniture = (template: FurnitureTemplate) => {
    addFurniture(template, currentArea.id);
  };

  // Wrapper functions to bridge backend async functions with UI sync interface
  const handleSavePlan = useCallback(async (name: string) => {
    try {
      await saveToBackend(name);
    } catch (error) {
      console.error('Failed to save floor plan:', error);
    }
  }, [saveToBackend]);

  const handleLoadPlan = useCallback(async (plan: FloorPlan) => {
    try {
      await loadFromBackend(plan.id);
    } catch (error) {
      console.error('Failed to load floor plan:', error);
    }
  }, [loadFromBackend]);

  const handleGetSavedPlans = useCallback(() => {
    // For now, return empty array since this is sync but backend is async
    // TODO: Consider making this async or using state management
    return [];
  }, []);

  const handleDeletePlan = useCallback(async (planId: string) => {
    try {
      await deleteFromBackend(planId);
    } catch (error) {
      console.error('Failed to delete floor plan:', error);
    }
  }, [deleteFromBackend]);

  // Set header actions and title when component mounts or plan changes
  useEffect(() => {
    const headerActions = <FloorDesignerHeader currentPlan={currentPlan} onSavePlan={handleSavePlan} onLoadPlan={handleLoadPlan} onNewPlan={newPlan} getSavedPlans={handleGetSavedPlans} onDeletePlan={handleDeletePlan} />;
    setHeaderActions(headerActions);
    setPageTitle(title);

    // Clean up when component unmounts
    return () => {
      setHeaderActions(null);
      setPageTitle(null);
    };
  }, [currentPlan, title, handleSavePlan, handleLoadPlan, newPlan, handleGetSavedPlans, handleDeletePlan, setHeaderActions, setPageTitle]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-gray-50 overflow-hidden">
      <div className="flex-1 flex min-h-0 overflow-hidden">
        <FurniturePalette 
          onAddFurniture={handleAddFurniture}
          currentPlan={currentPlan}
          onSavePlan={handleSavePlan}
          onLoadPlan={handleLoadPlan}
          getSavedPlans={handleGetSavedPlans}
          onDeletePlan={handleDeletePlan}
          onNewPlan={newPlan}
        />

        <FloorPlanCanvas area={currentArea} onUpdateFurniture={updateFurniture} selectedFurnitureId={selectedFurnitureId} onSelectFurniture={setSelectedFurnitureId} onLinkChairToTable={linkChairToTable} onUnlinkChairFromTable={unlinkChairFromTable} onMoveTableWithChairs={moveTableWithChairs} onDuplicateFurniture={duplicateFurniture} onDeleteFurniture={deleteFurniture} getChildFurniture={getChildFurniture} getParentFurniture={getParentFurniture} />

        <PropertiesPanel 
          selectedFurniture={selectedFurniture} 
          onUpdateFurniture={updateFurniture} 
          onDeleteFurniture={deleteFurniture} 
          onDuplicateFurniture={duplicateFurniture} 
          onUnselectFurniture={() => setSelectedFurnitureId(null)}
          parentTable={selectedFurniture ? getParentFurniture(selectedFurniture.id) : null} 
          childChairs={selectedFurniture ? getChildFurniture(selectedFurniture.id) : []} 
        />
      </div>

      {/* Status Bar */}
      <div className="bg-white border-t border-gray-200 px-6 py-3 flex items-center justify-between text-sm text-gray-600 shrink-0">
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
