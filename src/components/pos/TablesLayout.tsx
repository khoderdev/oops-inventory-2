import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TablesLayoutProps } from "@/types/inventory";
import { formatCurrency } from "@/utils/conversionLogic";
import { Clock, Users, X } from "lucide-react";
import React from "react";

export const TablesLayout: React.FC<TablesLayoutProps> = ({ tables, selectedTable, onTableSelect, onClose }) => {
  const getTableStatusColor = (status: Table["status"]) => {
    switch (status) {
      case "available":
        return "bg-green-100 border-green-300 hover:bg-green-200";
      case "open":
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
      case "open":
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

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true
    }).format(date);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl h-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Restaurant Tables</h2>
            <p className="text-gray-600 mt-1">Select a table to start taking orders</p>
          </div>
          <Button variant="outline" onClick={onClose} className="p-2">
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Legend */}
        <div className="px-6 py-4 border-b border-gray-100">
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

        {/* Tables Layout */}
        <div className="flex-1 p-6 overflow-auto">
          <div className="relative bg-gray-50 rounded-lg p-8 min-h-full">
            {/* Restaurant Floor Plan */}
            <div className="relative w-full h-full min-h-[600px]">
              {tables.map(table => (
                <div
                  key={table.id}
                  className="absolute"
                  style={{
                    left: `${table.position.x}%`,
                    top: `${table.position.y}%`,
                    transform: "translate(-50%, -50%)"
                  }}
                >
                  {/* Table */}
                  <div className={`${getTableShape(table.shape, table.seats)} ${getTableStatusColor(table.status)} ${selectedTable?.id === table.id ? "ring-4 ring-blue-500" : ""}`} onClick={() => onTableSelect(table)}>
                    <div className="text-center">
                      <div className="font-bold text-gray-800">{table.number}</div>
                      <div className="text-xs text-gray-600 flex items-center justify-center">
                        <Users className="w-3 h-3 mr-1" />
                        {table.seats}
                      </div>
                    </div>
                  </div>

                  {/* Table Info Card (for occupied tables) */}
                  {table.status === "open" && table.currentOrder && (
                    <Card className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 w-48 shadow-lg z-10">
                      <CardContent className="p-3">
                        <div className="text-sm">
                          <div className="font-medium text-gray-800 mb-1">{table.currentOrder.customerName || `Order #${table.currentOrder.orderId.slice(-4)}`}</div>
                          <div className="flex items-center text-gray-600 mb-1">
                            <Clock className="w-3 h-3 mr-1" />
                            {formatTime(table.currentOrder.startTime)}
                          </div>
                          <div className="text-gray-600 mb-1">{table.currentOrder.itemCount} items</div>
                          <div className="font-medium text-green-600">{formatCurrency(table.currentOrder.totalAmount)}</div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              ))}

              {/* Restaurant Features */}
              <div className="absolute top-4 left-4 bg-blue-100 border-2 border-blue-300 rounded-lg p-4 w-32 h-16 flex items-center justify-center">
                <span className="text-sm font-medium text-blue-800">Kitchen</span>
              </div>

              <div className="absolute top-4 right-4 bg-purple-100 border-2 border-purple-300 rounded-lg p-4 w-32 h-16 flex items-center justify-center">
                <span className="text-sm font-medium text-purple-800">Bar</span>
              </div>

              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-orange-100 border-2 border-orange-300 rounded-lg p-4 w-40 h-16 flex items-center justify-center">
                <span className="text-sm font-medium text-orange-800">Main Entrance</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
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
            <div className="flex space-x-3">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={() => selectedTable && onTableSelect(selectedTable)} disabled={!selectedTable || selectedTable.status === "cleaning"} className="bg-blue-600 hover:bg-blue-700">
                {selectedTable?.status === "open" ? "Continue Order" : "Start Order"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
