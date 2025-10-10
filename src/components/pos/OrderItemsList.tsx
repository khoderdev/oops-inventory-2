import { Button } from "@/components/ui/button";
import { getOrderTypeIcon, getOrderTypeLabel } from "@/constants/constants";
import { Employee } from "@/types/employee";
import { OrderItemsListProps, POSCartItem } from "@/types/inventory";
import { OrderType } from "@/types/orders";
import { formatCurrency } from "@/utils/conversionLogic";
import { FileText, Minus, Plus } from "lucide-react";
import React, { Suspense } from "react";
import { EmployeeSelector } from "../employees/EmployeeSelector";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { updateCartQuantity as updateCartQuantityAction, setOrderType, setSelectedEmployee, setSelectedItemForNotes, setShowItemNotesDialog, setItemNotes } from "@/store/slices/posSlice";

// Lazy load ItemNotesDialog for better performance
const ItemNotesDialog = React.lazy(() => import("./ItemNotesDialog"));

// We keep props for backward compatibility while using Redux internally
const OrderItemsListBase: React.FC<OrderItemsListProps> = ({ cart: propCart, updateCartQuantity: propUpdateCartQuantity, orderType: propOrderType, selectedTable: propSelectedTable, selectedEmployee: propSelectedEmployee, onOrderTypeChange, onTableSelect, onEmployeeSelect, incompleteTableOrdersCount, orderStatus: propOrderStatus, isOrderCompleted = false, discountReason: propDiscountReason, leftPanelPixelWidth = 0, onShowItemNotes }) => {
  const dispatch = useAppDispatch();

  // Get state from Redux
  const reduxState = useAppSelector(state => state.pos);

  // Use Redux state if available, otherwise fall back to props
  const cart = reduxState.cart.length > 0 ? reduxState.cart : propCart;
  const orderType = reduxState.orderType || propOrderType;
  const selectedTable = reduxState.selectedTable || propSelectedTable;
  const selectedEmployee = reduxState.selectedEmployee || propSelectedEmployee;
  const orderStatus = reduxState.currentOrder?.status || propOrderStatus;
  const discountReason = reduxState.appliedDiscount?.reason || propDiscountReason;
  const selectedItemForNotesObj = reduxState.selectedItemForNotes;
  const showItemNotesDialog = reduxState.showItemNotesDialog;
  const isCompleted = isOrderCompleted || orderStatus === "paid" || orderStatus === "served";
  const shouldShowLabels = leftPanelPixelWidth > 430;

  // Get the ID of the selected item for notes from the Redux state
  const selectedItemForNotes = selectedItemForNotesObj?.id || null;

  // Use a simple array reference instead of useMemo
  const stableCart = Array.isArray(cart) ? cart : [];

  // Safely derive a department label from possible formats (object/string)
  const getDeptLabel = React.useCallback((dept: Employee["department"] | string | null | undefined) => {
    if (!dept) return "";
    return typeof dept === "string" ? dept : dept.name || dept.code || "";
  }, []);

  const handleQuantityUpdate = React.useCallback(
    (cartId: string, newQuantity: number) => {
      if (isCompleted) {
        return;
      }
      // Use Redux action first, then fall back to prop function if needed
      dispatch(updateCartQuantityAction({ cartId, newQuantity }));
      // Also call the prop function for backward compatibility
      if (propUpdateCartQuantity) {
        propUpdateCartQuantity(cartId, newQuantity);
      }
    },
    [isCompleted, dispatch, propUpdateCartQuantity]
  );

  const handleEmployeeSelectClick = React.useCallback(() => {
    // Set order type to employees to show the dropdown
    dispatch(setOrderType("employees"));
    // Also call the prop function for backward compatibility
    if (onOrderTypeChange) {
      onOrderTypeChange("employees");
    }
  }, [dispatch, onOrderTypeChange]);

  const handleEmployeeSelected = React.useCallback(
    (employee: Employee | null) => {
      if (employee) {
        // Update Redux state
        dispatch(setSelectedEmployee(employee));
        dispatch(setOrderType("employees"));

        // Also call prop functions for backward compatibility
        if (onEmployeeSelect) {
          onEmployeeSelect(employee);
        }
        if (onOrderTypeChange) {
          onOrderTypeChange("employees");
        }
      }
    },
    [dispatch, onEmployeeSelect, onOrderTypeChange]
  );

  const handleItemClick = React.useCallback(
    (itemId: string) => {
      if (isCompleted) return;
      const item = stableCart.find(item => item.id === itemId) || null;
      dispatch(setSelectedItemForNotes(selectedItemForNotesObj?.id === itemId ? null : item));
    },
    [isCompleted, dispatch, stableCart, selectedItemForNotesObj]
  );

  const handleItemNotesClick = React.useCallback(
    (e: React.MouseEvent, item: POSCartItem) => {
      e.stopPropagation();
      if (isCompleted) {
        return;
      }
      // Update Redux state to show dialog for this specific item
      dispatch(setSelectedItemForNotes(item));
      dispatch(setShowItemNotesDialog(true));

      // Also call prop function for backward compatibility
      if (onShowItemNotes) {
        onShowItemNotes(item);
      }
    },
    [isCompleted, dispatch, onShowItemNotes]
  );

  // Handle notes change - integrates with Redux
  const handleNotesChange = React.useCallback(
    (itemId: string, notes: string) => {
      // Update the item notes in Redux cart
      dispatch(setItemNotes({ itemId, notes }));
      // Close the dialog
      dispatch(setShowItemNotesDialog(false));
    },
    [dispatch]
  );

  // Handle dialog close
  const handleCloseNotesDialog = React.useCallback(() => {
    dispatch(setShowItemNotesDialog(false));
  }, [dispatch]);

  // Create ref outside of useEffect to track previous cart length
  const prevLengthRef = React.useRef<number | null>(null);

  // Debug logging in useEffect to avoid render phase issues
  React.useEffect(() => {
    // Only log when cart length actually changes
    if (stableCart.length > 0 && prevLengthRef.current !== stableCart.length) {
      console.log("🔍 OrderItemsList has items:", stableCart.length);
      prevLengthRef.current = stableCart.length;
    }
  }, [stableCart.length]);

  // Memoize button rendering to prevent unnecessary re-renders
  const orderTypeButtons = React.useMemo(() => {
    return (["delivery", "takeaway", "bar", "table", "employees"] as OrderType[]).map(type => {
      let badgeCount = 0;
      if (type === "table" && incompleteTableOrdersCount) badgeCount = incompleteTableOrdersCount;

      const handleClick = () => {
        if (type === "table") {
          console.log("🔍 [OrderItemsList] TABLE BUTTON CLICKED");
          console.log("🔍 [OrderItemsList] onTableSelect exists?", !!onTableSelect);
          console.log("🔍 [OrderItemsList] incompleteTableOrdersCount:", incompleteTableOrdersCount);

          if (onTableSelect) {
            console.log("🔍 [OrderItemsList] Calling onTableSelect()");
            onTableSelect();
            console.log("🔍 [OrderItemsList] onTableSelect() called successfully");
          } else {
            console.error("❌ [OrderItemsList] onTableSelect is undefined!");
          }
        } else if (type === "employees") {
          handleEmployeeSelectClick();
        } else {
          // Update Redux state
          dispatch(setOrderType(type));
          // Also call prop function for backward compatibility
          if (onOrderTypeChange) {
            onOrderTypeChange(type);
          }
        }
      };

      return (
        <Button key={type} variant={orderType === type ? "default" : "outline"} size="sm" onClick={handleClick} className={`relative flex items-center justify-center ${shouldShowLabels ? "h-10" : "h-8"} rounded-none transition-all duration-200 ${orderType === type ? "bg-teal-500 hover:bg-teal-600 text-white" : "hover:bg-gray-50"}`}>
          <div className="flex items-center justify-center">
            {getOrderTypeIcon(type)}
            {shouldShowLabels && <span className="text-xs font-medium ml-1">{getOrderTypeLabel(type, selectedTable, selectedEmployee, discountReason)}</span>}
          </div>
          {badgeCount > 0 && <span className={`absolute top-1 right-1 bg-red-500 text-white rounded-full flex items-center justify-center font-bold ${shouldShowLabels ? "h-5 w-5 text-xs" : "h-4 w-4 text-[10px]"}`}>{badgeCount > 99 ? "99+" : badgeCount}</span>}
        </Button>
      );
    });
  }, [orderType, selectedTable, selectedEmployee, discountReason, shouldShowLabels, incompleteTableOrdersCount, onTableSelect, handleEmployeeSelectClick, dispatch, onOrderTypeChange]);

  return (
    <div className="flex-1 flex flex-col h-full">
      <div className="flex-shrink-0 border-b border-gray-100 bg-teal-500/25">
        <div className="grid grid-cols-5">{orderTypeButtons}</div>

        {/* Current Order Type Display */}
        <div className={`my-2 px-2 flex items-center justify-center text-sm font-medium text-blue-600 ${shouldShowLabels ? "flex-row space-x-2" : "flex-col space-y-1"}`}>
          <div className="flex items-center space-x-2">
            {getOrderTypeIcon(orderType)}
            <span className={shouldShowLabels ? "text-sm" : "text-xs"}>{getOrderTypeLabel(orderType, selectedTable, selectedEmployee, discountReason)}</span>
          </div>
          {shouldShowLabels && orderType === "table" && selectedTable && <span className="text-xs text-gray-500">({selectedTable.seats} seats)</span>}
          {shouldShowLabels && orderType === "employees" && selectedEmployee && (
            <span className="text-xs text-gray-500">
              ({getDeptLabel(selectedEmployee.department)} - {selectedEmployee.discountPercentage}% discount)
            </span>
          )}
        </div>
      </div>

      {/* Cart Items - Scrollable */}
      <div className="flex-1 overflow-y-auto">
        {stableCart.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            <div className="text-sm font-medium mb-2">{getOrderTypeLabel(orderType, selectedTable, selectedEmployee)}</div>
            <div className="text-xs text-gray-400">No items in cart</div>
          </div>
        ) : (
          <div className="p-4 space-y-3">
            {stableCart.map(item => (
              <div key={item.id} className="space-y-2">
                {/* Main Item Row */}
                <div className={`flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0 cursor-pointer transition-colors duration-200 rounded-lg px-2 -mx-2 ${selectedItemForNotes === item.id ? "bg-blue-50 border-blue-200" : "hover:bg-gray-50"} ${isCompleted ? "cursor-default" : ""}`} onClick={() => handleItemClick(item.id)}>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <div className="font-medium text-gray-800">{item.name}</div>
                      {item.notes && <FileText className="w-4 h-4 text-blue-500 cursor-pointer hover:text-blue-600" onClick={e => handleItemNotesClick(e, item)} />}
                      {!item.notes && !isCompleted && <FileText className="w-4 h-4 text-gray-400 cursor-pointer hover:text-blue-500 opacity-50 hover:opacity-100" onClick={e => handleItemNotesClick(e, item)} />}
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={e => {
                          e.stopPropagation();
                          handleQuantityUpdate(item.id, item.quantity - 1);
                        }}
                        className="w-6 h-6 p-0"
                        disabled={isCompleted}
                      >
                        <Minus className="w-3 h-3" />
                      </Button>
                      <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={e => {
                          e.stopPropagation();
                          handleQuantityUpdate(item.id, item.quantity + 1);
                        }}
                        className="w-6 h-6 p-0"
                        disabled={isCompleted}
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                    <div className="w-16 text-right font-medium text-gray-800">{formatCurrency(item.price * item.quantity)}</div>
                  </div>
                </div>

                {/* Item Notes Display */}
                {selectedItemForNotes === item.id && item.notes && (
                  <div className="ml-4 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm">
                    <div className="flex items-start space-x-2">
                      <FileText className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="font-medium text-yellow-800 mb-1">Kitchen Notes:</div>
                        <div className="text-yellow-700">{item.notes}</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Employee Selector Dropdown */}
      {orderType === "employees" && <EmployeeSelector selectedEmployeeId={selectedEmployee?.id || null} onEmployeeSelect={handleEmployeeSelected} placeholder="Choose an employee" showAvatar={false} compact={true} className="w-full" />}

      {/* Item Notes Dialog - Integrated with Redux */}
      {showItemNotesDialog && selectedItemForNotesObj && (
        <Suspense fallback={null}>
          <ItemNotesDialog
            isOpen={showItemNotesDialog}
            onClose={handleCloseNotesDialog}
            item={selectedItemForNotesObj}
            onNotesChange={handleNotesChange}
          />
        </Suspense>
      )}
    </div>
  );
};

// Export with React.memo for performance optimization
export const OrderItemsList = React.memo(OrderItemsListBase);

// Default export for React.lazy()
export default OrderItemsList;
