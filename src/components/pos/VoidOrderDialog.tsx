import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Order } from "@/types/orders";
import { formatCurrency } from "@/utils/conversionLogic";
import { AlertTriangle, Package, ShoppingBag } from "lucide-react";
import React, { useEffect, useState } from "react";

interface VoidOrderDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string, restoreStock: boolean) => void;
  order: Order | null;
  isLoading?: boolean;
}

export const VoidOrderDialog: React.FC<VoidOrderDialogProps> = ({ isOpen, onClose, onConfirm, order, isLoading = false }) => {
  const [reason, setReason] = useState("");
  const [restoreStock, setRestoreStock] = useState(false);

  const handleConfirm = () => {
    onConfirm(reason || "Order voided by user", restoreStock);
    setReason("");
    setRestoreStock(false);
  };

  const handleClose = () => {
    setReason("");
    setRestoreStock(false);
    onClose();
  };

  // Count material items that would have stock restored (only if order exists)
  const materialItemsCount = order?.items?.filter(item => item.type === "material").length || 0;
  const menuItemsCount = order?.items?.filter(item => item.type === "menu_item").length || 0;

  // Only show restore stock option for orders that have actually consumed stock
  // Draft orders haven't consumed stock yet, so there's nothing to restore
  const hasConsumedStock = order && order.status !== "draft" && order.status !== "cancelled";
  const shouldShowRestoreStock = hasConsumedStock && materialItemsCount > 0;

  // Set default restoreStock value based on whether stock restoration is applicable
  useEffect(() => {
    setRestoreStock(shouldShowRestoreStock);
  }, [shouldShowRestoreStock]);

  if (!order) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="m-0 p-0 bg-white overflow-hidden">
        <div className="w-full h-full flex flex-col overflow-hidden">
          <DialogHeader className="flex-shrink-0 p-2 border-b">
            <DialogTitle className="flex items-center justify-center space-x-2 text-red-600 font-semibold text-2xl">
              <AlertTriangle className="w-6 h-6" />
              <span>Void Order</span>
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 p-6 overflow-y-auto">
            <div className="space-y-4">
              {/* Order Information */}
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-gray-700">Order #{order.orderNumber}</span>
                  <span className="font-bold text-xl text-teal-600">{formatCurrency(order.total)}</span>
                </div>
                <div className="text-sm text-gray-600">
                  <div>
                    Status: <span className="capitalize">{order.status}</span>
                  </div>
                  <div>
                    Type: <span className="capitalize">{order.orderType}</span>
                  </div>
                  {order.tableId && <div>Table: {order.tableId}</div>}
                </div>
              </div>

              {/* Order Items Summary */}
              {order.items && order.items.length > 0 && (
                <div className="bg-blue-50 p-3 rounded-lg">
                  <h4 className="font-medium text-gray-700 mb-2">Order Items ({order.items.length})</h4>
                  <div className="space-y-1 text-sm">
                    {materialItemsCount > 0 && (
                      <div className="flex items-center space-x-2 text-blue-700">
                        <Package className="w-4 h-4" />
                        <span>{materialItemsCount} individual item(s)</span>
                      </div>
                    )}
                    {menuItemsCount > 0 && (
                      <div className="flex items-center space-x-2 text-green-700">
                        <ShoppingBag className="w-4 h-4" />
                        <span>{menuItemsCount} menu item(s)</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Stock Restoration Option */}
              {shouldShowRestoreStock && (
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex-1">
                    <Label htmlFor="restore-stock" className="text-sm font-medium text-green-800">
                      Restore Stock
                    </Label>
                    <p className="text-xs text-green-600 mt-1">Add consumed materials back to inventory ({materialItemsCount} item(s))</p>
                  </div>
                  <Switch id="restore-stock" checked={restoreStock} onCheckedChange={setRestoreStock} />
                </div>
              )}

              {/* Void Reason */}
              <div className="space-y-2">
                <Label htmlFor="void-reason">Reason for Voiding (Optional)</Label>
                <Input id="void-reason" placeholder="e.g., Customer cancelled, Wrong order, etc." value={reason} onChange={e => setReason(e.target.value)} disabled={isLoading} />
              </div>

              {/* Warning Message */}
              <div className="bg-red-50 border border-red-200 p-3 rounded-lg">
                <div className="flex items-start space-x-2">
                  <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-red-700">
                    <p className="font-medium">Warning:</p>
                    <ul className="mt-1 space-y-1 text-xs">
                      <li>• This order will be marked as cancelled/voided</li>
                      <li>• The order cannot be recovered after voiding</li>
                      {order.tableId && <li>• The table will be freed for new customers</li>}
                      {restoreStock && shouldShowRestoreStock && <li>• Stock levels will be restored for material items</li>}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-center items-center mt-4">
              <Button variant="outline" className="w-full rounded-none" onClick={handleClose} disabled={isLoading}>
                Cancel
              </Button>
              <Button variant="destructive" className="w-full rounded-none" onClick={handleConfirm} disabled={isLoading}>
                {isLoading ? "Voiding..." : "Void Order"}
              </Button>
            </div>
            {/* <DialogFooter className="flex-shrink-0 flex space-x-2 p-6 border-t bg-red-300">
              <Button variant="outline" onClick={handleClose} disabled={isLoading}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleConfirm} disabled={isLoading}>
                {isLoading ? "Voiding..." : "Void Order"}
              </Button>
            </DialogFooter> */}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
