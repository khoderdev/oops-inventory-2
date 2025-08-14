import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Table, TablesLayoutProps } from "@/types/inventory";
import { formatCurrency } from "@/utils/conversionLogic";
import { tablesAPI } from "@/api/tables.api";
import { Clock, Users, Move, Circle, Square, RectangleHorizontal, Trash2, Plus, Settings, Edit3, Copy } from "lucide-react";
import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { toast } from "sonner";
import { formatTime, getTableShape, getTableStatusColor } from "./constants";
import { RenameTableModal, TransferTableModal } from "@/components/tables";

export const TablesLayout: React.FC<TablesLayoutProps> = ({ tables, selectedTable, onTableSelect, onClose, tableOrders = {} }) => {
  const safeTablesList = useMemo(() => (Array.isArray(tables) ? tables : []), [tables]);
  const [updatedTables, setUpdatedTables] = useState<Table[]>(safeTablesList);
  const [hoveredTable, setHoveredTable] = useState<Table | null>(null);
  const [popupPosition, setPopupPosition] = useState<{ x: number; y: number } | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [isDragMode, setIsDragMode] = useState(false);
  const [isArrangeMode, setIsArrangeMode] = useState(false);
  const [selectedTool, setSelectedTool] = useState<string>("select");
  const [, setIsCreatingTable] = useState(false);
  const [dragState, setDragState] = useState<{
    isDragging: boolean;
    tableId: string;
    offset: { x: number; y: number };
    startPosition: { x: number; y: number };
  } | null>(null);
  const dragStateRef = useRef(dragState);
  const [tempPositions, setTempPositions] = useState<Record<string, { x: number; y: number }>>({});
  const [isUpdatingPosition, setIsUpdatingPosition] = useState<string | null>(null);

  // Table Management Modal States
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [selectedTableForAction, setSelectedTableForAction] = useState<Table | null>(null);
  const [contextMenu, setContextMenu] = useState<{ table: Table; x: number; y: number } | null>(null);

  useEffect(() => {
    setUpdatedTables(safeTablesList);
  }, [safeTablesList]);

  useEffect(() => {
    dragStateRef.current = dragState;
  }, [dragState]);

  // Table Management Handlers

  const handleRenameTable = (table: Table) => {
    setSelectedTableForAction(table);
    setShowRenameModal(true);
    setContextMenu(null);
  };

  const handleTransferOrder = (table: Table) => {
    setSelectedTableForAction(table);
    setShowTransferModal(true);
    setContextMenu(null);
  };

  const handleDeleteTable = async (table: Table) => {
    if (table.status === "opened") {
      toast.error("Cannot delete table with active orders");
      setContextMenu(null);
      return;
    }

    if (confirm(`Are you sure you want to delete Table ${table.number}?`)) {
      try {
        await tablesAPI.deleteTable(table.id.toString());
        toast.success("Table deleted successfully");
        // Refresh tables - you might want to emit an event to parent component
        window.location.reload(); // Temporary solution
      } catch (error: any) {
        toast.error(error.response?.data?.message || "Failed to delete table");
      }
    }
    setContextMenu(null);
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

  const constrainPosition = useCallback((x: number, y: number) => {
    const constrainedX = Math.max(8, Math.min(x, 92));
    const constrainedY = Math.max(12, Math.min(y, 88));
    return { x: constrainedX, y: constrainedY };
  }, []);

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

  const handleMouseDown = useCallback(
    (e: React.MouseEvent, table: Table) => {
      e.preventDefault();
      e.stopPropagation();
      if (!isDragMode || !canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      const currentTable = updatedTables.find(t => t.id === table.id);
      const currentPosition = currentTable?.position || { x: 50, y: 50 };
      const tableCenterX = (currentPosition.x / 100) * rect.width;
      const tableCenterY = (currentPosition.y / 100) * rect.height;
      const offsetX = mouseX - tableCenterX;
      const offsetY = mouseY - tableCenterY;
      setDragState({
        isDragging: true,
        tableId: table.id,
        offset: { x: offsetX, y: offsetY },
        startPosition: currentPosition
      });
      document.body.style.cursor = "grabbing";
      document.body.style.userSelect = "none";
    },
    [isDragMode, updatedTables]
  );

  const handleGlobalMouseMove = useCallback(
    (e: MouseEvent) => {
      const currentDragState = dragStateRef.current;
      if (!currentDragState?.isDragging || !canvasRef.current) return;
      e.preventDefault();
      const rect = canvasRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      const newCenterX = mouseX - currentDragState.offset.x;
      const newCenterY = mouseY - currentDragState.offset.y;
      const newPosition = pixelToPercentage(newCenterX, newCenterY);
      setTempPositions(prev => ({
        ...prev,
        [currentDragState.tableId]: newPosition
      }));
    },
    [pixelToPercentage]
  );

  const handleGlobalMouseUp = useCallback(async () => {
    const currentDragState = dragStateRef.current;
    if (!currentDragState?.isDragging) return;
    const finalPosition = tempPositions[currentDragState.tableId];
    if (finalPosition) {
      try {
        setIsUpdatingPosition(currentDragState.tableId);
        await tablesAPI.updateTable(currentDragState.tableId, {
          position: finalPosition
        });
        setUpdatedTables(prev => prev.map(table => (table.id === currentDragState.tableId ? { ...table, position: finalPosition } : table)));
        toast.success("Table position updated successfully");
        setTempPositions(prev => {
          const newPositions = { ...prev };
          delete newPositions[currentDragState.tableId];
          return newPositions;
        });
      } catch (error) {
        console.error("Failed to update table position:", error);
        toast.error("Failed to update table position");
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

  const handleTableClick = useCallback(
    (table: Table) => {
      if (!isDragMode && !isArrangeMode) {
        onTableSelect(table);
      }
    },
    [isDragMode, isArrangeMode, onTableSelect]
  );

  const handleTableRightClick = useCallback(
    (e: React.MouseEvent, table: Table) => {
      e.preventDefault();
      e.stopPropagation();

      // Don't show context menu in drag mode or arrange mode
      if (isDragMode || isArrangeMode) return;

      setContextMenu({
        table,
        x: e.clientX,
        y: e.clientY
      });
    },
    [isDragMode, isArrangeMode]
  );

  // Close context menu when clicking elsewhere
  const handleCanvasClick = useCallback(
    async (e: React.MouseEvent) => {
      // Close context menu
      setContextMenu(null);

      if (selectedTool === "select" || isDragMode || !isArrangeMode || !canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;
      const position = {
        x: (clickX / rect.width) * 100,
        y: (clickY / rect.height) * 100
      };
      const constrainedPosition = constrainPosition(position.x, position.y);
      const tableConfigs = {
        "round-table": { shape: "round" as const, seats: 4 },
        "square-table": { shape: "square" as const, seats: 4 },
        "rectangular-table": { shape: "rectangle" as const, seats: 6 }
      };
      const config = tableConfigs[selectedTool as keyof typeof tableConfigs];
      if (!config) return;
      try {
        setIsCreatingTable(true);
        const existingNumbers = updatedTables.map(t => t.number);
        const maxNumber = existingNumbers.length > 0 ? Math.max(...existingNumbers) : 0;
        const nextNumber = maxNumber + 1;
        const newTableData = {
          number: nextNumber,
          seats: config.seats,
          shape: config.shape,
          position: constrainedPosition
        };
        const response = await tablesAPI.createTable(newTableData);
        const newTable = response.data.table || response.data;
        setUpdatedTables(prev => [...prev, newTable]);
        toast.success(`Table ${nextNumber} created successfully`);
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

  return (
    <div className="h-[calc(100vh-0rem)] w-full flex flex-col overflow-hidden">
      <div className="h-full flex flex-col">
        <div className="flex items-center justify-between px-6 py-2 border-b border-gray-200 mr-6">
          <div className="flex items-center gap-4">
            <h2 className={`text-2xl font-bold text-gray-800 ${isArrangeMode ? "hidden sm:block" : ""}`}>Tables</h2>
          </div>
          {isArrangeMode ? (
            <div className="flex items-center gap-2">
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

              <div className="flex gap-1">
                <Button variant="outline" size="sm" onClick={() => selectedTable && handleDeleteTable(selectedTable)} disabled={!selectedTable || selectedTable.status === "opened" || isDragMode} className="flex items-center gap-1 hover:bg-destructive hover:text-destructive-foreground" title="Delete Selected Table">
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>

              <Separator orientation="vertical" className="h-6" />

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

        <div className="flex-1 overflow-hidden">
          <div className="relative bg-gray-50 h-full">
            <div
              ref={canvasRef}
              className={`relative w-full h-full ${isDragMode ? "cursor-default" : isArrangeMode && selectedTool !== "select" ? "cursor-crosshair" : ""}`}
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
                  const basePosition = table.position || {
                    ...constrainPosition(15 + (index % 4) * 20, 20 + Math.floor(index / 4) * 20)
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
                          onContextMenu={e => handleTableRightClick(e, table)}
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

                          {isDragMode && (
                            <div className="absolute -top-1 -right-1 bg-blue-500 text-white rounded-full w-4 h-4 flex items-center justify-center">
                              <Move className="w-2 h-2" />
                            </div>
                          )}

                          {isArrangeMode && !isDragMode && (
                            <div className="absolute -top-1 -left-1 bg-orange-500 text-white rounded-full w-4 h-4 flex items-center justify-center">
                              <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                            </div>
                          )}

                          {isUpdating && (
                            <div className="absolute inset-0 bg-blue-500 bg-opacity-20 rounded-full flex items-center justify-center">
                              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                            </div>
                          )}
                        </div>
                        {tableOrders[table.number?.toString()] && tableOrders[table.number.toString()] > 0 && <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shadow-lg border-2 border-white z-10">{tableOrders[table.number.toString()]}</div>}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        <div className="px-6 py-2 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="px-6  border-b border-gray-100">
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
            <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[8px] border-r-[8px] border-b-[8px] border-l-transparent border-r-transparent border-b-white drop-shadow-sm"></div>
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

      {/* Table Management Modals */}
      <RenameTableModal
        isOpen={showRenameModal}
        onClose={() => {
          setShowRenameModal(false);
          setSelectedTableForAction(null);
        }}
        table={selectedTableForAction}
        onTableRenamed={(updatedTable: Table) => {
          // Update the table in the local state with the fresh data from API
          setUpdatedTables(prev => prev.map(t => (t.id === updatedTable.id ? updatedTable : t)));
          setShowRenameModal(false);
          setSelectedTableForAction(null);
        }}
      />

      <TransferTableModal
        isOpen={showTransferModal}
        onClose={() => {
          setShowTransferModal(false);
          setSelectedTableForAction(null);
        }}
        sourceTable={selectedTableForAction}
        sourceOrder={selectedTableForAction?.currentOrder}
        tables={updatedTables}
        onTransferComplete={() => {
          setShowTransferModal(false);
          setSelectedTableForAction(null);
          window.location.reload(); // Temporary solution
        }}
      />

      {/* Right-click Context Menu */}
      {contextMenu && (
        <>
          {/* Backdrop to close context menu */}
          <div className="fixed inset-0 z-40" onClick={() => setContextMenu(null)} />

          {/* Context Menu */}
          <div
            className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-lg py-2 min-w-[180px]"
            style={{
              left: contextMenu.x,
              top: contextMenu.y,
              transform: "translate(-50%, 0)"
            }}
          >
            <div className="px-3 py-2 border-b border-gray-100">
              <div className="font-medium text-gray-900">Table {contextMenu.table.number}</div>
              <div className="text-sm text-gray-500">
                {contextMenu.table.seats} seats • {contextMenu.table.status}
              </div>
            </div>

            <div className="py-1">
              <button onClick={() => handleRenameTable(contextMenu.table)} className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2">
                <Edit3 className="w-4 h-4" />
                Rename Table
              </button>

              {(contextMenu.table.status === "opened" || contextMenu.table.currentOrder || tableOrders[contextMenu.table.number?.toString()]) && (
                <button onClick={() => handleTransferOrder(contextMenu.table)} className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2">
                  <Move className="w-4 h-4" />
                  Transfer Order
                </button>
              )}

              <div className="border-t border-gray-100 my-1"></div>

              <button onClick={() => handleDeleteTable(contextMenu.table)} disabled={contextMenu.table.status === "opened"} className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 ${contextMenu.table.status === "opened" ? "text-gray-400 cursor-not-allowed" : "text-red-600 hover:bg-red-50"}`}>
                <Trash2 className="w-4 h-4" />
                Delete Table
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
