import { Download, FolderOpen, Plus, Save, Trash2 } from "lucide-react";
import React, { useState } from "react";
import { FloorPlan } from "../../types/floor-plan";

interface FloorDesignerHeaderProps {
  currentPlan: FloorPlan;
  onSavePlan: (name: string) => void;
  onLoadPlan: (plan: FloorPlan) => void;
  onNewPlan: () => void;
  getSavedPlans: () => FloorPlan[];
  onDeletePlan: (planId: string) => void;
}

export const FloorDesignerHeader: React.FC<FloorDesignerHeaderProps> = ({ currentPlan, onSavePlan, onLoadPlan, onNewPlan, getSavedPlans, onDeletePlan }) => {
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showLoadDialog, setShowLoadDialog] = useState(false);
  const [saveName, setSaveName] = useState(currentPlan.name);
  const [savedPlans, setSavedPlans] = useState<FloorPlan[]>([]);

  // Load saved plans when dialog opens
  const refreshSavedPlans = () => {
    setSavedPlans(getSavedPlans());
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
      <button onClick={onNewPlan} className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
        <Plus className="w-4 h-4" />
        New Plan
      </button>

      <button
        onClick={() => {
          refreshSavedPlans();
          setShowLoadDialog(true);
        }}
        className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <FolderOpen className="w-4 h-4" />
        Open
      </button>

      <button onClick={() => setShowSaveDialog(true)} className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors">
        <Save className="w-4 h-4" />
        Save
      </button>

      <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
        <Download className="w-4 h-4" />
        Export
      </button>
    </>
  );

  return (
    <>
      {/* Return the header actions to be used in PageLayout */}
      {headerActions}

      {/* Save Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold mb-4">Save Floor Plan</h3>
            <input type="text" value={saveName} onChange={e => setSaveName(e.target.value)} placeholder="Enter plan name..." className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent mb-4" autoFocus />
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowSaveDialog(false)} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                Cancel
              </button>
              <button onClick={handleSave} disabled={!saveName.trim()} className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Load Dialog */}
      {showLoadDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-h-96 overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Open Floor Plan</h3>
            <div className="space-y-2">
              {savedPlans.map(plan => (
                <div
                  key={plan.id}
                  className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer flex justify-between items-center"
                  onClick={() => {
                    onLoadPlan(plan);
                    setShowLoadDialog(false);
                  }}
                >
                  <div>
                    <div className="font-medium">{plan.name}</div>
                    <div className="text-sm text-gray-500">{plan.updatedAt.toLocaleDateString()}</div>
                  </div>
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      onDeletePlan(plan.id);
                      refreshSavedPlans();
                    }}
                    className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex justify-end mt-4">
              <button onClick={() => setShowLoadDialog(false)} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
