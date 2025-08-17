import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { tablesAPI } from "@/api/tables.api";
import { Move, ArrowRight, Package, AlertTriangle, CheckCircle, Info } from "lucide-react";
import { toast } from "sonner";
import { OrderItem, TransferTableModalProps } from "@/types/orders";

export const TransferTableModal: React.FC<TransferTableModalProps> = ({ isOpen, onClose, onTransferComplete, tables, sourceTable, sourceOrder }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [transferType, setTransferType] = useState<"full" | "partial">("full");
  const [destinationTableId, setDestinationTableId] = useState("");
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [createNewOrder, setCreateNewOrder] = useState(true);
  const [showInfoModal, setShowInfoModal] = useState(false);

  const availableDestinations = tables.filter(table => {
    if (!sourceTable) return false;
    if (!table?.id) return false; // skip tables without valid ID
    if (sourceTable.id && table.id === sourceTable.id) return false;
    if (transferType === "full" && table.status === "opened") return false;
    return table.status === "available" || table.status === "opened";
  });

  const destinationTable = tables.find(t => t?.id && String(t.id) === destinationTableId);
  const destinationHasOrder = destinationTable?.status === "opened";

  useEffect(() => {
    // Reset form when modal opens
    if (isOpen) {
      setTransferType("full");
      setDestinationTableId("");
      setSelectedItems([]);
      setCreateNewOrder(true);
      setShowInfoModal(false);
    }
  }, [isOpen]);

  useEffect(() => {
    // Start with no items selected by default
    setSelectedItems([]);
  }, [sourceOrder]);

  const handleItemSelection = (itemId: string, checked: boolean) => {
    setSelectedItems(prev => (checked ? [...prev, itemId] : prev.filter(id => id !== itemId)));
  };

  const handleSelectAll = (checked: boolean) => {
    if (sourceOrder?.items) {
      setSelectedItems(checked ? sourceOrder.items.map((item: OrderItem) => String(item.id)) : []);
    }
  };

  const handleTransfer = async () => {
    if (!sourceTable || !destinationTableId) {
      toast.error("Please select a destination table");
      return;
    }

    const fromTableId = sourceTable.id?.toString();
    const toTableId = destinationTableId;
    const orderId = sourceOrder?.id;

    console.log("Transfer validation:", {
      fromTableId,
      toTableId,
      orderId,
      sourceTable,
      sourceOrder
    });

    if (!fromTableId) {
      toast.error("Source table ID is missing");
      return;
    }

    if (!toTableId) {
      toast.error("Destination table ID is missing");
      return;
    }

    if (!orderId) {
      toast.error("Order ID is missing");
      return;
    }

    setIsLoading(true);
    try {
      if (transferType === "full") {
        // Transfer entire order
        const response = await tablesAPI.transferOrder({
          fromTableId,
          toTableId,
          orderId
        });
        toast.success(response.data.message);
      } else {
        // Transfer selected items
        if (selectedItems.length === 0) {
          toast.error("Please select at least one item to transfer");
          setIsLoading(false);
          return;
        }

        const response = await tablesAPI.transferItems({
          fromTableId,
          toTableId,
          itemIds: selectedItems,
          createNewOrder: !destinationHasOrder || createNewOrder
        });
        toast.success(response.data.message);
      }

      onTransferComplete();
      onClose();
      resetForm();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Transfer failed");
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setTransferType("full");
    setDestinationTableId("");
    setSelectedItems([]);
    setCreateNewOrder(true);
  };

  if (!sourceTable || !sourceOrder) return null;

  const selectedItemsCount = selectedItems.length;
  const totalItems = sourceOrder.items?.length || 0;
  const selectedTotal = sourceOrder.items?.filter((item: OrderItem) => selectedItems.includes(String(item.id)))?.reduce((sum: number, item: OrderItem) => sum + parseFloat(String(item.totalPrice) || "0"), 0) || 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-4xl max-h-[90vh] overflow-hidden p-0 flex flex-col">
        <DialogHeader className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 sm:px-6 py-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <Move className="w-5 h-5 sm:w-6 sm:h-6" />
              <span className="truncate">Transfer Order Items</span>
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-6 w-6 p-0 hover:bg-red-100 rounded-md"
            >
              <svg
                className="h-4 w-4 text-red-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4">
          <div className="space-y-4 sm:space-y-6">
          {/* Source Table Info */}
          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3 mb-3">
                <div className="flex items-center gap-2 min-w-0">
                  <Package className="w-4 h-4 text-gray-600 flex-shrink-0" />
                  <span className="font-medium truncate">From: Table {sourceTable.number}</span>
                  {sourceTable.name && (
                    <span className="text-sm text-muted-foreground truncate">({sourceTable.name})</span>
                  )}
                </div>
                <Badge variant="secondary" className="text-xs self-start sm:self-auto flex-shrink-0">
                  {totalItems} items
                </Badge>
              </div>
              <div className="text-sm font-medium text-green-600">
                Order Total: ${sourceOrder.total || "0.00"}
              </div>
            </CardContent>
          </Card>

          {/* Transfer Type Selection */}
          <div className="space-y-3 sm:space-y-4">
            <Label className="text-base font-medium">Transfer Type</Label>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
              <Button 
                variant={transferType === "full" ? "default" : "outline"} 
                onClick={() => setTransferType("full")} 
                className="flex-1 text-sm sm:text-base h-10 sm:h-11"
              >
                <span className="truncate">Transfer Entire Order</span>
              </Button>
              <Button 
                variant={transferType === "partial" ? "default" : "outline"} 
                onClick={() => setTransferType("partial")} 
                className="flex-1 text-sm sm:text-base h-10 sm:h-11"
              >
                <span className="truncate">Transfer Selected Items</span>
              </Button>
            </div>
          </div>

          {/* Item Selection (for partial transfer) */}
          {transferType === "partial" && sourceOrder.items && (
            <Card>
              <CardHeader className="p-3 sm:p-6 pb-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <CardTitle className="text-base sm:text-lg">Select Items to Transfer</CardTitle>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={selectedItemsCount === totalItems}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                        className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 cursor-pointer"
                      />
                    </div>
                    <Label className="text-sm whitespace-nowrap cursor-pointer" onClick={() => handleSelectAll(selectedItemsCount !== totalItems)}>
                      Select All
                    </Label>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 p-3 sm:p-6 pt-0">
                <div className="max-h-60 sm:max-h-80 overflow-y-auto space-y-2">
                  {sourceOrder.items.map((item: OrderItem) => {
                    const isSelected = selectedItems.includes(String(item.id));
                    return (
                      <div 
                        key={item.id} 
                        className={`flex items-center justify-between p-2 sm:p-3 border rounded cursor-pointer transition-colors hover:bg-gray-50 ${
                          isSelected ? 'bg-blue-50 border-blue-200' : 'border-gray-200'
                        }`}
                        onClick={() => handleItemSelection(String(item.id), !isSelected)}
                      >
                        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                          <div className="relative">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                e.stopPropagation();
                                handleItemSelection(String(item.id), e.target.checked);
                              }}
                              className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 cursor-pointer"
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="font-medium text-sm sm:text-base truncate">{item.name}</div>
                            <div className="text-xs sm:text-sm text-muted-foreground">
                              Qty: {item.quantity} × ${item.unitPrice || item.price}
                            </div>
                          </div>
                        </div>
                        <div className="font-medium text-sm sm:text-base flex-shrink-0 ml-2">
                          ${item.totalPrice || item.total}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {selectedItemsCount > 0 && (
                  <div className="mt-3 sm:mt-4 p-3 bg-blue-50 rounded border border-blue-200">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0">
                      <span className="font-medium text-blue-800 text-sm sm:text-base">
                        Selected: {selectedItemsCount} of {totalItems} items
                      </span>
                      <span className="font-bold text-blue-800 text-sm sm:text-base">
                        ${selectedTotal.toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Destination Table Selection */}
          <div className="space-y-2 sm:space-y-3">
            <Label className="text-base font-medium">Destination Table</Label>
            <Select value={destinationTableId} onValueChange={setDestinationTableId}>
              <SelectTrigger className="h-10 sm:h-11 text-sm sm:text-base">
                <SelectValue placeholder="Select destination table" />
              </SelectTrigger>
              <SelectContent className="max-h-60 sm:max-h-80">
                {availableDestinations.map(table => (
                  <SelectItem key={String(table.id)} value={String(table.id)} className="p-2 sm:p-3">
                    <div className="flex items-center justify-between w-full min-w-0">
                      <span className="truncate mr-2 text-sm sm:text-base">
                        Table {table.number}: {table.name}
                      </span>
                      <Badge 
                        variant={table.status === "opened" ? "destructive" : "secondary"} 
                        className="ml-2 text-xs flex-shrink-0"
                      >
                        {table.status}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Destination Options */}
          {destinationTableId && destinationHasOrder && transferType === "partial" && (
            <Alert variant="warning">
              <AlertTriangle className="h-4 w-4 !text-orange-500 flex-shrink-0 mt-0.5" />
              <AlertDescription>
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-start gap-2">
                    <p className="text-sm sm:text-base flex-1">
                      Destination table has an active order. Choose how to handle the transfer:
                    </p>
                    <TooltipProvider>
                      <Tooltip delayDuration={0}>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 hover:bg-blue-100 self-start sm:self-center flex-shrink-0"
                            onClick={() => setShowInfoModal(true)}
                          >
                            <Info className="h-4 w-4 text-blue-600" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Click for detailed explanation</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="relative mt-0.5">
                      <input
                        type="checkbox"
                        checked={createNewOrder}
                        onChange={(e) => setCreateNewOrder(e.target.checked)}
                        className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 cursor-pointer"
                      />
                    </div>
                    <Label className="text-sm leading-relaxed">
                      Create new order (recommended for separate billing)
                    </Label>
                  </div>
                  {!createNewOrder && (
                    <p className="text-sm font-bold text-orange-600">
                      Items will be merged into the existing order
                    </p>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Transfer Preview */}
          {destinationTableId && (
            <Card className="border-green-200 bg-green-50">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center gap-2 mb-2 sm:mb-3">
                  <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                  <span className="font-medium text-green-800 text-sm sm:text-base">Transfer Preview</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm sm:text-base">Table {sourceTable.number}</span>
                    <ArrowRight className="w-4 h-4 flex-shrink-0" />
                    <span className="text-sm sm:text-base">Table {destinationTable?.number}</span>
                  </div>
                  <div className="text-left sm:text-right">
                    {transferType === "full" ? (
                      <div className="text-sm sm:text-base">
                        <div>Entire Order</div>
                        <div className="font-bold">${sourceOrder.total}</div>
                      </div>
                    ) : (
                      <div className="text-sm sm:text-base">
                        <div>{selectedItemsCount} items</div>
                        <div className="font-bold">${selectedTotal.toFixed(2)}</div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          </div>
        </div>

        <DialogFooter className="sticky bottom-0 z-10 bg-white border-t border-gray-200 px-4 sm:px-6 py-4 flex-shrink-0 flex flex-col sm:flex-row gap-2 sm:gap-0">
          <Button 
            variant="outline" 
            onClick={onClose} 
            disabled={isLoading}
            className="w-full sm:w-auto order-2 sm:order-1"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleTransfer} 
            disabled={isLoading || !destinationTableId || (transferType === "partial" && selectedItemsCount === 0)} 
            className="flex items-center justify-center gap-2 w-full sm:w-auto order-1 sm:order-2"
          >
            {isLoading ? (
              <span className="text-sm sm:text-base">Transferring...</span>
            ) : (
              <>
                <Move className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm sm:text-base truncate">
                  Transfer {transferType === "full" ? "Order" : `${selectedItemsCount} Items`}
                </span>
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>

      {/* Info Modal */}
      <Dialog open={showInfoModal} onOpenChange={setShowInfoModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Info className="w-5 h-5 text-blue-600" />
              Transfer Options Explained
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              When transferring items to a table that already has an active order, you have two options:
            </p>
            
            <div className="space-y-4">
              <div className="border rounded-lg p-3 bg-green-50 border-green-200">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="font-medium text-green-800">Create New Order (Recommended)</span>
                </div>
                <ul className="text-sm text-gray-700 space-y-1 ml-6">
                  <li>• Creates a completely separate order for transferred items</li>
                  <li>• Each order gets its own bill and receipt</li>
                  <li>• Perfect for different customer groups</li>
                  <li>• Easier to manage and track individual orders</li>
                </ul>
                <div className="mt-2 text-xs text-green-700 bg-green-100 p-2 rounded">
                  <strong>Example:</strong> Table 4 will have Order #1 ($15.00) and Order #2 ($20.90) = 2 separate bills
                </div>
              </div>
              
              <div className="border rounded-lg p-3 bg-orange-50 border-orange-200">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-orange-600" />
                  <span className="font-medium text-orange-800">Merge with Existing Order</span>
                </div>
                <ul className="text-sm text-gray-700 space-y-1 ml-6">
                  <li>• Adds transferred items to the existing order</li>
                  <li>• Everything goes on one combined bill</li>
                  <li>• Use when it's the same customer group</li>
                  <li>• All items will be billed together</li>
                </ul>
                <div className="mt-2 text-xs text-orange-700 bg-orange-100 p-2 rounded">
                  <strong>Example:</strong> Table 4 will have 1 combined order ($35.90) = 1 total bill
                </div>
              </div>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                <strong>💡 Tip:</strong> Choose "Create New Order" when in doubt - it's safer and gives you more flexibility for billing and order management.
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button onClick={() => setShowInfoModal(false)} className="w-full">
              Got it!
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
};
