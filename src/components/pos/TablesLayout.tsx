import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Table, TablesLayoutProps } from "@/types/inventory";
import { formatCurrency } from "@/utils/conversionLogic";
import { tablesAPI } from "@/api/tables.api";
import { Clock, Users, Move, Circle, Square, RectangleHorizontal, Trash2, Plus } from "lucide-react";
import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { toast } from "sonner";

export const TablesLayout: React.FC<TablesLayoutProps> = ({ tables, selectedTable, onTableSelect, onClose, tableOrders = {} }) => {
  // Ensure tables is always an array (memoized to prevent unnecessary re-renders)
  const safeTablesList = useMemo(() => (Array.isArray(tables) ? tables : []), [tables]);

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
  const [isArrangeMode, setIsArrangeMode] = useState(false); // Controls toolbar visibility
  const [selectedTool, setSelectedTool] = useState<string>("select");
  const [isCreatingTable, setIsCreatingTable] = useState(false);
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
    // Account for table size (tables are 20x20 or 24x16, so we need more margin)
    // Keep tables well within the red border area
    const constrainedX = Math.max(8, Math.min(x, 92)); // Keep 8% margin from left/right edges
    const constrainedY = Math.max(12, Math.min(y, 88)); // Keep 12% margin from top/bottom edges
    return { x: constrainedX, y: constrainedY };
  }, []);

  // Convert pixel coordinates to percentage
  const pixelToPercentage = useCallback(
    (pixelX: number, pixelY: number) => {
      if (!canvasRef.current) return { x: 50, y: 50 };

      const rect = canvasRef.current.getBoundingClientRect();
      const x = (pixelX / rect.width) * 100;
      const y = (pixelY / rect.height) * 100;

      return constrainPosition(x, y);
    },
    [constrainPosition]
  );

  // Handle mouse down on table for dragging
  const handleMouseDown = useCallback(
    (e: React.MouseEvent, table: Table) => {
      e.preventDefault();
      e.stopPropagation();

      if (!isDragMode || !canvasRef.current) return;

      // Debug log to check table data
      console.log("Mouse down on table:", {
        tableId: table.id,
        tableNumber: table.number,
        table: table
      });

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
      document.body.style.cursor = "grabbing";
      document.body.style.userSelect = "none";
    },
    [isDragMode, updatedTables]
  );

  // Handle global mouse move for dragging
  const handleGlobalMouseMove = useCallback(
    (e: MouseEvent) => {
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
    },
    [pixelToPercentage]
  );

  // Handle global mouse up for dragging
  const handleGlobalMouseUp = useCallback(async () => {
    const currentDragState = dragStateRef.current;
    if (!currentDragState?.isDragging) return;

    const finalPosition = tempPositions[currentDragState.tableId];
    if (finalPosition) {
      try {
        setIsUpdatingPosition(currentDragState.tableId);

        // Debug log to check table ID
        console.log("Updating table position:", {
          tableId: currentDragState.tableId,
          position: finalPosition
        });

        // Update position via API
        await tablesAPI.updateTable(currentDragState.tableId, {
          position: finalPosition
        });

        // Update local state with new position
        setUpdatedTables(prev => prev.map(table => (table.id === currentDragState.tableId ? { ...table, position: finalPosition } : table)));

        toast.success("Table position updated successfully");

        // Clear temp position
        setTempPositions(prev => {
          const newPositions = { ...prev };
          delete newPositions[currentDragState.tableId];
          return newPositions;
        });
      } catch (error) {
        console.error("Failed to update table position:", error);
        toast.error("Failed to update table position");

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

      document.addEventListener("mousemove", handleMouseMove, { passive: false });
      document.addEventListener("mouseup", handleMouseUp);
      document.addEventListener("dragstart", e => e.preventDefault());
      document.addEventListener("selectstart", e => e.preventDefault());

      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
        document.removeEventListener("dragstart", e => e.preventDefault());
        document.removeEventListener("selectstart", e => e.preventDefault());
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      };
    }
  }, [dragState?.isDragging, handleGlobalMouseMove, handleGlobalMouseUp]);

  // Handle table click (select or drag)
  const handleTableClick = useCallback(
    (table: Table) => {
      // Prevent table selection when in arrange mode or drag mode
      if (!isDragMode && !isArrangeMode) {
        onTableSelect(table);
      }
      // In arrange mode, tables are only for positioning, not for taking orders
    },
    [isDragMode, isArrangeMode, onTableSelect]
  );

  // Handle canvas click for creating tables
  const handleCanvasClick = useCallback(
    async (e: React.MouseEvent) => {
      if (selectedTool === "select" || isDragMode || !isArrangeMode || !canvasRef.current) return;

      const rect = canvasRef.current.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      // Convert to percentage
      const position = {
        x: (clickX / rect.width) * 100,
        y: (clickY / rect.height) * 100
      };

      // Constrain position
      const constrainedPosition = constrainPosition(position.x, position.y);

      // Define table properties based on selected tool
      const tableConfigs = {
        "round-table": { shape: "round" as const, seats: 4 },
        "square-table": { shape: "square" as const, seats: 4 },
        "rectangular-table": { shape: "rectangle" as const, seats: 6 }
      };

      const config = tableConfigs[selectedTool as keyof typeof tableConfigs];
      if (!config) return;

      try {
        setIsCreatingTable(true);

        // Find the next table number by getting max + 1 (always increment, never reuse numbers)
        const existingNumbers = updatedTables.map(t => t.number);
        const maxNumber = existingNumbers.length > 0 ? Math.max(...existingNumbers) : 0;
        const nextNumber = maxNumber + 1;

        // Create new table
        const newTableData = {
          number: nextNumber,
          seats: config.seats,
          shape: config.shape,
          position: constrainedPosition
        };

        const response = await tablesAPI.createTable(newTableData);

        // Add to local state - backend returns { message, table }
        const newTable = response.data.table || response.data;
        console.log("Created table:", newTable); // Debug log
        setUpdatedTables(prev => [...prev, newTable]);

        toast.success(`Table ${nextNumber} created successfully`);

        // Reset tool to select
        setSelectedTool("select");
      } catch (error) {
        console.error("Failed to create table:", error);
        toast.error("Failed to create table");
      } finally {
        setIsCreatingTable(false);
      }
    },
    [selectedTool, isDragMode, isArrangeMode, constrainPosition, updatedTables]
  );

  // Handle table deletion
  const handleDeleteTable = useCallback(
    async (table: Table) => {
      if (!selectedTable || selectedTable.id !== table.id) {
        toast.error("Please select a table first");
        return;
      }

      if (table.status === "opened") {
        toast.error("Cannot delete a table with an active order");
        return;
      }

      try {
        await tablesAPI.deleteTable(table.id);

        // Remove from local state
        setUpdatedTables(prev => prev.filter(t => t.id !== table.id));

        // Clear selection if deleted table was selected
        if (selectedTable?.id === table.id) {
          onTableSelect(updatedTables[0] || null);
        }

        toast.success(`Table ${table.number} deleted successfully`);
      } catch (error) {
        console.error("Failed to delete table:", error);
        toast.error("Failed to delete table");
      }
    },
    [selectedTable, onTableSelect, updatedTables]
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl w-full h-full max-h-[100vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-2 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Tables</h2>
          </div>

          {/* Toolbar - Only visible in arrange mode */}
          {isArrangeMode ? (
            <div className="flex items-center gap-2">
              {/* Table Creation Tools */}
              <div className="flex gap-1">
                {[
                  { tool: "select", label: "Select", icon: null, title: undefined },
                  { tool: "round-table", label: null, icon: Circle, title: "Create Round Table" },
                  { tool: "square-table", label: null, icon: Square, title: "Create Square Table" },
                  { tool: "rectangular-table", label: null, icon: RectangleHorizontal, title: "Create Rectangular Table" }
                ].map(({ tool, label, icon: Icon, title }) => (
                  <Button key={tool} variant={selectedTool === tool ? "default" : "outline"} size="sm" onClick={() => setSelectedTool(tool)} disabled={isDragMode} className="flex items-center gap-1" title={title}>
                    {Icon && <Icon className="w-3 h-3" />}
                    {label}
                  </Button>
                ))}
              </div>

              <Separator orientation="vertical" className="h-6" />

              {/* Table Actions */}
              <div className="flex gap-1">
                <Button variant="outline" size="sm" onClick={() => selectedTable && handleDeleteTable(selectedTable)} disabled={!selectedTable || selectedTable.status === "opened" || isDragMode} className="flex items-center gap-1 hover:bg-destructive hover:text-destructive-foreground" title="Delete Selected Table">
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>

              <Separator orientation="vertical" className="h-6" />

              {/* Drag Mode Toggle */}
              <Button
                variant={isDragMode ? "outline" : "outline"}
                size="sm"
                onClick={() => {
                  setIsDragMode(!isDragMode);
                  if (!isDragMode) {
                    setSelectedTool("select");
                  }
                }}
                className={isDragMode ? "bg-red-500/10 border border-red-500" : ""}
              >
                <Move className="w-4 h-4 mr-1" />
                {isDragMode ? "Exit Drag Mode" : "Drag Mode"}
              </Button>

              <Separator orientation="vertical" className="h-6" />

              {/* Exit Arrange Mode */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsArrangeMode(false);
                  setIsDragMode(false);
                  setSelectedTool("select");
                }}
                className="text-red-600 hover:bg-red-50"
              >
                Exit Arrange
              </Button>
            </div>
          ) : (
            /* Simple Arrange Button */
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setIsArrangeMode(true);
                setSelectedTool("select");
              }}
            >
              <Move className="w-4 h-4 mr-2" />
              Arrange Tables
            </Button>
          )}
        </div>

        {/* Tables Layout */}
        <div className="flex-1 overflow-auto">
          <div className="relative bg-gray-50 rounded-lg min-h-full">
            {/* Restaurant Floor Plan - Red border defines the table placement area */}
            <div
              ref={canvasRef}
              className={`relative w-full h-full min-h-[815px] xl:min-h-[830px] border-red-500 border${isDragMode ? "cursor-default" : isArrangeMode && selectedTool !== "select" ? "cursor-crosshair" : ""}`}
              style={{
                backgroundImage: isDragMode ? "radial-gradient(circle at 1px 1px, rgba(0,0,0,0.1) 1px, transparent 0)" : "none",
                backgroundSize: isDragMode ? "20px 20px" : "auto"
              }}
              onClick={handleCanvasClick}
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
                    // Use constrainPosition to ensure fallback positions are within red border area
                    ...constrainPosition(
                      15 + (index % 4) * 20, // Grid layout: 15%, 35%, 55%, 75% (within 8-92% bounds)
                      20 + Math.floor(index / 4) * 20 // Rows: 20%, 40%, 60%, 80% (within 12-88% bounds)
                    )
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
                        zIndex: isDragging ? 1000 : "auto",
                        opacity: isUpdating ? 0.7 : 1
                      }}
                    >
                      {/* Table */}
                      <div className="relative">
                        <div
                          className={`
                            ${getTableShape(table.shape, table.seats)} 
                            ${getTableStatusColor(table.status)} 
                            ${selectedTable?.id === table.id && !isArrangeMode ? "ring-4 ring-blue-500" : ""}
                            ${isDragMode ? "hover:ring-2 hover:ring-blue-300" : ""}
                            ${isDragging ? "ring-2 ring-blue-400 shadow-lg" : ""}
                            ${isDragMode ? "cursor-grab" : isArrangeMode ? "cursor-default" : "cursor-pointer"}
                            ${isDragging ? "cursor-grabbing" : ""}
                            ${isArrangeMode && !isDragMode ? "opacity-75" : ""}
                            transition-all duration-200
                          `}
                          onClick={() => handleTableClick(table)}
                          onMouseDown={e => handleMouseDown(e, table)}
                          onMouseEnter={e => !isDragMode && !isArrangeMode && handleTableHover(table, e)}
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

                          {/* Arrange mode indicator - shows when in arrange mode but not dragging */}
                          {isArrangeMode && !isDragMode && (
                            <div className="absolute -top-1 -left-1 bg-orange-500 text-white rounded-full w-4 h-4 flex items-center justify-center">
                              <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
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
            <div className="px-6 py- border-b border-gray-100">
              <div className="flex items-center space-x-6">
                {[
                  { status: "available", color: "bg-green-100 border-green-300", label: "Available" },
                  { status: "opened", color: "bg-red-100 border-red-300", label: "Open" },
                  { status: "reserved", color: "bg-yellow-100 border-yellow-300", label: "Reserved" },
                  { status: "cleaning", color: "bg-gray-100 border-gray-300", label: "Cleaning" }
                ].map(item => (
                  <div key={item.status} className="flex items-center space-x-2">
                    <div className={`w-4 h-4 rounded-full ${item.color} border-2`}></div>
                    <span className="text-sm text-gray-600">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex space-x-3">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              {!isArrangeMode && (
                <Button onClick={() => selectedTable && onTableSelect(selectedTable)} disabled={!selectedTable || selectedTable.status === "cleaning"} className="bg-blue-600 hover:bg-blue-700">
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
                  {[
                    {
                      key: "order-number",
                      content: (
                        <div className="text-center">
                          <div className="font-bold text-lg text-gray-800 m">{hoveredTable.currentOrder?.orderNumber || `ORD-${String(hoveredTable.currentOrder?.orderId).padStart(4, "0")}`}</div>
                        </div>
                      )
                    },
                    {
                      key: "time",
                      content: (
                        <div className="flex items-center justify-center text-gray-600">
                          <Clock className="w-4 h-4 mr-2 text-blue-500" />
                          <span className="font-medium">{formatTime(hoveredTable.currentOrder?.startTime || new Date())}</span>
                        </div>
                      )
                    },
                    {
                      key: "items-count",
                      content: (
                        <div className="flex items-center justify-center text-gray-600">
                          <div className="w-4 h-4 mr-2 rounded-full bg-orange-100 flex items-center justify-center">
                            <span className="text-xs font-bold text-orange-600">{hoveredTable.currentOrder?.itemCount || 0}</span>
                          </div>
                          <span className="font-medium">{hoveredTable.currentOrder?.itemCount || 0} items</span>
                        </div>
                      )
                    },
                    {
                      key: "total-amount",
                      content: (
                        <div className="text-center pt-2 border-t border-gray-100">
                          <div className="text-xl font-bold text-green-600">{formatCurrency(hoveredTable.currentOrder?.totalAmount || 0)}</div>
                        </div>
                      )
                    }
                  ].map(({ key, content }) => (
                    <div key={key}>{content}</div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};
