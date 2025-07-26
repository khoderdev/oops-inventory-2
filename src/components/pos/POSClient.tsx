import { menuAPI } from "@/api/menu.api.ts.tsx";
import { posAPI } from "@/api/pos.api.ts";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { MenuItem, MenuItemSale, NegativeStockWarning, Section, SectionAssignment, SoldItem, Material, SaleResponse } from "@/types/inventory";
import { formatCurrency, formatNumber } from "@/utils/conversionLogic";
import { ReceiptPrinter } from "./ReceiptPrinter";
import { 
  AlertCircle, 
  AlertTriangle, 
  Check, 
  Loader2, 
  Minus, 
  Package, 
  Plus, 
  Search, 
  ShoppingCart, 
  Trash2, 
  X,
  CreditCard,
  DollarSign,
  Receipt,
  Calculator,
  Grid3X3,
  List,
  Filter,
  Zap
} from "lucide-react";

import React, { useCallback, useEffect, useRef, useState } from "react";

// Enhanced CartItem interface for POS
interface POSCartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  type: 'material' | 'menu';
  originalItem: any; // SectionAssignment or MenuItem
}

interface POSClientProps {
  materials: any[];
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
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [showReceiptDialog, setShowReceiptDialog] = useState(false);
  const [lastSaleData, setLastSaleData] = useState<any>(null);

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
          price: type === "material" ? (item.material?.costPerUnit || 0) : (item.price || 0),
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
        cashier: 'Current User', // You can get this from auth context
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
        paymentMethod: 'cash'
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
    <div className="h-full flex bg-slate-50 dark:bg-slate-900">
      {/* Left Panel - Products */}
      <div className="flex-1 flex flex-col">
        {/* Search and Filters */}
        <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-4">
          <div className="flex items-center space-x-4 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input placeholder="Search products..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10 h-12 text-lg" />
            </div>
            <div className="flex items-center space-x-2">
              <Button variant={viewMode === "grid" ? "default" : "outline"} size="lg" onClick={() => setViewMode("grid")}>
                <Grid3X3 className="w-4 h-4" />
              </Button>
              <Button variant={viewMode === "list" ? "default" : "outline"} size="lg" onClick={() => setViewMode("list")}>
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Section Selection */}
          <div className="flex items-center space-x-2 mb-4">
            <Filter className="w-4 h-4 text-slate-500" />
            <div className="flex space-x-2 overflow-x-auto">
              <Button variant={!selectedSectionId ? "default" : "outline"} size="sm" onClick={() => setSelectedSectionId("")}>
                All Sections
              </Button>
              {sections.map(section => (
                <Button key={section.id} variant={selectedSectionId === section.id ? "default" : "outline"} size="sm" onClick={() => setSelectedSectionId(section.id)}>
                  {section.name}
                </Button>
              ))}
            </div>
          </div>

          {/* Category Selection */}
          <div className="flex space-x-2 overflow-x-auto">
            {categories.map(category => (
              <Button key={category} variant={activeCategory === category ? "default" : "outline"} size="sm" onClick={() => setActiveCategory(category)} className="capitalize">
                {category}
              </Button>
            ))}
          </div>
        </div>

        {/* Products Grid/List */}
        <ScrollArea className="flex-1 p-4">
          {/* Individual Items */}
          {filteredItems.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3 flex items-center">
                <Package className="w-5 h-5 mr-2" />
                Individual Items
              </h3>
              <div className={viewMode === "grid" ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4" : "space-y-2"}>
                {filteredItems.map(assignment => (
                  <Card key={assignment.id} className={`cursor-pointer transition-all hover:shadow-lg hover:scale-105 ${viewMode === "list" ? "flex items-center p-3" : "p-4"}`} onClick={() => addToCart(assignment, "material")}>
                    <CardContent className={viewMode === "list" ? "flex items-center space-x-4 p-0" : "p-0"}>
                      <div className={viewMode === "grid" ? "text-center" : "flex-1"}>
                        <h4 className="font-medium text-slate-900 dark:text-slate-100">{assignment.material?.name}</h4>
                        <p className="text-sm text-slate-500 dark:text-slate-400 capitalize">{assignment.material?.category}</p>
                        <div className="mt-2 flex items-center justify-between">
                          <span className="text-lg font-bold text-green-600">
                            {formatCurrency(assignment.material?.costPerUnit || 0)}
                          </span>
                          <Badge variant="secondary">{assignment.assignedIndividualQuantity} left</Badge>
                        </div>
                      </div>
                      {viewMode === "list" && (
                        <Button size="sm">
                          <Plus className="w-4 h-4" />
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Menu Items */}
          {filteredMenuItems.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center">
                <ShoppingCart className="w-5 h-5 mr-2" />
                Menu Items
              </h3>
              <div className={viewMode === "grid" ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4" : "space-y-2"}>
                {filteredMenuItems.map(menuItem => (
                  <Card key={menuItem.id} className={`cursor-pointer transition-all hover:shadow-lg hover:scale-105 ${viewMode === "list" ? "flex items-center p-3" : "p-4"}`} onClick={() => addToCart(menuItem, "menu")}>
                    <CardContent className={viewMode === "list" ? "flex items-center space-x-4 p-0" : "p-0"}>
                      <div className={viewMode === "grid" ? "text-center" : "flex-1"}>
                        <h4 className="font-medium text-slate-900 dark:text-slate-100">{menuItem.name}</h4>
                        <p className="text-sm text-slate-500 dark:text-slate-400 capitalize">{menuItem.category}</p>
                        <div className="mt-2">
                          <span className="text-lg font-bold text-green-600">
                            {formatCurrency(menuItem.price || 0)}
                          </span>
                        </div>
                      </div>
                      {viewMode === "list" && (
                        <Button size="sm">
                          <Plus className="w-4 h-4" />
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Right Panel - Cart */}
      <div className="w-96 bg-white dark:bg-slate-800 border-l border-slate-200 dark:border-slate-700 flex flex-col">
        {/* Cart Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold flex items-center">
              <ShoppingCart className="w-5 h-5 mr-2" />
              Cart ({cart.length})
            </h2>
            {cart.length > 0 && (
              <Button variant="outline" size="sm" onClick={clearCart}>
                <Trash2 className="w-4 h-4 mr-2" />
                Clear
              </Button>
            )}
          </div>
        </div>

        {/* Cart Items */}
        <ScrollArea className="flex-1 p-4">
          {cart.length === 0 ? (
            <div className="text-center text-slate-500 dark:text-slate-400 mt-8">
              <ShoppingCart className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Cart is empty</p>
              <p className="text-sm">Add items to get started</p>
            </div>
          ) : (
            <div className="space-y-3">
              {cart.map(item => (
                <Card key={item.id} className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium">{item.name}</h4>
                      <p className="text-sm text-slate-500 capitalize">
                        {item.type} • {formatCurrency(item.price)}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm" onClick={() => updateCartQuantity(item.id, item.quantity - 1)}>
                        <Minus className="w-3 h-3" />
                      </Button>
                      <span className="w-8 text-center font-medium">{item.quantity}</span>
                      <Button variant="outline" size="sm" onClick={() => updateCartQuantity(item.id, item.quantity + 1)}>
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                  <div className="mt-2 flex justify-between items-center">
                    <span className="text-sm text-slate-500">
                      {item.quantity} × {formatCurrency(item.price)}
                    </span>
                    <span className="font-bold">
                      {formatCurrency(item.price * item.quantity)}
                    </span>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Cart Summary & Checkout */}
        {cart.length > 0 && (
          <div className="p-4 border-t border-slate-200 dark:border-slate-700 space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax (10%):</span>
                <span>{formatCurrency(tax)}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-lg font-bold">
                <span>Total:</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>

            <Button className="w-full h-12 text-lg" onClick={() => setShowPaymentDialog(true)} disabled={isLoading}>
              {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CreditCard className="w-4 h-4 mr-2" />}
              Process Payment
            </Button>
          </div>
        )}
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
      <ReceiptPrinter
        isOpen={showReceiptDialog}
        onClose={() => setShowReceiptDialog(false)}
        receiptData={lastSaleData}
      />

      {/* Success/Error Messages */}
      {successMessage && (
        <div className="fixed top-4 right-4 z-50">
          <Alert className="bg-green-50 border-green-200">
            <Check className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              {successMessage}
            </AlertDescription>
          </Alert>
        </div>
      )}

      {error && (
        <div className="fixed top-4 right-4 z-50">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error}
            </AlertDescription>
          </Alert>
        </div>
      )}
    </div>
  );
};
