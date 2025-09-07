import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
              ? `Are you sure you want to delete "${itemName}" from sale #${displayRecord.id}?`
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
                  <li>Remove <span className="font-semibold">"{itemName}"</span> from the sale</li>
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
            <p className="mt-2 text-sm text-destructive/80">
              This is a "soft delete" - the {isItemDeletion ? 'item' : 'sale data'} will be preserved but hidden from view.
            </p>
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

          {/* Hidden Items Details */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Eye className="h-4 w-4" />
              {isItemDeletion ? "Deleted Item" : "Hidden Sale Items"}
            </h3>
            <div className="space-y-3">
              {/* Individual Items */}
              {isItemDeletion && itemToDelete?.itemType === "material" && displayRecord.items?.some(i => i.materialId === itemToDelete.itemId) && (
                <div>
                  <h4 className="text-sm font-medium text-gray-600 mb-2">Deleted Item</h4>
                  <div className="grid gap-2">
                    {displayRecord.items
                      .filter(item => item.materialId === itemToDelete.itemId)
                      .map((item, index) => (
                        <Card key={index} className="border-l-4 border-l-red-500">
                          <CardContent className="pt-3 pb-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Package className="h-4 w-4 text-red-600" />
                                <span className="font-medium">{item.materialName || `Item ${item.materialId}`}</span>
                                <Badge variant="destructive" className="text-xs">
                                  Deleted
                                </Badge>
                              </div>
                              <div className="text-right text-sm">
                                <div className="font-medium">
                                  {item.quantity} {item.unit}
                                </div>
                                <div className="text-green-600 font-semibold">{formatCurrency(item.totalPrice)}</div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                  </div>
                </div>
              )}

              {isItemDeletion && itemToDelete?.itemType === "menu" && displayRecord.menuItems?.some(i => i.menuItemId === itemToDelete.itemId) && (
                <div>
                  <h4 className="text-sm font-medium text-gray-600 mb-2">Deleted Menu Item</h4>
                  <div className="grid gap-2">
                    {displayRecord.menuItems
                      .filter(item => item.menuItemId === itemToDelete.itemId)
                      .map((item, index) => (
                        <Card key={index} className="border-l-4 border-l-red-500">
                          <CardContent className="pt-3 pb-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <ShoppingBag className="h-4 w-4 text-red-600" />
                                <span className="font-medium">{item.menuItemName || `Menu Item ${item.menuItemId}`}</span>
                                <Badge variant="destructive" className="text-xs">
                                  Deleted
                                </Badge>
                              </div>
                              <div className="text-right text-sm">
                                <div className="font-medium">{item.quantity} x</div>
                                <div className="text-green-600 font-semibold">{formatCurrency(item.totalPrice)}</div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                  </div>
                </div>
              )}

              {!isItemDeletion && saleRecord.items && saleRecord.items.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-600 mb-2">Individual Items</h4>
                  <div className="grid gap-2">
                    {saleRecord.items.map((item: SoldItem, index: number) => (
                      <Card key={index} className="border-l-4 border-l-blue-500">
                        <CardContent className="pt-3 pb-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Package className="h-4 w-4 text-blue-600" />
                              <span className="font-medium">{item.materialName || `Item ${item.materialId}`}</span>
                              <Badge variant="outline" className="text-xs">
                                Individual
                              </Badge>
                            </div>
                            <div className="text-right text-sm">
                              <div className="font-medium">
                                {item.quantity} {item.unit}
                              </div>
                              <div className="text-green-600 font-semibold">{formatCurrency(item.totalPrice)}</div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Menu Items */}
              {!isItemDeletion && saleRecord.menuItems && saleRecord.menuItems.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-600 mb-2">Menu Items</h4>
                  <div className="grid gap-2">
                    {saleRecord.menuItems.map((menuItem: MenuItemSale, index: number) => (
                      <Card key={index} className="border-l-4 border-l-green-500">
                        <CardContent className="pt-3 pb-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <ShoppingBag className="h-4 w-4 text-green-600" />
                              <span className="font-medium">{menuItem.menuItemName || `Menu Item ${menuItem.menuItemId}`}</span>
                              <Badge variant="outline" className="text-xs bg-green-50">
                                Menu
                              </Badge>
                            </div>
                            <div className="text-right text-sm">
                              <div className="font-medium">Qty: {menuItem.quantity}</div>
                              <div className="text-green-600 font-semibold">{formatCurrency(menuItem.totalPrice)}</div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Important Notice */}
          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="pt-4">
              <div className="flex items-start gap-2">
                <Eye className="h-4 w-4 text-yellow-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-yellow-800 mb-1">Important Notice</h4>
                  <p className="text-sm text-yellow-700">This is a "soft delete" operation. The sale data is preserved in the database and can be restored later if needed. No inventory changes have been made - all stock levels remain unchanged.</p>
                </div>
              </div>
            </CardContent>
          </Card>
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
