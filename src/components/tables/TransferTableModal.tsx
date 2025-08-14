import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { tablesAPI } from '@/api/tables.api';
import { Move, ArrowRight, Package, AlertTriangle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Table } from '@/types/inventory';

interface TransferTableModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTransferComplete: () => void;
  tables: Table[];
  sourceTable: Table | null;
  sourceOrder?: any; // Order details if available
}

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: string;
  total: string;
}

export const TransferTableModal: React.FC<TransferTableModalProps> = ({
  isOpen,
  onClose,
  onTransferComplete,
  tables,
  sourceTable,
  sourceOrder
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [transferType, setTransferType] = useState<'full' | 'partial'>('full');
  const [destinationTableId, setDestinationTableId] = useState('');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [createNewOrder, setCreateNewOrder] = useState(true);

  // Get available destination tables (exclude source table and tables with orders for full transfer)
  const availableDestinations = tables.filter(table => {
    if (!sourceTable || table.id === sourceTable.id) return false;
    if (transferType === 'full' && table.status === 'opened') return false;
    return table.status === 'available' || table.status === 'opened';
  });

  const destinationTable = tables.find(t => t.id.toString() === destinationTableId);
  const destinationHasOrder = destinationTable?.status === 'opened';

  useEffect(() => {
    if (sourceOrder?.items) {
      setSelectedItems(sourceOrder.items.map((item: OrderItem) => item.id));
    }
  }, [sourceOrder]);

  const handleItemSelection = (itemId: string, checked: boolean) => {
    setSelectedItems(prev => 
      checked 
        ? [...prev, itemId]
        : prev.filter(id => id !== itemId)
    );
  };

  const handleSelectAll = (checked: boolean) => {
    if (sourceOrder?.items) {
      setSelectedItems(checked ? sourceOrder.items.map((item: OrderItem) => item.id) : []);
    }
  };

  const handleTransfer = async () => {
    if (!sourceTable || !destinationTableId) return;

    setIsLoading(true);
    try {
      if (transferType === 'full') {
        // Transfer entire order
        const response = await tablesAPI.transferOrder({
          fromTableId: sourceTable.id.toString(),
          toTableId: destinationTableId,
          orderId: sourceOrder?.id || ''
        });
        toast.success(response.data.message);
      } else {
        // Transfer selected items
        if (selectedItems.length === 0) {
          toast.error('Please select at least one item to transfer');
          setIsLoading(false);
          return;
        }

        const response = await tablesAPI.transferItems({
          fromTableId: sourceTable.id.toString(),
          toTableId: destinationTableId,
          itemIds: selectedItems,
          createNewOrder: !destinationHasOrder || createNewOrder
        });
        toast.success(response.data.message);
      }

      onTransferComplete();
      onClose();
      resetForm();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Transfer failed');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setTransferType('full');
    setDestinationTableId('');
    setSelectedItems([]);
    setCreateNewOrder(true);
  };

  if (!sourceTable || !sourceOrder) return null;

  const selectedItemsCount = selectedItems.length;
  const totalItems = sourceOrder.items?.length || 0;
  const selectedTotal = sourceOrder.items
    ?.filter((item: OrderItem) => selectedItems.includes(item.id))
    ?.reduce((sum: number, item: OrderItem) => sum + parseFloat(item.totalPrice || item.total || '0'), 0) || 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Move className="w-5 h-5" />
            Transfer Order Items
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Source Table Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Package className="w-5 h-5" />
                From: Table {sourceTable.number}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-2">
                <span>{sourceTable.name}</span>
                <Badge variant="secondary">{totalItems} items</Badge>
              </div>
              <div className="text-sm text-muted-foreground">
                Order Total: ${sourceOrder.total || '0.00'}
              </div>
            </CardContent>
          </Card>

          {/* Transfer Type Selection */}
          <div className="space-y-4">
            <Label className="text-base font-medium">Transfer Type</Label>
            <div className="flex gap-4">
              <Button
                variant={transferType === 'full' ? 'default' : 'outline'}
                onClick={() => setTransferType('full')}
                className="flex-1"
              >
                Transfer Entire Order
              </Button>
              <Button
                variant={transferType === 'partial' ? 'default' : 'outline'}
                onClick={() => setTransferType('partial')}
                className="flex-1"
              >
                Transfer Selected Items
              </Button>
            </div>
          </div>

          {/* Item Selection (for partial transfer) */}
          {transferType === 'partial' && sourceOrder.items && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Select Items to Transfer</CardTitle>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={selectedItemsCount === totalItems}
                      onCheckedChange={handleSelectAll}
                    />
                    <Label className="text-sm">Select All</Label>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {sourceOrder.items.map((item: OrderItem) => (
                  <div key={item.id} className="flex items-center justify-between p-2 border rounded">
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={selectedItems.includes(item.id)}
                        onCheckedChange={(checked) => handleItemSelection(item.id, checked as boolean)}
                      />
                      <div>
                        <div className="font-medium">{item.name}</div>
                        <div className="text-sm text-muted-foreground">
                          Qty: {item.quantity} × ${item.unitPrice || item.price}
                        </div>
                      </div>
                    </div>
                    <div className="font-medium">${item.totalPrice || item.total}</div>
                  </div>
                ))}
                
                {selectedItemsCount > 0 && (
                  <div className="mt-4 p-3 bg-blue-50 rounded border border-blue-200">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-blue-800">
                        Selected: {selectedItemsCount} of {totalItems} items
                      </span>
                      <span className="font-bold text-blue-800">
                        ${selectedTotal.toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Destination Table Selection */}
          <div className="space-y-2">
            <Label className="text-base font-medium">Destination Table</Label>
            <Select value={destinationTableId} onValueChange={setDestinationTableId}>
              <SelectTrigger>
                <SelectValue placeholder="Select destination table" />
              </SelectTrigger>
              <SelectContent>
                {availableDestinations.map(table => (
                  <SelectItem key={table.id} value={table.id.toString()}>
                    <div className="flex items-center justify-between w-full">
                      <span>Table {table.number}: {table.name}</span>
                      <Badge 
                        variant={table.status === 'opened' ? 'destructive' : 'secondary'}
                        className="ml-2"
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
          {destinationHasOrder && transferType === 'partial' && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p>Destination table has an active order. Choose how to handle the transfer:</p>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      checked={createNewOrder}
                      onCheckedChange={setCreateNewOrder}
                    />
                    <Label className="text-sm">
                      Create new order (recommended for separate billing)
                    </Label>
                  </div>
                  {!createNewOrder && (
                    <p className="text-sm text-orange-600">
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
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="font-medium text-green-800">Transfer Preview</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span>Table {sourceTable.number}</span>
                    <ArrowRight className="w-4 h-4" />
                    <span>Table {destinationTable?.number}</span>
                  </div>
                  <div className="text-right">
                    {transferType === 'full' ? (
                      <div>
                        <div>Entire Order</div>
                        <div className="font-bold">${sourceOrder.total}</div>
                      </div>
                    ) : (
                      <div>
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

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleTransfer}
            disabled={
              isLoading || 
              !destinationTableId || 
              (transferType === 'partial' && selectedItemsCount === 0)
            }
            className="flex items-center gap-2"
          >
            {isLoading ? 'Transferring...' : (
              <>
                <Move className="w-4 h-4" />
                Transfer {transferType === 'full' ? 'Order' : `${selectedItemsCount} Items`}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
