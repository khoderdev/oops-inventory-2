import { menuAPI } from "@/api/menu.api.ts.tsx";
import { posAPI } from "@/api/pos.api.ts";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MenuItem, NegativeStockWarning, OrderType, POSCartItem, POSClientProps, SaleResponse, SectionAssignment, Table } from "@/types/inventory";
import { formatCurrency } from "@/utils/conversionLogic";
import { AlertCircle, AlertTriangle, Check, Trash2 } from "lucide-react";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { ActionBar } from "./ActionBar";
import { CategoryTabs } from "./CategoryTabs";
import { OrderItemsList } from "./OrderItemsList";
import { OrderSummary } from "./OrderSummary";
import { PaymentDialog } from "./PaymentDialog";
import { ProductGrid } from "./ProductGrid";
import { ReceiptPrinter } from "./ReceiptPrinter";
import { TablesLayout } from "./TablesLayout";

export const POSClient: React.FC<POSClientProps> = ({ sectionAssignments, onSaleComplete }) => {
  const [selectedSectionId] = useState<string>("");
  const [cart, setCart] = useState<POSCartItem[]>([]);
  const [searchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [optimisticAssignments, setOptimisticAssignments] = useState<SectionAssignment[]>(sectionAssignments);
  const [negativeStockWarnings, setNegativeStockWarnings] = useState<NegativeStockWarning[]>([]);
  const [showNegativeStockDialog, setShowNegativeStockDialog] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState<string>("");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [showReceiptDialog, setShowReceiptDialog] = useState(false);
  const [lastSaleData, setLastSaleData] = useState<SaleResponse | null>(null);
  const [orderType, setOrderType] = useState<OrderType>('takeaway');
  const [selectedTable, setSelectedTable] = useState<Table | undefined>(undefined);
  const [showTablesLayout, setShowTablesLayout] = useState(false);
  const [tables, setTables] = useState<Table[]>([]);
  const errorTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const successTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Generate mock tables data
  const generateMockTables = useCallback((): Table[] => {
    return [
      { id: '1', number: 1, seats: 2, status: 'available', position: { x: 20, y: 20 }, shape: 'round' },
      { id: '2', number: 2, seats: 4, status: 'occupied', position: { x: 40, y: 20 }, shape: 'square', 
        currentOrder: { orderId: 'ORD001', customerName: 'John Doe', startTime: new Date(), totalAmount: 45.50, itemCount: 3 } },
      { id: '3', number: 3, seats: 6, status: 'available', position: { x: 60, y: 20 }, shape: 'rectangle' },
      { id: '4', number: 4, seats: 2, status: 'reserved', position: { x: 80, y: 20 }, shape: 'round' },
      { id: '5', number: 5, seats: 4, status: 'available', position: { x: 20, y: 50 }, shape: 'square' },
      { id: '6', number: 6, seats: 8, status: 'occupied', position: { x: 40, y: 50 }, shape: 'rectangle',
        currentOrder: { orderId: 'ORD002', customerName: 'Smith Family', startTime: new Date(), totalAmount: 89.25, itemCount: 7 } },
      { id: '7', number: 7, seats: 2, status: 'cleaning', position: { x: 60, y: 50 }, shape: 'round' },
      { id: '8', number: 8, seats: 4, status: 'available', position: { x: 80, y: 50 }, shape: 'square' },
      { id: '9', number: 9, seats: 6, status: 'available', position: { x: 20, y: 80 }, shape: 'rectangle' },
      { id: '10', number: 10, seats: 4, status: 'available', position: { x: 40, y: 80 }, shape: 'square' },
      { id: '11', number: 11, seats: 2, status: 'available', position: { x: 60, y: 80 }, shape: 'round' },
      { id: '12', number: 12, seats: 8, status: 'available', position: { x: 80, y: 80 }, shape: 'rectangle' }
    ];
  }, []);

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

  // Initialize tables
  useEffect(() => {
    setTables(generateMockTables());
  }, [generateMockTables]);

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
        // Calculate price for material items
        let itemPrice = 0;
        if (type === "material") {
          // Get cost from stockEntry (where the actual cost data is stored)
          const stockEntry = item.stockEntry;
          if (stockEntry) {
            // Try costPerBaseUnit first (this is the cost per individual unit)
            if (stockEntry.costPerBaseUnit && stockEntry.costPerBaseUnit !== "0") {
              itemPrice = parseFloat(stockEntry.costPerBaseUnit);
            }
            // Fallback: calculate from totalCost and individual quantity
            else if (stockEntry.totalCost && stockEntry.purchasedIndividualQuantity) {
              itemPrice = parseFloat(stockEntry.totalCost) / stockEntry.purchasedIndividualQuantity;
            }
          }
        } else {
          itemPrice = item.price || 0;
        }

        const newItem: POSCartItem = {
          id: cartId,
          name: type === "material" ? item.material?.name : item.name,
          price: itemPrice,
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

  // Order type handlers
  const handleOrderTypeChange = useCallback((type: OrderType) => {
    setOrderType(type);
    if (type !== 'table') {
      setSelectedTable(undefined);
    }
  }, []);

  const handleTableSelect = useCallback(() => {
    setShowTablesLayout(true);
  }, []);

  const handleTableSelection = useCallback((table: Table) => {
    setSelectedTable(table);
    setOrderType('table');
    setShowTablesLayout(false);
    
    // If table is occupied, you might want to load existing order
    if (table.status === 'occupied' && table.currentOrder) {
      // Here you could load the existing order for this table
      console.log('Loading existing order for table:', table.number);
    }
  }, []);

  const handleCloseTablesLayout = useCallback(() => {
    setShowTablesLayout(false);
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
        <div className="border-b border-gray-200 p-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-800">Current Order</h2>
            {cart.length > 0 && <Trash2 className="w-6 h-6 mr-1 cursor-pointer text-red-600 hover:text-red-700" onClick={clearCart} />}
          </div>
        </div>

        {/* Order Items List */}
        <OrderItemsList 
          cart={cart} 
          updateCartQuantity={updateCartQuantity}
          orderType={orderType}
          selectedTable={selectedTable}
          onOrderTypeChange={handleOrderTypeChange}
          onTableSelect={handleTableSelect}
        />

        {/* Order Summary */}
        <OrderSummary cart={cart} subtotal={subtotal} total={total} onPaymentClick={() => setShowPaymentDialog(true)} />
      </div>

      {/* Right Panel - Product Grid */}
      <div className="flex-1 flex flex-col bg-white">
        {/* Top Controls */}
        <CategoryTabs categories={categories} activeCategory={activeCategory} onCategoryChange={setActiveCategory} />
        {/* Product Grid */}
        <ProductGrid filteredItems={filteredItems} filteredMenuItems={filteredMenuItems} onAddToCart={addToCart} />

        {/* Bottom Action Bar */}
        <ActionBar />
      </div>

      {/* Payment Dialog */}
      <PaymentDialog isOpen={showPaymentDialog} onClose={() => setShowPaymentDialog(false)} total={total} paymentAmount={paymentAmount} onPaymentAmountChange={setPaymentAmount} onPayment={handlePayment} isLoading={isLoading} />

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

      {/* Tables Layout Dialog */}
      {showTablesLayout && (
        <TablesLayout
          tables={tables}
          selectedTable={selectedTable}
          onTableSelect={handleTableSelection}
          onClose={handleCloseTablesLayout}
        />
      )}

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
