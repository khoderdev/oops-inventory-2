import { ordersAPI } from "@/api/orders.api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/components/ui/use-toast";
import { ORDER_STATUS_COLORS } from "@/constants/constants";
import { useAuth } from "@/contexts/AuthContext";
import { ReceiptData } from "@/types/inventory";
import { Order, OrderStatus } from "@/types/orders";
import { formatCurrency } from "@/utils/conversionLogic";
import { CheckCircle, ChefHat, Clock, CreditCard, Printer, Utensils, XCircle } from "lucide-react";
import React, { useState } from "react";
import { ReceiptPrinter } from "./ReceiptPrinter";

interface OrderDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  isLoading?: boolean;
  onOrderUpdate?: (updatedOrder: Order) => void;
}

export const OrderDetailsDialog: React.FC<OrderDetailsDialogProps> = ({ isOpen, onClose, order, isLoading = false, onOrderUpdate }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [showReceiptDialog, setShowReceiptDialog] = useState(false);
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
  const [isPrintingReceipt, setIsPrintingReceipt] = useState(false);

  // Check if user has admin or manager permissions
  const canModifyOrders = user?.role === "admin" || user?.role === "manager";

  // Get success message for status updates
  const getStatusSuccessMessage = (status: OrderStatus): string => {
    const messages: Record<OrderStatus, string> = {
      draft: "Order restored to draft!",
      confirmed: "Order confirmed successfully!",
      preparing: "Order marked as preparing!",
      ready: "Order marked as ready!",
      served: "Order marked as served!",
      paid: "Order marked as paid!",
      cancelled: "Order cancelled successfully!",
      complete: "Order completed successfully!"
    };
    return messages[status];
  };

  // Define available status transitions based on current status
  const getAvailableStatusTransitions = (currentStatus: OrderStatus): { status: OrderStatus; label: string; icon: React.ReactNode; color: string }[] => {
    const transitions: { [key in OrderStatus]?: { status: OrderStatus; label: string; icon: React.ReactNode; color: string }[] } = {
      draft: [
        { status: "confirmed", label: "Confirm Order", icon: <CheckCircle className="w-4 h-4" />, color: "bg-blue-600 hover:bg-blue-700" },
        { status: "preparing", label: "Start Preparing", icon: <ChefHat className="w-4 h-4" />, color: "bg-orange-600 hover:bg-orange-700" },
        { status: "cancelled", label: "Cancel Order", icon: <XCircle className="w-4 h-4" />, color: "bg-red-600 hover:bg-red-700" }
      ],
      confirmed: [
        { status: "preparing", label: "Start Preparing", icon: <ChefHat className="w-4 h-4" />, color: "bg-orange-600 hover:bg-orange-700" },
        { status: "ready", label: "Mark Ready", icon: <Clock className="w-4 h-4" />, color: "bg-green-600 hover:bg-green-700" },
        { status: "cancelled", label: "Cancel Order", icon: <XCircle className="w-4 h-4" />, color: "bg-red-600 hover:bg-red-700" }
      ],
      preparing: [
        { status: "ready", label: "Mark Ready", icon: <Clock className="w-4 h-4" />, color: "bg-green-600 hover:bg-green-700" },
        { status: "served", label: "Mark Served", icon: <Utensils className="w-4 h-4" />, color: "bg-purple-600 hover:bg-purple-700" },
        { status: "confirmed", label: "Back to Confirmed", icon: <CheckCircle className="w-4 h-4" />, color: "bg-blue-600 hover:bg-blue-700" }
      ],
      ready: [
        { status: "served", label: "Mark Served", icon: <Utensils className="w-4 h-4" />, color: "bg-purple-600 hover:bg-purple-700" },
        { status: "paid", label: "Mark Paid", icon: <CreditCard className="w-4 h-4" />, color: "bg-emerald-600 hover:bg-emerald-700" },
        { status: "preparing", label: "Back to Preparing", icon: <ChefHat className="w-4 h-4" />, color: "bg-orange-600 hover:bg-orange-700" }
      ],
      served: [
        { status: "paid", label: "Mark Paid", icon: <CreditCard className="w-4 h-4" />, color: "bg-emerald-600 hover:bg-emerald-700" },
        { status: "ready", label: "Back to Ready", icon: <Clock className="w-4 h-4" />, color: "bg-green-600 hover:bg-green-700" }
      ],
      paid: [{ status: "served", label: "Back to Served", icon: <Utensils className="w-4 h-4" />, color: "bg-purple-600 hover:bg-purple-700" }],
      cancelled: [
        { status: "draft", label: "Restore to Draft", icon: <CheckCircle className="w-4 h-4" />, color: "bg-gray-600 hover:bg-gray-700" },
        { status: "confirmed", label: "Restore & Confirm", icon: <CheckCircle className="w-4 h-4" />, color: "bg-blue-600 hover:bg-blue-700" }
      ]
    };

    return transitions[currentStatus] || [];
  };

  // Handle status update
  const handleStatusUpdate = async (newStatus: OrderStatus) => {
    if (!order || !canModifyOrders) return;

    setIsUpdatingStatus(true);
    try {
      const response = await ordersAPI.updateOrderStatus(order.id, newStatus);
      console.log("Order status updated successfully:", response);

      // Create updated order with the new status
      // Force the status to be what we requested, regardless of backend response
      // This handles cases where backend returns stale data
      const responseData = response as { data?: { order?: Partial<Order> }; order?: Partial<Order>; message?: string };
      const responseOrder = responseData?.data?.order || responseData?.order;

      const updatedOrder: Order = {
        ...order,
        ...(responseOrder || {}),
        status: newStatus, // ALWAYS use the requested status
        updatedAt: responseOrder?.updatedAt ? new Date(responseOrder.updatedAt) : new Date()
      };

      console.log("Forcing status update:", {
        requestedStatus: newStatus,
        backendReturnedStatus: responseOrder?.status,
        finalStatus: updatedOrder.status
      });

      console.log("Updated order object:", updatedOrder);

      // Call the callback to update the parent component
      if (onOrderUpdate) {
        onOrderUpdate(updatedOrder);
      }

      // Show success message
      toast({
        title: "Success!",
        description: getStatusSuccessMessage(newStatus),
        variant: "default"
      });

      // Auto-close dialog after successful update
      setTimeout(() => {
        console.log("Status update completed, closing dialog. New status:", newStatus);
        onClose();
      }, 1500); // Wait 1.5 seconds to let user see the success message

    } catch (error) {
      console.error("Failed to update order status:", error);
      
      // Show error message
      toast({
        title: "Error!",
        description: `Failed to update order status: ${error instanceof Error ? error.message : "Unknown error"}`,
        variant: "destructive"
      });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Handle print receipt
  const handlePrintReceipt = async () => {
    if (!order) return;

    setIsPrintingReceipt(true);
    try {
      const receiptData: ReceiptData = {
        id: order.orderNumber || order.id,
        date: new Date(order.createdAt).toLocaleDateString(),
        time: new Date(order.createdAt).toLocaleTimeString(),
        cashier: user?.fullName || "System",
        items:
          order.items?.map(item => ({
            name: item.name,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
            type: item.type
          })) || [],
        subtotal: order.subtotal,
        tax: order.tax || 0,
        total: order.total,
        paymentAmount: order.total,
        change: 0,
        paymentMethod: "cash",
        // Include discount information
        discountType: order.discountType || null,
        discountValue: order.discountValue || null,
        discountAmount: order.discountAmount || null,
        discountReason: order.discountReason || null
      };

      setReceiptData(receiptData);
      setShowReceiptDialog(true);
    } catch (error) {
      console.error("Failed to prepare receipt:", error);
    } finally {
      setIsPrintingReceipt(false);
    }
  };
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Order Details - {order?.orderNumber}</span>
            <div className="flex items-center space-x-2">
              {/* Print Receipt Button */}
              <Button variant="outline" size="sm" onClick={handlePrintReceipt} disabled={isPrintingReceipt || !order} className="flex items-center space-x-2">
                {isPrintingReceipt ? <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" /> : <Printer className="w-4 h-4" />}
                <span>Print</span>
              </Button>

              {/* Status Action Buttons - Only for Admin/Manager */}
              {canModifyOrders && order && (
                <div className="flex items-center space-x-2 pr-10">
                  {getAvailableStatusTransitions(order.status).map(transition => (
                    <Button key={transition.status} size="sm" onClick={() => handleStatusUpdate(transition.status)} disabled={isUpdatingStatus} className={`flex items-center space-x-2 text-white ${transition.color}`}>
                      {isUpdatingStatus ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : transition.icon}
                      <span>{transition.label}</span>
                    </Button>
                  ))}
                </div>
              )}
            </div>
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
                <div className="border rounded-lg overflow-hidden container mx-auto">
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
                  <div className="flex justify-between text-2xl font-bold border-t pt-2">
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

      {/* Receipt Printer Dialog */}
      <ReceiptPrinter
        isOpen={showReceiptDialog}
        onClose={() => {
          setShowReceiptDialog(false);
          setReceiptData(null);
        }}
        receiptData={receiptData}
        autoPrint={false}
      />
    </Dialog>
  );
};
