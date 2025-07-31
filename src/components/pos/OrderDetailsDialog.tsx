import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ORDER_STATUS_COLORS } from "@/constants/constants";
import { Order } from "@/types/orders";
import { formatCurrency } from "@/utils/conversionLogic";
import React from "react";

interface OrderDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  isLoading?: boolean;
}

export const OrderDetailsDialog: React.FC<OrderDetailsDialogProps> = ({ isOpen, onClose, order, isLoading = false }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Order Details - {order?.orderNumber}</span>
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <div className="text-gray-500 font-medium">Loading order details...</div>
            </div>
          </div>
        ) : order ? (
          <ScrollArea className="max-h-[70vh]">
            <div className="space-y-6 p-1">
              {/* Order Header */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <h3 className="font-semibold text-gray-900">Order Information</h3>
                  <div className="space-y-1 text-sm">
                    <div>
                      <span className="font-medium">Order ID:</span> {order.id}
                    </div>
                    <div>
                      <span className="font-medium">Order Number:</span> {order.orderNumber}
                    </div>
                    <div>
                      <span className="font-medium">Status:</span> <Badge className={`${ORDER_STATUS_COLORS[order.status]} ml-2`}>{order.status}</Badge>
                    </div>
                    <div>
                      <span className="font-medium">Type:</span> {order.orderType}
                    </div>
                    {order.tableNumber && (
                      <div>
                        <span className="font-medium">Table:</span> {order.tableNumber}
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="font-semibold text-gray-900">Customer Information</h3>
                  <div className="space-y-1 text-sm">
                    <div>
                      <span className="font-medium">Name:</span> {order.customerName || "N/A"}
                    </div>
                    <div>
                      <span className="font-medium">Phone:</span> {order.customerPhone || "N/A"}
                    </div>
                    <div>
                      <span className="font-medium">Address:</span> {order.customerAddress || "N/A"}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="font-semibold text-gray-900">Timing</h3>
                  <div className="space-y-1 text-sm">
                    <div>
                      <span className="font-medium">Created:</span> {new Date(order.createdAt).toLocaleString()}
                    </div>
                    <div>
                      <span className="font-medium">Updated:</span> {new Date(order.updatedAt).toLocaleString()}
                    </div>
                    {order.estimatedReadyTime && (
                      <div>
                        <span className="font-medium">Ready Time:</span> {new Date(order.estimatedReadyTime).toLocaleString()}
                      </div>
                    )}
                    {order.completedAt && (
                      <div>
                        <span className="font-medium">Completed:</span> {new Date(order.completedAt).toLocaleString()}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-900">Order Items</h3>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead>Item</TableHead>
                        <TableHead className="text-center">Qty</TableHead>
                        <TableHead className="text-right">Unit Price</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {order?.items?.length ? (
                        order.items.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell>
                              <div>
                                <div className="font-medium">{item.name}</div>
                                {item.notes && <div className="text-sm text-gray-500">{item.notes}</div>}
                                <Badge variant="outline" className="text-xs mt-1">
                                  {item.type}
                                </Badge>
                              </div>
                            </TableCell>
                            <TableCell className="text-center">{item.quantity}</TableCell>
                            <TableCell className="text-right">{formatCurrency(item.unitPrice)}</TableCell>
                            <TableCell className="text-right font-medium">{formatCurrency(item.totalPrice)}</TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center text-gray-500 py-8">
                            No items found for this order
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Order Summary */}
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-900">Order Summary</h3>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal:</span>
                    <span>{formatCurrency(order.subtotal)}</span>
                  </div>
                  {order.discountAmount && order.discountAmount > 0 && (
                    <div className="flex justify-between text-sm text-orange-600">
                      <span>Discount ({order.discountType === "percentage" ? `${order.discountValue}%` : formatCurrency(order.discountValue || 0)}):</span>
                      <span>-{formatCurrency(order.discountAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span>Tax:</span>
                    <span>{formatCurrency(order.tax)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold border-t pt-2">
                    <span>Total:</span>
                    <span className="text-green-600">{formatCurrency(order.total)}</span>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {order.notes && (
                <div className="space-y-2">
                  <h3 className="font-semibold text-gray-900">Notes</h3>
                  <div className="bg-yellow-50 p-3 rounded-lg text-sm">{order.notes}</div>
                </div>
              )}
            </div>
          </ScrollArea>
        ) : null}
      </DialogContent>
    </Dialog>
  );
};
