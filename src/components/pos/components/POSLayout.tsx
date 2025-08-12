import React, { useEffect } from "react";
import { GripVertical } from "lucide-react";
import { OrderItemsList } from "../OrderItemsList";
import { OrderSummary } from "../OrderSummary";
import { CategoryTabs } from "../CategoryTabs";
import { VirtualizedProductGrid } from "../VirtualizedProductGrid";
import { ActionBar } from "../ActionBar";
import { Button } from "@/components/ui/button";
import { POSLayoutProps } from "@/types/pos";

export const POSLayout: React.FC<POSLayoutProps> = ({
  leftPanelWidth,
  setLeftPanelWidth,
  rightPanelPixelWidth,
  setRightPanelPixelWidth,
  isResizing,
  setIsResizing,
  containerRef,
  activeView,
  setActiveView,
  cart,
  orderType,
  selectedTable,
  selectedEmployee,
  subtotal,
  total,
  hasUnsavedChanges,
  showSuccessCheckmark,
  currentOrder,
  appliedDiscount,
  categories,
  activeCategory,
  setActiveCategory,
  filteredPosItems,
  isProductsLoading,
  incompleteTableOrdersCount,
  incompleteOrdersCount,
  incompleteDeliveryTakeawayCount,
  updateCartQuantity,
  onOrderTypeChange,
  onTableSelect,
  onEmployeeSelect,
  onItemNotesChange,
  onShowItemNotes,
  onRemoveDiscount,
  onPaymentClick,
  onSaveClick,
  onAddToCart,
  clearCart,
  onSaveOrder,
  onPrintReceipt,
  onVoidOrder,
  onShowOrders,
  onShowReports,
  onCancelOrder,
  onDiscount,
  onShowPrinterSettings,
  hasSavedPrinter,
  savedPrinterName,
  isOrderLoading,
  canPrintReceipt,
  canVoidOrder
}) => {
  // Handle resize functionality
  useEffect(() => {
    const handleResize = () => {
      if (!containerRef.current) return;
      const containerWidth = containerRef.current.offsetWidth;
      if (containerWidth < 1024) {
        setLeftPanelWidth(33.33);
      }
      const rightPanelWidth = 100 - leftPanelWidth;
      const calculatedRightPanelPixelWidth = (rightPanelWidth / 100) * containerWidth;
      setRightPanelPixelWidth(calculatedRightPanelPixelWidth);
    };

    const timeoutId = setTimeout(() => {
      handleResize();
    }, 100);

    window.addEventListener("resize", handleResize);
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener("resize", handleResize);
    };
  }, [leftPanelWidth, containerRef, setLeftPanelWidth, setRightPanelPixelWidth]);

  const handleMouseDown = () => {
    setIsResizing(true);
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!containerRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    const newWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;
    const minWidth = 20;
    const maxWidth = 60;
    if (newWidth >= minWidth && newWidth <= maxWidth) {
      setLeftPanelWidth(newWidth);
      const rightPanelWidth = 100 - newWidth;
      const calculatedRightPanelPixelWidth = (rightPanelWidth / 100) * containerRect.width;
      setRightPanelPixelWidth(calculatedRightPanelPixelWidth);
    }
  };

  const handleMouseUp = () => {
    setIsResizing(false);
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
  };

  return (
    <div ref={containerRef} className="h-full flex flex-col lg:flex-row bg-gray-50 safe-area-padding">
      {/* Mobile Header */}
      {(hasUnsavedChanges || currentOrder || (cart && cart.length > 0)) && !showSuccessCheckmark && (
        <div className="lg:hidden bg-white border-b border-gray-200 p-3 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {(hasUnsavedChanges || currentOrder || (cart && cart.length > 0 && (orderType === "delivery" || orderType === "takeaway" || orderType === "bar" || orderType === "employees"))) && (
                <span className="text-sm text-blue-600 font-bold">
                  {currentOrder ? (
                    <div className="flex items-center space-x-1">
                      <span>{currentOrder.orderNumber}</span>
                      <span className={`text-xs font-medium ${currentOrder.status === "draft" ? "text-orange-600" : currentOrder.status === "paid" ? "text-green-600" : currentOrder.status === "cancelled" ? "text-red-600" : "text-gray-600"}`}>({currentOrder.status})</span>
                    </div>
                  ) : cart && cart.length > 0 && (orderType === "delivery" || orderType === "takeaway" || orderType === "bar" || orderType === "employees") ? (
                    <span>New Order</span>
                  ) : hasUnsavedChanges ? (
                    <span>New Order</span>
                  ) : null}
                </span>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">{cart && cart.length > 0 ? `${cart.length} items` : "Empty"}</span>
              {cart && cart.length > 0 && (
                <Button variant="outline" size="sm" onClick={onDiscount} className="text-xs px-2 py-1 h-6" disabled={currentOrder?.status === "paid" || currentOrder?.status === "served"}>
                  Discount
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Left Panel - Cart/Order Details */}
      <div
        className="cart flex flex-col h-full bg-white lg:border-r lg:border-gray-200"
        style={{
          width: typeof window !== "undefined" && window.innerWidth >= 1024 ? `${leftPanelWidth}%` : "100%"
        }}
      >
        {/* Desktop Cart Header */}
        <div className="card-header hidden lg:block border-b border-gray-200 px-3 flex-shrink-0">
          <div className={`flex items-center justify-between ${(hasUnsavedChanges || currentOrder || (cart && cart.length > 0)) && !showSuccessCheckmark ? "py-2" : ""}`}>
            <div className="flex flex-col xl:flex-row items-start xl:items-center space-y-1 xl:space-y-0 xl:space-x-2">
              {(hasUnsavedChanges || currentOrder || (cart && cart.length > 0 && (orderType === "delivery" || orderType === "takeaway" || orderType === "bar" || orderType === "employees"))) && !showSuccessCheckmark && (
                <span className="text-lg text-blue-600 font-bold">
                  {currentOrder ? (
                    <div className="flex items-center space-x-1">
                      <span>{currentOrder.orderNumber}</span>
                      <span className={`text-xs font-medium ${currentOrder.status === "draft" ? "text-orange-600" : currentOrder.status === "paid" ? "text-green-600" : currentOrder.status === "cancelled" ? "text-red-600" : "text-gray-600"}`}>({currentOrder.status})</span>
                    </div>
                  ) : cart && cart.length > 0 && (orderType === "delivery" || orderType === "takeaway" || orderType === "bar" || orderType === "employees") ? (
                    <span>New Order</span>
                  ) : hasUnsavedChanges ? (
                    <span>New Order</span>
                  ) : null}
                </span>
              )}
            </div>
            <div className="flex items-center space-x-2">
              {cart && cart.length > 0 && (
                <>
                  <Button variant="outline" size="sm" onClick={onDiscount} className="text-xs px-2 py-1 h-7" disabled={currentOrder?.status === "paid" || currentOrder?.status === "served"}>
                    Discount
                  </Button>
                  <button onClick={clearCart} className="text-red-600 hover:text-red-700">
                    Clear
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Order Items List */}
        <div className="flex-1 h-full relative overflow-hidden">
          <div className="h-full overflow-y-auto">
            <OrderItemsList
              cart={cart}
              updateCartQuantity={updateCartQuantity}
              orderType={orderType}
              selectedTable={selectedTable}
              selectedEmployee={selectedEmployee}
              onOrderTypeChange={onOrderTypeChange}
              onTableSelect={onTableSelect}
              onEmployeeSelect={onEmployeeSelect}
              incompleteTableOrdersCount={incompleteTableOrdersCount}
              orderStatus={currentOrder?.status}
              isOrderCompleted={currentOrder?.status === "paid" || currentOrder?.status === "served"}
              discountReason={appliedDiscount?.reason || currentOrder?.discountReason}
              leftPanelPixelWidth={containerRef.current ? (leftPanelWidth / 100) * containerRef.current.offsetWidth : 0}
              onItemNotesChange={onItemNotesChange}
              onShowItemNotes={onShowItemNotes}
            />
          </div>

          {/* Success Animation Overlay */}
          {showSuccessCheckmark && (
            <div className="absolute inset-0 flex items-center justify-center z-10">
              <div className="text-center">
                <div className="w-16 h-16 text-green-500 mx-auto mb-4 animate-scale-in">✓</div>
                <p className="text-green-700 font-medium text-lg">Order Completed!</p>
                <p className="text-green-600 text-sm mt-1">Cart cleared successfully</p>
              </div>
            </div>
          )}
        </div>

        {/* Order Summary */}
        {!showSuccessCheckmark && (
          <div className="flex-shrink-0 border-t border-gray-200 bg-white">
            <OrderSummary cart={cart} subtotal={subtotal} total={total} orderStatus={currentOrder?.status} isOrderCompleted={currentOrder?.status === "paid" || currentOrder?.status === "served"} appliedDiscount={appliedDiscount} onRemoveDiscount={onRemoveDiscount} onPaymentClick={onPaymentClick} onSaveClick={onSaveClick} />
          </div>
        )}
      </div>

      {/* Resize Handle (Desktop Only) */}
      {typeof window !== "undefined" && window.innerWidth >= 1024 && (
        <div onMouseDown={handleMouseDown} className={`hidden lg:block w-1 bg-gray-300/50 hover:bg-blue-400 cursor-col-resize transition-colors duration-200 relative group ${isResizing ? "bg-blue-500" : ""}`}>
          <div className="absolute inset-y-0 -left-1 -right-1 flex items-center justify-center">
            <GripVertical className="w-3 h-3 text-gray-400 group-hover:text-blue-500 transition-colors" />
          </div>
        </div>
      )}

      {/* Right Panel - Product Grid */}
      <div
        className="products flex flex-col h-full bg-white"
        style={{
          width: typeof window !== "undefined" && window.innerWidth >= 1024 ? `${100 - leftPanelWidth}%` : "100%"
        }}
      >
        {/* Mobile Toggle Buttons */}
        <div className="lg:hidden bg-gray-50 border-b border-gray-200 p-2 flex-shrink-0">
          <div className="flex space-x-2">
            <Button variant={activeView === "cart" ? "default" : "outline"} size="sm" onClick={() => setActiveView("cart")} className="flex-1 btn-touch">
              Cart ({cart?.length || 0})
            </Button>
            <Button variant={activeView === "products" ? "default" : "outline"} size="sm" onClick={() => setActiveView("products")} className="flex-1 btn-touch">
              Products
            </Button>
          </div>
        </div>

        {/* Mobile Cart View */}
        <div className={`lg:hidden ${activeView === "cart" ? "flex" : "hidden"} flex-col h-full`}>
          <div className="flex-1 overflow-y-auto">
            <OrderItemsList
              cart={cart}
              updateCartQuantity={updateCartQuantity}
              orderType={orderType}
              selectedTable={selectedTable}
              selectedEmployee={selectedEmployee}
              onOrderTypeChange={onOrderTypeChange}
              onTableSelect={onTableSelect}
              onEmployeeSelect={onEmployeeSelect}
              incompleteTableOrdersCount={incompleteTableOrdersCount}
              orderStatus={currentOrder?.status}
              isOrderCompleted={currentOrder?.status === "paid" || currentOrder?.status === "served"}
              discountReason={appliedDiscount?.reason || currentOrder?.discountReason}
              leftPanelPixelWidth={containerRef.current ? (leftPanelWidth / 100) * containerRef.current.offsetWidth : 0}
              onItemNotesChange={onItemNotesChange}
              onShowItemNotes={onShowItemNotes}
            />
          </div>

          {!showSuccessCheckmark && (
            <div className="flex-shrink-0 border-t border-gray-200 bg-white safe-area-bottom">
              <OrderSummary cart={cart} subtotal={subtotal} total={total} orderStatus={currentOrder?.status} isOrderCompleted={currentOrder?.status === "paid" || currentOrder?.status === "served"} appliedDiscount={appliedDiscount} onRemoveDiscount={onRemoveDiscount} onPaymentClick={onPaymentClick} onSaveClick={onSaveClick} />
            </div>
          )}
        </div>

        {/* Desktop/Mobile Product View */}
        <div className={`${activeView === "products" || (typeof window !== "undefined" && window.innerWidth >= 1024) ? "flex" : "hidden"} lg:flex flex-col h-full`}>
          {/* Category Tabs */}
          <div className="flex-shrink-0 border-b border-gray-200 bg-white">
            <CategoryTabs categories={categories} activeCategory={activeCategory} onCategoryChange={setActiveCategory} />
          </div>

          {/* Product Grid */}
          <div className="flex-1 overflow-y-auto !bg-gray-50">
            <VirtualizedProductGrid posItems={filteredPosItems} onAddToCart={onAddToCart} rightPanelPixelWidth={rightPanelPixelWidth} isLoading={isProductsLoading} />
          </div>

          {/* Action Bar */}
          <div className="flex-shrink-0 border-t border-gray-200 bg-white safe-area-bottom">
            <ActionBar
              onSaveOrder={onSaveOrder}
              onPrintReceipt={onPrintReceipt}
              onVoidOrder={onVoidOrder}
              onShowOrders={onShowOrders}
              onShowReports={onShowReports}
              onCancelOrder={onCancelOrder}
              onDiscount={onDiscount}
              hasUnsavedChanges={hasUnsavedChanges}
              isOrderLoading={isOrderLoading}
              canPrintReceipt={canPrintReceipt}
              canVoidOrder={canVoidOrder}
              incompleteOrdersCount={incompleteOrdersCount}
              incompleteDeliveryTakeawayCount={incompleteDeliveryTakeawayCount}
              onShowPrinterSettings={onShowPrinterSettings}
              hasSavedPrinter={hasSavedPrinter}
              savedPrinterName={savedPrinterName}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
