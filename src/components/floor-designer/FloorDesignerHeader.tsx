import { Download, FolderOpen, Plus, Save, Trash2 } from "lucide-react";
import React, { useState } from "react";
import { FloorPlan } from "../../types/floor-plan";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface FloorDesignerHeaderProps {
  currentPlan: FloorPlan;
  onSavePlan: (name: string) => void;
  onLoadPlan: (plan: FloorPlan) => void;
  onNewPlan: () => void;
  getSavedPlans: () => Promise<FloorPlan[]>;
  onDeletePlan: (planId: string) => void;
}

export const FloorDesignerHeader: React.FC<FloorDesignerHeaderProps> = ({ currentPlan, onSavePlan, onLoadPlan, onNewPlan, getSavedPlans, onDeletePlan }) => {
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showLoadDialog, setShowLoadDialog] = useState(false);
  const [saveName, setSaveName] = useState(currentPlan.name);
  const [savedPlans, setSavedPlans] = useState<FloorPlan[]>([]);

  // Load saved plans when dialog opens
  const refreshSavedPlans = async () => {
    try {
      const plans = await getSavedPlans();
      setSavedPlans(plans);
    } catch (error) {
      console.error('Failed to load saved plans:', error);
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

  const headerActions = (
    <>
      <Button onClick={onNewPlan} variant="ghost" size="sm" className="gap-2">
        <Plus className="w-4 h-4" />
        New Plan
      </Button>

      <Button
        onClick={() => {
          refreshSavedPlans();
          setShowLoadDialog(true);
        }}
        variant="ghost"
        size="sm"
        className="gap-2"
      >
        <FolderOpen className="w-4 h-4" />
        Open
      </Button>

      <Button onClick={() => setShowSaveDialog(true)} variant="default" size="sm" className="gap-2 bg-amber-600 hover:bg-amber-700">
        <Save className="w-4 h-4" />
        Save
      </Button>

      <Button onClick={handleExport} variant="ghost" size="sm" className="gap-2">
        <Download className="w-4 h-4" />
        Export
      </Button>
    </>
  );

  return (
    <>
      {/* Return the header actions to be used in PageLayout */}
      {headerActions}

      {/* Save Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Save Floor Plan</DialogTitle>
            <DialogDescription>
              Enter a name for your floor plan to save it.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Input
              value={saveName}
              onChange={e => setSaveName(e.target.value)}
              placeholder="Enter plan name..."
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={!saveName.trim()}
              className="bg-amber-600 hover:bg-amber-700"
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Load Dialog */}
      <Dialog open={showLoadDialog} onOpenChange={setShowLoadDialog}>
        <DialogContent className="sm:max-w-[500px] max-h-[600px]">
          <DialogHeader>
            <DialogTitle>Open Floor Plan</DialogTitle>
            <DialogDescription>
              Select a floor plan to open from your saved plans.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2 py-4 max-h-[400px] overflow-y-auto">
            {savedPlans.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No saved floor plans found.
              </div>
            ) : (
              savedPlans.map(plan => (
                <div
                  key={plan.id}
                  className="p-3 border border-border rounded-lg hover:bg-accent cursor-pointer flex justify-between items-center transition-colors"
                  onClick={() => {
                    onLoadPlan(plan);
                    setShowLoadDialog(false);
                  }}
                >
                  <div>
                    <div className="font-medium">{plan.name}</div>
                    <div className="text-sm text-muted-foreground">{plan.updatedAt.toLocaleDateString()}</div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={e => {
                      e.stopPropagation();
                      onDeletePlan(plan.id);
                      refreshSavedPlans();
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
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
    </>
  );
};
