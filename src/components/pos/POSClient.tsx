import { menuAPI } from "@/api/menu.api.ts.tsx";
import { posAPI } from "@/api/pos.api.ts";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { MenuItem, NegativeStockWarning, SaleResponse, SectionAssignment } from "@/types/inventory";
import { formatCurrency } from "@/utils/conversionLogic";
import { AlertCircle, AlertTriangle, Calculator, Check, CreditCard, DollarSign, Grid3X3, Loader2, Minus, Package, Plus, Receipt, ShoppingCart, Trash2, X } from "lucide-react";
import { ReceiptPrinter } from "./ReceiptPrinter";

import React, { useCallback, useEffect, useRef, useState } from "react";

// Enhanced CartItem interface for POS
interface POSCartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  type: "material" | "menu";
  originalItem: SectionAssignment | MenuItem;
}

interface POSClientProps {
  materials: MenuItem[];
  sectionAssignments: SectionAssignment[];
  onSaleComplete?: (saleData: SaleResponse) => void;
}

export const POSClient: React.FC<POSClientProps> = ({ materials, sectionAssignments, onSaleComplete }) => {
  // State management
  const [selectedSectionId, setSelectedSectionId] = useState<string>("");
  const [cart, setCart] = useState<POSCartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [optimisticAssignments, setOptimisticAssignments] = useState<SectionAssignment[]>(sectionAssignments);
  const [negativeStockWarnings, setNegativeStockWarnings] = useState<NegativeStockWarning[]>([]);
  const [showNegativeStockDialog, setShowNegativeStockDialog] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState<string>("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [showReceiptDialog, setShowReceiptDialog] = useState(false);
  const [lastSaleData, setLastSaleData] = useState<SaleResponse | null>(null);

  const errorTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const successTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Helper functions
  const showError = useCallback((message: string) => {
    setError(message);
    if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
    errorTimeoutRef.current = setTimeout(() => setError(null), 5000);
  }, []);

  const showSuccess = useCallback((message: string) => {
    setSuccessMessage(message);
    if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current);
    successTimeoutRef.current = setTimeout(() => setSuccessMessage(null), 3000);
  }, []);

  // Update optimistic assignments when props change
  useEffect(() => {
    setOptimisticAssignments(sectionAssignments);
  }, [sectionAssignments]);

  // Fetch menu items
  useEffect(() => {
    const fetchMenuItems = async () => {
      try {
        const response = await menuAPI.getMenus();
        setMenuItems(response.data);
      } catch (error) {
        console.error("Failed to fetch menu items:", error);
        showError("Failed to load menu items");
      }
    };

    fetchMenuItems();
  }, [showError]);

  // Get unique sections
  const sections = Array.from(new Set(optimisticAssignments.map(assignment => assignment.sectionId))).map(sectionId => {
    const assignment = optimisticAssignments.find(a => a.sectionId === sectionId);
    return {
      id: sectionId,
      name: assignment?.section?.name || `Section ${sectionId}`
    };
  });

  // Get available items for selected section
  const availableItems = optimisticAssignments.filter(assignment => !selectedSectionId || assignment.sectionId === selectedSectionId).filter(assignment => assignment.assignedIndividualQuantity > 0 && (searchTerm === "" || assignment.material?.name.toLowerCase().includes(searchTerm.toLowerCase()) || assignment.material?.category?.toLowerCase().includes(searchTerm.toLowerCase())));

  // Get available menu items
  const availableMenuItems = menuItems.filter(menuItem => searchTerm === "" || menuItem.name.toLowerCase().includes(searchTerm.toLowerCase()) || menuItem.category?.toLowerCase().includes(searchTerm.toLowerCase()));

  // Get unique categories
  const categories = ["all", ...Array.from(new Set([...availableItems.map(item => item.material?.category).filter(Boolean), ...availableMenuItems.map(item => item.category).filter(Boolean)]))];

  // Filter items by category
  const filteredItems = activeCategory === "all" ? availableItems : availableItems.filter(item => item.material?.category === activeCategory);

  const filteredMenuItems = activeCategory === "all" ? availableMenuItems : availableMenuItems.filter(item => item.category === activeCategory);

  // Cart operations
  const addToCart = useCallback((item: any, type: "material" | "menu") => {
    const cartId = type === "material" ? `material-${item.id}` : `menu-${item.id}`;

    setCart(prevCart => {
      const existingItem = prevCart.find(cartItem => cartItem.id === cartId);

      if (existingItem) {
        return prevCart.map(cartItem => (cartItem.id === cartId ? { ...cartItem, quantity: cartItem.quantity + 1 } : cartItem));
      } else {
        const newItem: POSCartItem = {
          id: cartId,
          name: type === "material" ? item.material?.name : item.name,
          price: type === "material" ? item.material?.costPerUnit || 0 : item.price || 0,
          quantity: 1,
          type,
          originalItem: item
        };
        return [...prevCart, newItem];
      }
    });
  }, []);

  const updateCartQuantity = useCallback((cartId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      setCart(prevCart => prevCart.filter(item => item.id !== cartId));
    } else {
      setCart(prevCart => prevCart.map(item => (item.id === cartId ? { ...item, quantity: newQuantity } : item)));
    }
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  // Calculate totals
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = subtotal * 0.1; // 10% tax
  const total = subtotal + tax;

  // Handle payment
  const handlePayment = useCallback(async () => {
    if (cart.length === 0) {
      showError("Cart is empty");
      return;
    }

    setIsLoading(true);
    try {
      // Prepare sale data
      const saleData = {
        sectionId: selectedSectionId || sections[0]?.id,
        items: cart
          .filter(item => item.type === "material")
          .map(item => ({
            materialId: item.originalItem.materialId,
            assignmentId: item.originalItem.id,
            quantity: item.quantity,
            unitPrice: item.price,
            totalPrice: item.price * item.quantity,
            materialName: item.name
          })),
        menuItems: cart
          .filter(item => item.type === "menu")
          .map(item => ({
            menuItemId: item.originalItem.id,
            quantity: item.quantity,
            unitPrice: item.price,
            totalPrice: item.price * item.quantity,
            menuItemName: item.name
          })),
        totalAmount: total,
        paymentAmount: parseFloat(paymentAmount) || total,
        paymentMethod: "cash"
      };

      const response = await posAPI.createSale(saleData as any);

      if (response.data?.negativeStockWarnings && response.data.negativeStockWarnings.length > 0) {
        setNegativeStockWarnings(response.data.negativeStockWarnings);
        setShowNegativeStockDialog(true);
      }

      // Prepare receipt data
      const receiptData = {
        id: response.data?.sale?.id || `POS-${Date.now()}`,
        date: new Date().toLocaleDateString(),
        time: new Date().toLocaleTimeString(),
        cashier: "Current User", // You can get this from auth context
        items: cart.map(item => ({
          name: item.name,
          quantity: item.quantity,
          unitPrice: item.price,
          totalPrice: item.price * item.quantity,
          type: item.type
        })),
        subtotal,
        tax,
        total,
        paymentAmount: parseFloat(paymentAmount) || total,
        change: Math.max(0, (parseFloat(paymentAmount) || total) - total),
        paymentMethod: "cash"
      };

      setLastSaleData(receiptData);
      showSuccess(`Sale completed successfully! Total: ${formatCurrency(total)}`);
      clearCart();
      setPaymentAmount("");
      setShowPaymentDialog(false);
      setShowReceiptDialog(true);

      // Callback for parent component
      if (onSaleComplete) {
        onSaleComplete(response);
      }

      // Update optimistic assignments
      if (response.data?.updatedAssignments) {
        setOptimisticAssignments(response.data.updatedAssignments);
      }
    } catch (error: any) {
      console.error("Sale failed:", error);
      showError(error.response?.data?.message || "Sale failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [cart, selectedSectionId, sections, total, paymentAmount, subtotal, tax, showError, showSuccess, clearCart, onSaleComplete]);

  // Quick amount buttons for payment
  const quickAmounts = [10, 20, 50, 100, 200, 500];

  return (
    <div className="h-full flex bg-gray-100">
      {/* Left Panel - Cart/Order Details */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* Cart Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-800">Current Order</h2>
            {cart.length > 0 && (
              <Button variant="outline" size="sm" onClick={clearCart} className="text-red-600 hover:text-red-700">
                <Trash2 className="w-4 h-4 mr-1" />
                Clear
              </Button>
            )}
          </div>
        </div>

        {/* Order Items List */}
        <div className="flex-1 overflow-y-auto">
          {cart.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              <div className="text-sm font-medium mb-2">DELIVERY</div>
              <div className="text-xs text-gray-400">No items in cart</div>
            </div>
          ) : (
            <div className="p-4 space-y-3">
              <div className="text-sm font-medium text-gray-600 mb-3">DELIVERY</div>
              {cart.map(item => (
                <div key={item.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                  <div className="flex-1">
                    <div className="font-medium text-gray-800">{item.name}</div>
                    {item.type === "material" && <div className="text-xs text-gray-500">Extra Powdered Seasoning</div>}
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm" onClick={() => updateCartQuantity(item.id, item.quantity - 1)} className="w-6 h-6 p-0">
                        <Minus className="w-3 h-3" />
                      </Button>
                      <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
                      <Button variant="outline" size="sm" onClick={() => updateCartQuantity(item.id, item.quantity + 1)} className="w-6 h-6 p-0">
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                    <div className="w-16 text-right font-medium text-gray-800">{formatCurrency(item.price * item.quantity)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Order Summary */}
        {cart.length > 0 && (
          <div className="border-t border-gray-200 p-4 bg-gray-50">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Sub Total</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax</span>
                <span>{formatCurrency(tax)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tip</span>
                <span>$0.02</span>
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>Service Fee</span>
                <span>$0.60</span>
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>Small Order Fee</span>
                <span>$2.50</span>
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>Delivery Fee</span>
                <span>$2.50</span>
              </div>
              <div className="border-t border-gray-300 pt-2 mt-2">
                <div className="flex justify-between font-bold text-lg">
                  <span>TOTAL</span>
                  <span>{formatCurrency(total + 5.62)}</span>
                </div>
              </div>
            </div>

            <div className="flex space-x-2 mt-4">
              <Button variant="outline" className="flex-1">
                SAVE
              </Button>
              <Button className="flex-1 bg-teal-500 hover:bg-teal-600 text-white" onClick={() => setShowPaymentDialog(true)}>
                PAY {formatCurrency(total + 5.62)}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Right Panel - Product Grid */}
      <div className="flex-1 flex flex-col bg-white">
        {/* Top Controls */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex space-x-2">
              {categories.slice(0, 6).map(category => (
                <Button key={category} variant={activeCategory === category ? "default" : "outline"} size="sm" onClick={() => setActiveCategory(category)} className={`capitalize ${activeCategory === category ? "bg-teal-500 hover:bg-teal-600 text-white" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
                  {category === "all" ? "All" : category}
                </Button>
              ))}
            </div>
          </div>
        </div>
        {/* Product Grid */}
        <div className="flex-1 p-4 overflow-y-auto">
          <div className="grid grid-cols-4 gap-4">
            {/* Individual Items */}
            {filteredItems.map(assignment => (
              <Card key={assignment.id} className="cursor-pointer transition-all hover:shadow-lg hover:scale-105 border-2 border-teal-200 hover:border-teal-300" onClick={() => addToCart(assignment, "material")}>
                <CardContent className="p-4 text-center">
                  <div className="w-16 h-16 mx-auto mb-3 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Package className="w-8 h-8 text-gray-400" />
                  </div>
                  <h4 className="font-medium text-gray-800 mb-1">{assignment.material?.name}</h4>
                  <p className="text-lg font-bold text-gray-800">{formatCurrency(assignment.material?.costPerUnit || 0)}</p>
                </CardContent>
              </Card>
            ))}

            {/* Menu Items */}
            {filteredMenuItems.map(menuItem => (
              <Card key={menuItem.id} className="cursor-pointer transition-all hover:shadow-lg hover:scale-105 border-2 border-teal-200 hover:border-teal-300" onClick={() => addToCart(menuItem, "menu")}>
                <CardContent className="p-4 text-center">
                  <div className="w-16 h-16 mx-auto mb-3 bg-gray-100 rounded-lg flex items-center justify-center">
                    <ShoppingCart className="w-8 h-8 text-gray-400" />
                  </div>
                  <h4 className="font-medium text-gray-800 mb-1">{menuItem.name}</h4>
                  <p className="text-lg font-bold text-gray-800">{formatCurrency(menuItem.price || 0)}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Bottom Action Bar */}
        <div className="border-t border-gray-200 p-4 bg-gray-50">
          <div className="grid grid-cols-9 gap-2">
            <Button variant="outline" className="flex flex-col items-center p-3 h-16 bg-teal-500 text-white hover:bg-teal-600">
              <Grid3X3 className="w-5 h-5 mb-1" />
              <span className="text-xs">Speed Key</span>
            </Button>
            <Button variant="outline" className="flex flex-col items-center p-3 h-16">
              <Calculator className="w-5 h-5 mb-1" />
              <span className="text-xs">Depts</span>
            </Button>
            <Button variant="outline" className="flex flex-col items-center p-3 h-16">
              <ShoppingCart className="w-5 h-5 mb-1" />
              <span className="text-xs">Orders</span>
            </Button>
            <Button variant="outline" className="flex flex-col items-center p-3 h-16">
              <Package className="w-5 h-5 mb-1" />
              <span className="text-xs">Table Orders</span>
            </Button>
            <Button variant="outline" className="flex flex-col items-center p-3 h-16">
              <AlertCircle className="w-5 h-5 mb-1" />
              <span className="text-xs">Hold</span>
            </Button>
            <Button variant="outline" className="flex flex-col items-center p-3 h-16">
              <X className="w-5 h-5 mb-1" />
              <span className="text-xs">Void</span>
            </Button>
            <Button variant="outline" className="flex flex-col items-center p-3 h-16">
              <AlertTriangle className="w-5 h-5 mb-1" />
              <span className="text-xs">No Sales</span>
            </Button>
            <Button variant="outline" className="flex flex-col items-center p-3 h-16">
              <DollarSign className="w-5 h-5 mb-1" />
              <span className="text-xs">Refund</span>
            </Button>
            <Button variant="outline" className="flex flex-col items-center p-3 h-16">
              <Receipt className="w-5 h-5 mb-1" />
              <span className="text-xs">Price Check</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <CreditCard className="w-5 h-5" />
              <span>Process Payment</span>
            </DialogTitle>
            <DialogDescription>Complete the transaction</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{formatCurrency(total)}</div>
                <div className="text-sm text-slate-500">Total Amount</div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Payment Amount</label>
              <Input type="number" step="0.01" placeholder="Enter amount" value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} className="h-12 text-lg text-center" />
            </div>

            <div className="grid grid-cols-3 gap-2">
              {quickAmounts.map(amount => (
                <Button key={amount} variant="outline" onClick={() => setPaymentAmount(amount.toString())}>
                  {formatCurrency(amount)}
                </Button>
              ))}
            </div>

            {parseFloat(paymentAmount) > total && (
              <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                <div className="text-sm text-green-700 dark:text-green-300">Change: {formatCurrency(parseFloat(paymentAmount) - total)}</div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPaymentDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handlePayment} disabled={isLoading || !paymentAmount || parseFloat(paymentAmount) < total}>
              {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
              Complete Sale
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Negative Stock Warning Dialog */}
      <Dialog open={showNegativeStockDialog} onOpenChange={setShowNegativeStockDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              <span>Stock Warning</span>
            </DialogTitle>
            <DialogDescription>Some items have low or negative stock levels</DialogDescription>
          </DialogHeader>

          <div className="space-y-2 max-h-60 overflow-y-auto">
            {negativeStockWarnings.map((warning, index) => (
              <Alert key={index}>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>{warning.materialName}</strong>: Low stock - Available: {warning.availableQuantity}, Required: {warning.requiredQuantity}
                </AlertDescription>
              </Alert>
            ))}
          </div>

          <DialogFooter>
            <Button onClick={() => setShowNegativeStockDialog(false)}>Acknowledge</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Receipt Printer Dialog */}
      <ReceiptPrinter isOpen={showReceiptDialog} onClose={() => setShowReceiptDialog(false)} receiptData={lastSaleData} />

      {/* Success/Error Messages */}
      {successMessage && (
        <div className="fixed top-4 right-4 z-50">
          <Alert className="bg-green-50 border-green-200">
            <Check className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">{successMessage}</AlertDescription>
          </Alert>
        </div>
      )}

      {error && (
        <div className="fixed top-4 right-4 z-50">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      )}
    </div>
  );
};
