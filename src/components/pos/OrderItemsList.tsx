import { Button } from "@/components/ui/button";
import { getOrderTypeIcon, getOrderTypeLabel } from "@/constants/constants";
import { Employee } from "@/types/employee";
import { OrderItemsListProps, POSCartItem } from "@/types/inventory";
import { OrderType } from "@/types/orders";
import { formatCurrency } from "@/utils/conversionLogic";
import { FileText, Minus, Plus } from "lucide-react";
import React from "react";
import { EmployeeSelector } from "../employees/EmployeeSelector";

export const OrderItemsList: React.FC<OrderItemsListProps> = ({ cart, updateCartQuantity, orderType, selectedTable, selectedEmployee, onOrderTypeChange, onTableSelect, onEmployeeSelect, incompleteTableOrdersCount, orderStatus, isOrderCompleted, discountReason, leftPanelPixelWidth = 0, onShowItemNotes }) => {
  const isCompleted = isOrderCompleted || orderStatus === "paid" || orderStatus === "served";
  const [selectedItemForNotes, setSelectedItemForNotes] = React.useState<string | null>(null);
  const shouldShowLabels = leftPanelPixelWidth > 430;
  
  // Safely derive a department label from possible formats (object/string)
  const getDeptLabel = (dept: Employee["department"] | string | null | undefined) => {
    if (!dept) return "";
    return typeof dept === "string" ? dept : dept.name || dept.code || "";
  };

  const handleQuantityUpdate = (cartId: string, newQuantity: number) => {
    if (isCompleted) {
      return;
    }
    updateCartQuantity(cartId, newQuantity);
  };

  const handleEmployeeSelectClick = () => {
    // Set order type to employees to show the dropdown
    onOrderTypeChange("employees");
  };

  const handleEmployeeSelected = (employee: Employee | null) => {
    if (employee) {
      onEmployeeSelect(employee);
      onOrderTypeChange("employees");
    }
  };

  const handleItemClick = (itemId: string) => {
    if (isCompleted) return;
    setSelectedItemForNotes(selectedItemForNotes === itemId ? null : itemId);
  };

  const handleItemNotesClick = (e: React.MouseEvent, item: POSCartItem) => {
    e.stopPropagation();
    if (isCompleted || !onShowItemNotes) {
      return;
    }
    onShowItemNotes(item);
    // Trigger the parent's item notes dialog
    onShowItemNotes(item);
  };

  return (
    <div className="flex-1 flex flex-col h-full">
      <div className="flex-shrink-0 border-b border-gray-100 bg-teal-500/25">
        <div className="grid grid-cols-5">
          {(["delivery", "takeaway", "bar", "table", "employees"] as OrderType[]).map(type => {
            // Only show badge for table orders
            let badgeCount = 0;
            if (type === "table" && incompleteTableOrdersCount) badgeCount = incompleteTableOrdersCount;

            const handleClick = () => {
              if (type === "table") {
                onTableSelect();
              } else if (type === "employees") {
                handleEmployeeSelectClick();
              } else {
                onOrderTypeChange(type);
              }
            };

            return (
              <Button key={type} variant={orderType === type ? "default" : "outline"} size="sm" onClick={handleClick} className={`relative flex items-center justify-center ${shouldShowLabels ? "h-10" : "h-8"} rounded-none transition-all duration-200 ${orderType === type ? "bg-teal-500 hover:bg-teal-600 text-white" : "hover:bg-gray-50"}`}>
                <div className="flex items-center justify-center">
                  {getOrderTypeIcon(type)}
                  {/* Show label based on left panel width */}
                  {shouldShowLabels && <span className="text-xs font-medium ml-1">{getOrderTypeLabel(type, selectedTable, selectedEmployee, discountReason)}</span>}
                </div>
                {badgeCount > 0 && <span className={`absolute top-1 right-1 bg-red-500 text-white rounded-full flex items-center justify-center font-bold ${shouldShowLabels ? "h-5 w-5 text-xs" : "h-4 w-4 text-[10px]"}`}>{badgeCount > 99 ? "99+" : badgeCount}</span>}
              </Button>
            );
          })}
        </div>

        {/* Current Order Type Display - Responsive based on panel width */}
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
        {!cart || cart.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            <div className="text-sm font-medium mb-2">{getOrderTypeLabel(orderType, selectedTable, selectedEmployee)}</div>
            <div className="text-xs text-gray-400">No items in cart</div>
          </div>
        ) : (
          <div className="p-4 space-y-3">
            {(cart || []).map(item => (
              <div key={item.id} className="space-y-2">
                {/* Main Item Row */}
                <div className={`flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0 cursor-pointer transition-colors duration-200 rounded-lg px-2 -mx-2 ${selectedItemForNotes === item.id ? "bg-blue-50 border-blue-200" : "hover:bg-gray-50"} ${isCompleted ? "cursor-default" : ""}`} onClick={() => handleItemClick(item.id)}>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <div className="font-medium text-gray-800">{item.name}</div>
                      {item.notes && <FileText className="w-4 h-4 text-blue-500 cursor-pointer hover:text-blue-600" onClick={e => handleItemNotesClick(e, item)} />}
                      {!item.notes && !isCompleted && onShowItemNotes && <FileText className="w-4 h-4 text-gray-400 cursor-pointer hover:text-blue-500 opacity-50 hover:opacity-100" onClick={e => handleItemNotesClick(e, item)} />}
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

      {/* Employee Selector Dropdown - Only show when employees order type is selected */}
      {orderType === "employees" && (
          <EmployeeSelector 
            selectedEmployeeId={selectedEmployee?.id || null}
            onEmployeeSelect={handleEmployeeSelected}
            placeholder="Choose an employee"
            showAvatar={false}
            compact={true}
            className="w-full"
          />
      )}
    </div>
  );
};
