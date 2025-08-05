import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TablesLayoutProps } from "@/types/inventory";
import { formatCurrency } from "@/utils/conversionLogic";
import { tablesAPI } from "@/api/tables.api";
import { Clock, Users, Move } from "lucide-react";
import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { toast } from "sonner";

export const TablesLayout: React.FC<TablesLayoutProps> = ({ tables, selectedTable, onTableSelect, onClose, tableOrders = {} }) => {
  // Ensure tables is always an array (memoized to prevent unnecessary re-renders)
  const safeTablesList = useMemo(() => Array.isArray(tables) ? tables : [], [tables]);

  // Local state to track updated table positions
  const [updatedTables, setUpdatedTables] = useState<Table[]>(safeTablesList);
  
  // Update local state when tables prop changes
  useEffect(() => {
    setUpdatedTables(safeTablesList);
  }, [safeTablesList]);

  // State for hover popup
  const [hoveredTable, setHoveredTable] = useState<Table | null>(null);
  const [popupPosition, setPopupPosition] = useState<{ x: number; y: number } | null>(null);
  
  // Dragging state
  const canvasRef = useRef<HTMLDivElement>(null);
  const [isDragMode, setIsDragMode] = useState(false);
  const [dragState, setDragState] = useState<{
    isDragging: boolean;
    tableId: string;
    offset: { x: number; y: number };
    startPosition: { x: number; y: number };
  } | null>(null);
  const dragStateRef = useRef(dragState);
  const [tempPositions, setTempPositions] = useState<Record<string, { x: number; y: number }>>({});
  const [isUpdatingPosition, setIsUpdatingPosition] = useState<string | null>(null);
  
  // Keep ref in sync with state
  useEffect(() => {
    dragStateRef.current = dragState;
  }, [dragState]);

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

  // Helper function to constrain position within canvas bounds (percentage-based)
  const constrainPosition = useCallback((x: number, y: number) => {
    const constrainedX = Math.max(5, Math.min(x, 95)); // Keep 5% margin from edges
    const constrainedY = Math.max(10, Math.min(y, 90)); // Keep 10% margin from top/bottom
    return { x: constrainedX, y: constrainedY };
  }, []);

  // Convert pixel coordinates to percentage
  const pixelToPercentage = useCallback((pixelX: number, pixelY: number) => {
    if (!canvasRef.current) return { x: 50, y: 50 };
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (pixelX / rect.width) * 100;
    const y = (pixelY / rect.height) * 100;
    
    return constrainPosition(x, y);
  }, [constrainPosition]);

  // Handle mouse down on table for dragging
  const handleMouseDown = useCallback((e: React.MouseEvent, table: Table) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!isDragMode || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    // Find the current table from updatedTables to get the latest position
    const currentTable = updatedTables.find(t => t.id === table.id);
    const currentPosition = currentTable?.position || { x: 50, y: 50 };
    const tableCenterX = (currentPosition.x / 100) * rect.width;
    const tableCenterY = (currentPosition.y / 100) * rect.height;
    
    const offsetX = mouseX - tableCenterX;
    const offsetY = mouseY - tableCenterY;

    // Set dragging state
    setDragState({
      isDragging: true,
      tableId: table.id,
      offset: { x: offsetX, y: offsetY },
      startPosition: currentPosition
    });

    // Set cursor and prevent selection
    document.body.style.cursor = 'grabbing';
    document.body.style.userSelect = 'none';
  }, [isDragMode, updatedTables]);

  // Handle global mouse move for dragging
  const handleGlobalMouseMove = useCallback((e: MouseEvent) => {
    const currentDragState = dragStateRef.current;
    if (!currentDragState?.isDragging || !canvasRef.current) return;

    e.preventDefault();
    
    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Calculate new position accounting for offset
    const newCenterX = mouseX - currentDragState.offset.x;
    const newCenterY = mouseY - currentDragState.offset.y;
    
    // Convert to percentage and constrain
    const newPosition = pixelToPercentage(newCenterX, newCenterY);

    // Update temp position for immediate visual feedback
    setTempPositions(prev => ({
      ...prev,
      [currentDragState.tableId]: newPosition
    }));
  }, [pixelToPercentage]);

  // Handle global mouse up for dragging
  const handleGlobalMouseUp = useCallback(async () => {
    const currentDragState = dragStateRef.current;
    if (!currentDragState?.isDragging) return;

    const finalPosition = tempPositions[currentDragState.tableId];
    if (finalPosition) {
      try {
        setIsUpdatingPosition(currentDragState.tableId);
        
        // Update position via API
        await tablesAPI.updateTable(currentDragState.tableId, {
          position: finalPosition
        });
        
        // Update local state with new position
        setUpdatedTables(prev => 
          prev.map(table => 
            table.id === currentDragState.tableId 
              ? { ...table, position: finalPosition }
              : table
          )
        );
        
        toast.success('Table position updated successfully');
        
        // Clear temp position
        setTempPositions(prev => {
          const newPositions = { ...prev };
          delete newPositions[currentDragState.tableId];
          return newPositions;
        });
      } catch (error) {
        console.error('Failed to update table position:', error);
        toast.error('Failed to update table position');
        
        // Revert to original position on error
        setTempPositions(prev => {
          const newPositions = { ...prev };
          delete newPositions[currentDragState.tableId];
          return newPositions;
        });
      } finally {
        setIsUpdatingPosition(null);
      }
    }
    
    setDragState(null);
  }, [tempPositions]);

  // Global mouse event listeners for dragging
  useEffect(() => {
    if (dragState?.isDragging) {
      const handleMouseMove = (e: MouseEvent) => handleGlobalMouseMove(e);
      const handleMouseUp = () => handleGlobalMouseUp();
      
      document.addEventListener('mousemove', handleMouseMove, { passive: false });
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('dragstart', (e) => e.preventDefault());
      document.addEventListener('selectstart', (e) => e.preventDefault());

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.removeEventListener('dragstart', (e) => e.preventDefault());
        document.removeEventListener('selectstart', (e) => e.preventDefault());
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };
    }
  }, [dragState?.isDragging, handleGlobalMouseMove, handleGlobalMouseUp]);

  // Handle table click (select or drag)
  const handleTableClick = useCallback((table: Table) => {
    if (!isDragMode) {
      onTableSelect(table);
    }
  }, [isDragMode, onTableSelect]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl w-full h-full max-h-[100vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-2 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Restaurant Tables</h2>
          </div>
          
          {/* Drag Mode Toggle */}
          <Button
            variant={isDragMode ? "outline" : "outline"}
            size="sm"
            onClick={() => setIsDragMode(!isDragMode)}
            className={isDragMode ? "bg-red-500/10 border border-red-500 mr-4" : "mr-4"}
          >
            <Move className="w-4 h-4 mr-2" />
            {isDragMode ? "Exit Drag Mode" : "Arrange Tables"}
          </Button>
        </div>

        {/* Tables Layout */}
        <div className="flex-1 overflow-auto">
          <div className="relative bg-gray-50 rounded-lg min-h-full p-4">
            {/* Restaurant Floor Plan */}
            <div 
              ref={canvasRef}
              className={`relative w-full h-full min-h-[600px] ${
                isDragMode ? 'cursor-default' : ''
              }`}
              style={{
                backgroundImage: isDragMode ? 'radial-gradient(circle at 1px 1px, rgba(0,0,0,0.1) 1px, transparent 0)' : 'none',
                backgroundSize: isDragMode ? '20px 20px' : 'auto',
              }}
            >
              {safeTablesList.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center text-gray-500">
                    <div className="text-lg font-medium mb-2">No tables available</div>
                    <div className="text-sm">Tables are being loaded or none are configured.</div>
                  </div>
                </div>
              ) : (
                updatedTables.map((table, index) => {
                  // Ensure table has valid position, fallback to grid layout if missing
                  const basePosition = table.position || {
                    x: 20 + (index % 4) * 20, // Grid layout: 20%, 40%, 60%, 80%
                    y: 20 + Math.floor(index / 4) * 25 // Rows: 20%, 45%, 70%
                  };
                  
                  const isDragging = dragState?.tableId === table.id;
                  const isUpdating = isUpdatingPosition === table.id;
                  const currentPosition = isDragging && tempPositions[table.id] ? tempPositions[table.id] : basePosition;

                  return (
                    <div
                      key={table.id}
                      className="absolute"
                      style={{
                        left: `${currentPosition.x}%`,
                        top: `${currentPosition.y}%`,
                        transform: "translate(-50%, -50%)",
                        zIndex: isDragging ? 1000 : 'auto',
                        opacity: isUpdating ? 0.7 : 1,
                      }}
                    >
                      {/* Table */}
                      <div className="relative">
                        <div 
                          className={`
                            ${getTableShape(table.shape, table.seats)} 
                            ${getTableStatusColor(table.status)} 
                            ${selectedTable?.id === table.id ? "ring-4 ring-blue-500" : ""}
                            ${isDragMode ? "hover:ring-2 hover:ring-blue-300" : ""}
                            ${isDragging ? "ring-2 ring-blue-400 shadow-lg" : ""}
                            ${isDragMode ? "cursor-grab" : "cursor-pointer"}
                            ${isDragging ? "cursor-grabbing" : ""}
                            transition-all duration-200
                          `} 
                          onClick={() => handleTableClick(table)} 
                          onMouseDown={(e) => handleMouseDown(e, table)}
                          onMouseEnter={e => !isDragMode && handleTableHover(table, e)} 
                          onMouseLeave={handleTableLeave}
                        >
                          <div className="text-center">
                            <div className="font-bold text-lg text-gray-800">{table.number}</div>
                            <div className="text-xs text-gray-600 flex items-center justify-center">
                              <Users className="w-3 h-3 mr-1" />
                              {table.seats}
                            </div>
                          </div>
                          
                          {/* Drag indicator */}
                          {isDragMode && (
                            <div className="absolute -top-1 -right-1 bg-blue-500 text-white rounded-full w-4 h-4 flex items-center justify-center">
                              <Move className="w-2 h-2" />
                            </div>
                          )}
                          
                          {/* Updating indicator */}
                          {isUpdating && (
                            <div className="absolute inset-0 bg-blue-500 bg-opacity-20 rounded-full flex items-center justify-center">
                              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                            </div>
                          )}
                        </div>

                        {/* Red notification badge for tables with saved orders */}
                        {tableOrders[table.number?.toString()] && tableOrders[table.number.toString()] > 0 && (
                          <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shadow-lg border-2 border-white z-10">
                            {tableOrders[table.number.toString()]}
                          </div>
                        )}
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
              {isDragMode ? (
                "Drag mode active - Click and drag tables to reposition them"
              ) : selectedTable ? (
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
              {!isDragMode && (
                <Button 
                  onClick={() => selectedTable && onTableSelect(selectedTable)} 
                  disabled={!selectedTable || selectedTable.status === "cleaning"} 
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {selectedTable?.status === "opened" ? "Continue Order" : "Start Order"}
                </Button>
              )}
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
