import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, Trash2, Package, ShoppingBag, Eye, EyeOff } from "lucide-react";
import { SaleRecord, SoldItem, MenuItemSale } from "@/types/inventory";
import { formatCurrency } from "@/utils/conversionLogic";
import { formatDate } from "@/utils/formatDate";

interface DeleteConfirmationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  saleRecord: SaleRecord | null;
}

export function DeleteConfirmationModal({
  open,
  onOpenChange,
  saleRecord
}: DeleteConfirmationModalProps) {
  if (!saleRecord) return null;

  const totalItems = (saleRecord.items?.length || 0) + (saleRecord.menuItems?.length || 0);
  const saleTotal = saleRecord.totalAmount || 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-6 w-6 text-blue-600" />
            <DialogTitle className="text-blue-800">Sale Hidden Successfully!</DialogTitle>
          </div>
          <DialogDescription>
            Sale #{saleRecord.id} has been hidden from view. The sale data is preserved but no longer visible in the sales history.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Summary Card */}
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 mb-2">
                <EyeOff className="h-4 w-4 text-blue-600" />
                <h3 className="font-semibold text-blue-800">Sale Summary</h3>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-blue-700">Sale Date:</span>
                  <p className="font-medium">{formatDate(new Date(saleRecord.saleDate))}</p>
                </div>
                <div>
                  <span className="text-blue-700">Total Amount:</span>
                  <p className="font-bold text-green-600">{formatCurrency(saleTotal)}</p>
                </div>
                <div>
                  <span className="text-blue-700">Items Count:</span>
                  <p className="font-medium">{totalItems} items</p>
                </div>
                <div>
                  <span className="text-blue-700">Section:</span>
                  <p className="font-medium">{saleRecord.section?.name || `Section ${saleRecord.sectionId}`}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Separator />

          {/* Hidden Items Details */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Hidden Sale Items
            </h3>
            <div className="space-y-3">
              {/* Individual Items */}
              {saleRecord.items && saleRecord.items.length > 0 && (
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
                              <Badge variant="outline" className="text-xs">Individual</Badge>
                            </div>
                            <div className="text-right text-sm">
                              <div className="font-medium">{item.quantity} {item.unit}</div>
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
              {saleRecord.menuItems && saleRecord.menuItems.length > 0 && (
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
                              <Badge variant="outline" className="text-xs bg-green-50">Menu</Badge>
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
                  <p className="text-sm text-yellow-700">
                    This is a "soft delete" operation. The sale data is preserved in the database and can be restored later if needed. 
                    No inventory changes have been made - all stock levels remain unchanged.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
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
