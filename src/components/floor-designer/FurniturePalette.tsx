import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Download, FolderOpen, Plus, Save, Trash2 } from "lucide-react";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FloorPlan, FurnitureTemplate } from "../../types/floor-plan";
import { furnitureTemplates } from "./furniture-templates";

interface FurniturePaletteProps {
  onAddFurniture: (template: FurnitureTemplate) => void;
  currentPlan: FloorPlan;
  onSavePlan: (name: string) => void;
  onLoadPlan: (plan: FloorPlan) => void;
  getSavedPlans: () => Promise<FloorPlan[]>;
  onDeletePlan: (planId: string) => void;
  onNewPlan: () => void;
}

export const FurniturePalette: React.FC<FurniturePaletteProps> = ({ onAddFurniture, currentPlan, onSavePlan, onLoadPlan, getSavedPlans, onDeletePlan, onNewPlan }) => {
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showLoadDialog, setShowLoadDialog] = useState(false);
  const [saveName, setSaveName] = useState(currentPlan.name);
  const [savedPlans, setSavedPlans] = useState<FloorPlan[]>([]);
  const navigate = useNavigate();

  // Load saved plans when dialog opens
  const refreshSavedPlans = async () => {
    try {
      const plans = await getSavedPlans();
      setSavedPlans(plans);
    } catch (error) {
      console.error("Failed to load saved plans:", error);
      setSavedPlans([]);
    }
  };

  const handleSave = () => {
    if (saveName.trim()) {
      onSavePlan(saveName.trim());
      setShowSaveDialog(false);
    }
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(currentPlan, null, 2);
    const dataUri = "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);

    const exportFileDefaultName = `${currentPlan.name.replace(/[^a-z0-9]/gi, "_").toLowerCase()}_floor_plan.json`;

    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", dataUri);
    linkElement.setAttribute("download", exportFileDefaultName);
    linkElement.click();
  };

  return (
    <div className="w-52 h-full bg-white border-r border-gray-200 flex flex-col">
      <div className="p-2 border-b border-gray-200 shrink-0">
        {/* Action Buttons */}
        <div className="flex flex-col gap-2 mt-3">
          <Button onClick={onNewPlan} variant="outline" size="sm" className="gap-2 w-full">
            <Plus className="w-4 h-4" />
            New Plan
          </Button>

          <Button
            onClick={() => {
              refreshSavedPlans();
              setShowLoadDialog(true);
            }}
            variant="outline"
            size="sm"
            className="gap-2 w-full"
          >
            <FolderOpen className="w-4 h-4" />
            Open
          </Button>

          <Button onClick={() => setShowSaveDialog(true)} variant="default" size="sm" className="gap-2 w-full bg-amber-600 hover:bg-amber-700">
            <Save className="w-4 h-4" />
            Save
          </Button>

          <Button onClick={handleExport} variant="outline" size="sm" className="gap-2 w-full">
            <Download className="w-4 h-4" />
            Export
          </Button>
        </div>
      </div>

      <div className="flex h-full flex-col justify-between overflow-y-auto p-2 min-h-0">
        <div>
          <h3 className="text-sm font-medium text-gray-700 uppercase tracking-wide mb-3">Furnitures</h3>
          <div className="grid grid-cols-2 gap-3">
            {furnitureTemplates.map(template => (
              <button key={template.type} onClick={() => onAddFurniture(template)} className="p-2 border border-gray-200 rounded-lg hover:border-amber-300 hover:bg-amber-50 transition-all duration-200 group">
                <div className="text-2xl mb-2 group-hover:scale-110 transition-transform">{template.icon}</div>
                <div className="text-xs font-medium text-gray-700 mb-1">{template.name}</div>
                {template.seatingCapacity && <div className="text-xs text-gray-500">Seats {template.seatingCapacity}</div>}
              </button>
            ))}
          </div>
        </div>
        <Button onClick={() => navigate(-1)} variant="destructive" size="sm" className="gap-2 w-full">
          Exit
        </Button>
      </div>

      {/* Save Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Floor Plan</DialogTitle>
            <DialogDescription>Enter a name for your floor plan to save it.</DialogDescription>
          </DialogHeader>
          <Input value={saveName} onChange={e => setSaveName(e.target.value)} placeholder="Floor plan name" onKeyDown={e => e.key === "Enter" && handleSave()} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} className="bg-amber-600 hover:bg-amber-700">
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Load Dialog */}
      <Dialog open={showLoadDialog} onOpenChange={setShowLoadDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Load Floor Plan</DialogTitle>
            <DialogDescription>Select a saved floor plan to load.</DialogDescription>
          </DialogHeader>
          <div className="max-h-60 overflow-y-auto space-y-2">
            {savedPlans.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No saved plans found</p>
            ) : (
              savedPlans.map(plan => (
                <div key={plan.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                  <div className="flex-1">
                    <h4 className="font-medium">{plan.name}</h4>
                    <p className="text-sm text-gray-500">
                      {plan.updatedAt.toLocaleDateString()} • {plan.areas[0]?.furniture.length || 0} items
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => {
                        onLoadPlan(plan);
                        setShowLoadDialog(false);
                      }}
                      className="bg-amber-600 hover:bg-amber-700"
                    >
                      Load
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        onDeletePlan(plan.id);
                        refreshSavedPlans();
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLoadDialog(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
