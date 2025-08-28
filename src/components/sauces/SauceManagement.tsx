import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, ChefHat } from "lucide-react";
import { SauceTable } from "./SauceTable";
import { SauceForm } from "./SauceForm";
import { saucesAPI } from "@/api/sauces.api";
import { Sauce, SauceManagementProps, SauceFormData, CreateSauceData, UpdateSauceData } from "@/types/inventory";
import { toast } from "@/hooks/use-toast";

export function SauceManagement({ materials, stockEntries, onRefresh }: SauceManagementProps) {
  const [sauces, setSauces] = useState<Sauce[]>([]);
  const [, setLoading] = useState(false);
  const [showSauceForm, setShowSauceForm] = useState(false);
  const [selectedSauce, setSelectedSauce] = useState<Sauce | null>(null);
  const [, setOperationLoading] = useState<Record<string, boolean>>({});

  const fetchSauces = useCallback(async () => {
    setLoading(true);
    try {
      const response = await saucesAPI.getSauces({
        limit: 10000,
        _t: Date.now(),
        sortBy: "name",
        sortOrder: "ASC"
      });

      if (response?.data) {
        const transformedSauces = response.data.map(sauce => ({
          ...sauce,
          baseIngredients:
            sauce.ingredients?.map(ing => ({
              materialId: ing.materialId,
              quantity: parseFloat(ing.quantity) || 0,
              unit: ing.unit,
              cost: parseFloat(ing.cost) || 0
            })) || []
        }));

        setSauces(transformedSauces);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSauces();
  }, [fetchSauces]);

  const handleSauceSubmit = useCallback(
    async (data: SauceFormData) => {
      const operationKey = selectedSauce ? `update-${selectedSauce.id}` : "create";
      setOperationLoading(prev => ({ ...prev, [operationKey]: true }));
      try {
        const sauceData = {
          name: data.name,
          description: data.description,
          category: data.category,
          baseIngredients: data.baseIngredients.map(ing => ({
            materialId: ing.materialId,
            quantity: typeof ing.quantity === "string" ? parseFloat(ing.quantity) : ing.quantity,
            unit: ing.unit,
            cost: typeof ing.cost === "string" ? parseFloat(ing.cost) : ing.cost
          })),
          yieldQuantity: parseFloat(data.yieldQuantity),
          unit: data.unit,
          preparationTime: data.preparationTime ? parseInt(data.preparationTime) : undefined,
          isPOSItem: true
        };
        if (selectedSauce) {
          await saucesAPI.updateSauce(selectedSauce.id, sauceData as UpdateSauceData);
          toast({
            title: "Updated",
            description: `${data.name} updated successfully`,
            duration: 2000
          });
        } else {
          await saucesAPI.createSauce(sauceData as CreateSauceData);
          toast({
            title: "Created",
            description: `${data.name} created successfully`,
            duration: 2000
          });
        }
        await fetchSauces();
        setShowSauceForm(false);
        setSelectedSauce(null);
        if (onRefresh) {
          onRefresh();
        }
      } catch (error) {
        console.error("❌ Error saving sauce:", error);
        toast({
          title: "Error",
          description: `Failed to ${selectedSauce ? "update" : "create"} sauce`,
          variant: "destructive",
          duration: 3000
        });
      } finally {
        setOperationLoading(prev => ({ ...prev, [operationKey]: false }));
      }
    },
    [selectedSauce, fetchSauces, onRefresh]
  );

  const handleEditSauce = useCallback((sauce: Sauce) => {
    setSelectedSauce(sauce);
    setShowSauceForm(true);
  }, []);

  const handleDeleteSauce = useCallback(
    async (sauceId: string) => {
      const operationKey = `delete-${sauceId}`;
      setOperationLoading(prev => ({ ...prev, [operationKey]: true }));

      try {
        await saucesAPI.deleteSauce(sauceId);
        await fetchSauces();

        if (onRefresh) {
          onRefresh();
        }
      } catch (error) {
        console.error("❌ Error deleting sauce:", error);
        toast({
          title: "Error",
          description: "Failed to delete sauce",
          variant: "destructive",
          duration: 3000
        });
      } finally {
        setOperationLoading(prev => ({ ...prev, [operationKey]: false }));
      }
    },
    [fetchSauces, onRefresh]
  );

  // Handle bulk sauce deletion
  const handleBulkDeleteSauces = useCallback(
    async (sauceIds: string[]) => {
      const operationKey = "bulk-delete";
      setOperationLoading(prev => ({ ...prev, [operationKey]: true }));

      try {
        await saucesAPI.bulkDeleteSauces(sauceIds);
        await fetchSauces();

        if (onRefresh) {
          onRefresh();
        }
      } catch (error) {
        console.error("❌ Error bulk deleting sauces:", error);
        toast({
          title: "Error",
          description: "Failed to delete sauces",
          variant: "destructive",
          duration: 3000
        });
      } finally {
        setOperationLoading(prev => ({ ...prev, [operationKey]: false }));
      }
    },
    [fetchSauces, onRefresh]
  );

  // Handle POS visibility toggle
  const handleTogglePOSVisibility = useCallback(
    async (sauce: Sauce) => {
      const operationKey = `toggle-pos-${sauce.id}`;
      setOperationLoading(prev => ({ ...prev, [operationKey]: true }));

      try {
        await saucesAPI.togglePOSVisibility(sauce.id, !sauce.isPOSItem);
        await fetchSauces();

        toast({
          title: "Updated",
          description: `${sauce.name} ${!sauce.isPOSItem ? "added to" : "removed from"} POS`,
          duration: 2000
        });

        if (onRefresh) {
          onRefresh();
        }
      } catch (error) {
        console.error("❌ Error toggling POS visibility:", error);
        toast({
          title: "Error",
          description: "Failed to update POS visibility",
          variant: "destructive",
          duration: 3000
        });
      } finally {
        setOperationLoading(prev => ({ ...prev, [operationKey]: false }));
      }
    },
    [fetchSauces, onRefresh]
  );

  // Handle creating new sauce
  const handleCreateSauce = useCallback(() => {
    setSelectedSauce(null);
    setShowSauceForm(true);
  }, []);

  // Handle form cancel
  const handleFormCancel = useCallback(() => {
    setShowSauceForm(false);
    setSelectedSauce(null);
  }, []);

  return (
    <div className="h-full flex flex-col space-y-6 p-6">
      {/* Header with Statistics */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ChefHat className="w-6 h-6" />
            Sauce Management
          </h1>
          <p className="text-gray-600 mt-1">Create and manage sauce recipes from your inventory materials</p>
        </div>
        <Button onClick={handleCreateSauce} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Create New Sauce
        </Button>
      </div>

      {/* Sauce Table */}
      <div className="flex-1 overflow-hidden">
        <SauceTable sauces={sauces} materials={materials} onEditSauce={handleEditSauce} onDeleteSauce={handleDeleteSauce} onBulkDelete={handleBulkDeleteSauces} onTogglePOSVisibility={handleTogglePOSVisibility} />
      </div>

      {/* Sauce Form Dialog */}
      <Dialog open={showSauceForm} onOpenChange={setShowSauceForm} modal={true}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] sm:max-w-[90vw] lg:max-w-[80vw] xl:max-w-[70vw] rounded-lg p-0" onPointerDownOutside={e => e.preventDefault()} onInteractOutside={e => e.preventDefault()}>
          <DialogHeader className="px-6 py-4 border-b">
            <DialogTitle className="flex items-center gap-2 text-lg">
              <ChefHat className="h-5 w-5" />
              <span>{selectedSauce ? "Edit Sauce" : "Create New Sauce"}</span>
            </DialogTitle>
          </DialogHeader>

          <ScrollArea className="max-h-[calc(95vh-80px)]">
            <div className="p-0">
              <SauceForm sauce={selectedSauce || undefined} materials={materials} stockEntries={stockEntries} onSubmit={handleSauceSubmit} onCancel={handleFormCancel} />
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
