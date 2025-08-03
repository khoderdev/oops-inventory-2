import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TablesLayoutProps } from "@/types/inventory";
import { formatCurrency } from "@/utils/conversionLogic";
import { Clock, Users } from "lucide-react";
import React, { useState } from "react";

export const TablesLayout: React.FC<TablesLayoutProps> = ({ tables, selectedTable, onTableSelect, onClose, tableOrders = {} }) => {
  // Ensure tables is always an array
  const safeTablesList = Array.isArray(tables) ? tables : [];

  // State for hover popup
  const [hoveredTable, setHoveredTable] = useState<Table | null>(null);
  const [popupPosition, setPopupPosition] = useState<{ x: number; y: number } | null>(null);

  const getTableStatusColor = (status: Table["status"]) => {
    switch (status) {
      case "available":
        return "bg-green-100 border-green-300 hover:bg-green-200";
      case "opened":
        return "bg-red-100 border-red-300 hover:bg-red-200";
      case "reserved":
        return "bg-yellow-100 border-yellow-300 hover:bg-yellow-200";
      case "cleaning":
        return "bg-gray-100 border-gray-300 hover:bg-gray-200";
      default:
        return "bg-white border-gray-200";
    }
  };

  const getTableStatusText = (status: Table["status"]) => {
    switch (status) {
      case "available":
        return "Available";
      case "opened":
        return "Open";
      case "reserved":
        return "Reserved";
      case "cleaning":
        return "Cleaning";
      default:
        return "Unknown";
    }
  };

  const getTableShape = (shape: Table["shape"], seats: number) => {
    const baseClasses = "flex items-center justify-center cursor-pointer transition-all duration-200 border-2";

    switch (shape) {
      case "round":
        return `${baseClasses} rounded-full w-20 h-20`;
      case "square":
        return `${baseClasses} rounded-lg w-20 h-20`;
      case "rectangle":
        return `${baseClasses} rounded-lg w-24 h-16`;
      default:
        return `${baseClasses} rounded-lg w-20 h-20`;
    }
  };

  const formatTime = (date: Date | string) => {
    try {
      const dateObj = typeof date === "string" ? new Date(date) : date;
      if (isNaN(dateObj.getTime())) {
        return "Invalid time";
      }
      return new Intl.DateTimeFormat("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true
      }).format(dateObj);
    } catch (error) {
      console.error("Error formatting time:", error);
      return "Invalid time";
    }
  };

  // Handle table hover
  const handleTableHover = (table: Table, event: React.MouseEvent) => {
    if (table.status === "opened" && table.currentOrder) {
      const rect = event.currentTarget.getBoundingClientRect();
      setHoveredTable(table);
      setPopupPosition({
        x: rect.left + rect.width / 2,
        y: rect.bottom + 12
      });
    }
  };

  const handleTableLeave = () => {
    setHoveredTable(null);
    setPopupPosition(null);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl w-full h-full max-h-[100vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-center px-6 py-2 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Restaurant Tables</h2>
            {/* <p className="text-gray-600 mt-1">Select a table to start taking orders</p> */}
          </div>
        </div>

        {/* Tables Layout */}
        <div className="flex-1 overflow-auto">
          <div className="relative bg-gray-50 rounded-lg min-h-full p-4">
            {/* Restaurant Floor Plan */}
            <div className="relative w-full h-full min-h-[600px]">
              {safeTablesList.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center text-gray-500">
                    <div className="text-lg font-medium mb-2">No tables available</div>
                    <div className="text-sm">Tables are being loaded or none are configured.</div>
                  </div>
                </div>
              ) : (
                safeTablesList.map((table, index) => {
                  // Ensure table has valid position, fallback to grid layout if missing
                  const position = table.position || {
                    x: 20 + (index % 4) * 20, // Grid layout: 20%, 40%, 60%, 80%
                    y: 20 + Math.floor(index / 4) * 25 // Rows: 20%, 45%, 70%
                  };

                  return (
                    <div
                      key={table.id}
                      className="absolute"
                      style={{
                        left: `${position.x}%`,
                        top: `${position.y}%`,
                        transform: "translate(-50%, -50%)"
                      }}
                    >
                      {/* Table */}
                      <div className="relative">
                        <div className={`${getTableShape(table.shape, table.seats)} ${getTableStatusColor(table.status)} ${selectedTable?.id === table.id ? "ring-4 ring-blue-500" : ""}`} onClick={() => onTableSelect(table)} onMouseEnter={e => handleTableHover(table, e)} onMouseLeave={handleTableLeave}>
                          <div className="text-center">
                            <div className="font-bold text-lg text-gray-800">{table.number}</div>
                            <div className="text-xs text-gray-600 flex items-center justify-center">
                              <Users className="w-3 h-3 mr-1" />
                              {table.seats}
                            </div>
                          </div>
                        </div>

                        {/* Red notification badge for tables with saved orders */}
                        {tableOrders[table.number?.toString()] && tableOrders[table.number.toString()] > 0 && <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shadow-lg border-2 border-white z-10">{tableOrders[table.number.toString()]}</div>}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-2 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {selectedTable ? (
                <>
                  Selected: Table {selectedTable.number} ({selectedTable.seats} seats) - {getTableStatusText(selectedTable.status)}
                </>
              ) : (
                "Select a table to continue"
              )}
            </div>

            <div className="px-6 py- border-b border-gray-100">
              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 rounded-full bg-green-100 border-2 border-green-300"></div>
                  <span className="text-sm text-gray-600">Available</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 rounded-full bg-red-100 border-2 border-red-300"></div>
                  <span className="text-sm text-gray-600">Open</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 rounded-full bg-yellow-100 border-2 border-yellow-300"></div>
                  <span className="text-sm text-gray-600">Reserved</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 rounded-full bg-gray-100 border-2 border-gray-300"></div>
                  <span className="text-sm text-gray-600">Cleaning</span>
                </div>
              </div>
            </div>

            <div className="flex space-x-3">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={() => selectedTable && onTableSelect(selectedTable)} disabled={!selectedTable || selectedTable.status === "cleaning"} className="bg-blue-600 hover:bg-blue-700">
                {selectedTable?.status === "opened" ? "Continue Order" : "Start Order"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Popup - Positioned at top level to avoid z-index issues */}
      {hoveredTable && popupPosition && (
        <div
          className="fixed z-[9999] pointer-events-none"
          style={{
            left: popupPosition.x,
            top: popupPosition.y,
            transform: "translateX(-50%)"
          }}
        >
          <div className="relative">
            {/* Arrow pointing up */}
            <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[8px] border-r-[8px] border-b-[8px] border-l-transparent border-r-transparent border-b-white drop-shadow-sm"></div>

            {/* Card */}
            <Card className="w-52 shadow-xl border-0 bg-white backdrop-blur-sm animate-in fade-in-0 zoom-in-95 duration-200">
              <CardContent className="p-4">
                <div className="space-y-3">
                  {/* Order Number */}
                  <div className="text-center">
                    <div className="font-bold text-lg text-gray-800 m">{hoveredTable.currentOrder?.orderNumber || `ORD-${String(hoveredTable.currentOrder?.orderId).padStart(4, "0")}`}</div>
                  </div>

                  {/* Time */}
                  <div className="flex items-center justify-center text-gray-600">
                    <Clock className="w-4 h-4 mr-2 text-blue-500" />
                    <span className="font-medium">{formatTime(hoveredTable.currentOrder?.startTime || new Date())}</span>
                  </div>

                  {/* Items Count */}
                  <div className="flex items-center justify-center text-gray-600">
                    <div className="w-4 h-4 mr-2 rounded-full bg-orange-100 flex items-center justify-center">
                      <span className="text-xs font-bold text-orange-600">{hoveredTable.currentOrder?.itemCount || 0}</span>
                    </div>
                    <span className="font-medium">{hoveredTable.currentOrder?.itemCount || 0} items</span>
                  </div>

                  {/* Total Amount */}
                  <div className="text-center pt-2 border-t border-gray-100">
                    <div className="text-xl font-bold text-green-600">{formatCurrency(hoveredTable.currentOrder?.totalAmount || 0)}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};
