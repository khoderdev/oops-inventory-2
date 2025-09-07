import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Trash2, Package, ShoppingBag, Eye, AlertTriangle, Receipt } from "lucide-react";
import { SaleRecord, SoldItem, MenuItemSale } from "@/types/inventory";
import { formatCurrency } from "@/utils/conversionLogic";
import { formatDate } from "@/utils/formatDate";

interface DeleteItemData {
  saleId: string;
  itemId: string;
  itemType: "material" | "menu";
  itemName: string;
}

interface DeleteConfirmationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  saleRecord: SaleRecord | null;
  itemToDelete?: DeleteItemData | null;
}

export function DeleteConfirmationModal({
  open,
  onOpenChange,
  onConfirm,
  saleRecord,
  itemToDelete
}: DeleteConfirmationModalProps) {
  const isItemDeletion = !!itemToDelete;
  const displayRecord = saleRecord;

  if (!displayRecord) return null;

  const itemDetails =
    isItemDeletion && itemToDelete && saleRecord
      ? (() => {
          if (itemToDelete.itemType === "material") {
            const item = displayRecord.items?.find(i => i.materialId === itemToDelete.itemId);
            return item
              ? {
                  name: item.materialName || `Item ${item.materialId}`,
                  quantity: item.quantity,
                  unit: item.unit,
                  price: item.totalPrice
                }
              : null;
          } else {
            const item = displayRecord.menuItems?.find(i => i.menuItemId === itemToDelete.itemId);
            return item
              ? {
                  name: item.menuItemName || `Menu Item ${item.menuItemId}`,
                  quantity: item.quantity,
                  unit: "x",
                  price: item.totalPrice
                }
              : null;
          }
        })()
      : null;

  const totalItems = isItemDeletion ? 1 : (displayRecord.items?.length || 0) + (displayRecord.menuItems?.length || 0);

  const saleTotal =
    isItemDeletion && itemToDelete
      ? (() => {
          if (itemToDelete.itemType === "material") {
            return saleRecord?.items?.find((i: any) => i.materialId === itemToDelete.itemId)?.totalPrice || 0;
          } else {
            return saleRecord?.menuItems?.find((i: any) => i.menuItemId === itemToDelete.itemId)?.totalPrice || 0;
          }
        })()
      : saleRecord?.totalAmount || 0;

  const itemName = isItemDeletion && itemToDelete 
    ? itemToDelete.itemName 
    : '';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-6 w-6 text-destructive" />
            <DialogTitle className="text-destructive">
              {isItemDeletion ? 'Delete Item' : 'Delete Sale'}
            </DialogTitle>
          </div>
          <DialogDescription>
            {isItemDeletion 
              ? `Are you sure you want to delete "${itemDetails?.name}" from sale #${displayRecord.id}?`
              : `Are you sure you want to delete sale #${displayRecord.id}?`
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-destructive/10 p-4 rounded-md">
            <h3 className="font-medium text-destructive">This action will:</h3>
            <ul className="list-disc list-inside mt-2 space-y-1 text-sm text-foreground/80">
              {isItemDeletion ? (
                <>
                  <li>Remove <span className="font-semibold">"{itemDetails?.name}"</span> from the sale</li>
                  <li>Update the sale total amount</li>
                  <li>Preserve the sale record in the database</li>
                  <li>Keep all stock levels unchanged</li>
                </>
              ) : (
                <>
                  <li>Delete the sale from the sales history view</li>
                  <li>Preserve the sale record in the database</li>
                  <li>Keep all stock levels unchanged</li>
                  <li>Allow the sale to be restored later if needed</li>
                </>
              )}
            </ul>
          </div>

          {/* Summary Card */}
          <Card className="border-input">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 mb-2">
                {isItemDeletion ? <ShoppingBag className="h-4 w-4 text-foreground/70" /> : <Receipt className="h-4 w-4 text-foreground/70" />}
                <h3 className="font-semibold">{isItemDeletion ? "Item to Delete" : "Sale Details"}</h3>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                {isItemDeletion && itemDetails ? (
                  <>
                    <div>
                      <span className="text-foreground/70">Item Name:</span>
                      <p className="font-medium">{itemDetails.name}</p>
                    </div>
                    <div>
                      <span className="text-foreground/70">Quantity:</span>
                      <p className="font-medium">
                        {itemDetails.quantity} {itemDetails.unit}
                      </p>
                    </div>
                    <div>
                      <span className="text-foreground/70">Price:</span>
                      <p className="font-medium text-green-600">{formatCurrency(itemDetails.price)}</p>
                    </div>
                    <div>
                      <span className="text-foreground/70">Sale ID:</span>
                      <p className="font-mono">#{displayRecord.id}</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <span className="text-foreground/70">Sale Date:</span>
                      <p className="font-medium">{formatDate(new Date(displayRecord.saleDate))}</p>
                    </div>
                    <div>
                      <span className="text-foreground/70">Total Amount:</span>
                      <p className="font-bold text-green-600">{formatCurrency(saleTotal)}</p>
                    </div>
                    <div>
                      <span className="text-foreground/70">Items Count:</span>
                      <p className="font-medium">{totalItems} items</p>
                    </div>
                    <div>
                      <span className="text-foreground/70">Section:</span>
                      <p className="font-medium">{displayRecord.section?.name || `Section ${displayRecord.sectionId}`}</p>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          <Separator />


        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)} 
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button 
            variant="destructive" 
            onClick={() => {
              onConfirm();
              onOpenChange(false);
            }} 
            className="w-full sm:w-auto"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            {isItemDeletion ? 'Delete Item' : 'Delete Sale'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
