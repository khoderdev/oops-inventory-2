import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, Package, ArrowUp, TrendingUp } from "lucide-react";
import { StockRestorationItem } from "@/types/inventory";

interface StockRestorationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  saleId: string;
  stockRestorationReport: StockRestorationItem[];
}

export function StockRestorationModal({
  open,
  onOpenChange,
  saleId,
  stockRestorationReport
}: StockRestorationModalProps) {
  const totalItemsRestored = stockRestorationReport.length;
  const restorationSummary = stockRestorationReport
    .map(item => `${item.materialName}: +${item.quantityRestored} ${item.unit}`)
    .join(", ");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-6 w-6 text-green-600" />
            <DialogTitle className="text-green-800">Sale Reverted Successfully!</DialogTitle>
          </div>
          <DialogDescription>
            Sale #{saleId} has been reverted and all items have been restored to inventory.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Summary Card */}
          <Card className="border-green-200 bg-green-50">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <h3 className="font-semibold text-green-800">Restoration Summary</h3>
              </div>
              <p className="text-sm text-green-700 mb-2">
                <strong>{totalItemsRestored}</strong> item{totalItemsRestored === 1 ? '' : 's'} restored to inventory
              </p>
              <p className="text-xs text-green-600 break-words">
                {restorationSummary}
              </p>
            </CardContent>
          </Card>

          <Separator />

          {/* Detailed Restoration Report */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Package className="h-4 w-4" />
              Stock Restoration Details
            </h3>
            <div className="space-y-3">
              {stockRestorationReport.map((item, index) => (
                <Card key={index} className="border-l-4 border-l-blue-500">
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Package className="h-4 w-4 text-blue-600" />
                          <h4 className="font-medium text-gray-900">{item.materialName}</h4>
                          <Badge variant="outline" className="text-xs">
                            {item.type === "individual_item" ? "Individual Item" : "Menu Ingredient"}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                          <div className="flex items-center gap-2">
                            <ArrowUp className="h-3 w-3 text-green-500" />
                            <span className="text-gray-600">Quantity Restored:</span>
                            <span className="font-semibold text-green-600">
                              +{item.quantityRestored} {item.unit}
                            </span>
                          </div>
                          
                          {item.type === "individual_item" && (
                            <div className="flex items-center gap-2">
                              <span className="text-gray-600">Assignment:</span>
                              <span className="font-mono text-xs">
                                {item.oldAssignmentQuantity} → {item.newAssignmentQuantity}
                              </span>
                            </div>
                          )}
                          
                          <div className="flex items-center gap-2">
                            <span className="text-gray-600">Stock Level:</span>
                            <span className="font-mono text-xs">
                              {item.oldStockQuantity} → {item.newStockQuantity}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
            <CheckCircle className="mr-2 h-4 w-4" />
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
