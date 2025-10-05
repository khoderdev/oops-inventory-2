import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Table, TablesLayoutProps } from "@/types/inventory";
import { formatCurrency } from "@/utils/conversionLogic";
import { Clock, Move, Circle, Square, RectangleHorizontal, Trash2, Settings, Printer, X } from "lucide-react";
import React, { useRef, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { formatTime, getTableShape, getTableStatusColor } from "./constants";
import { RenameTableModal, TransferTableModal, InactiveTablesModal, DeleteTableModal } from "@/components/tables";
import { TableContextMenu } from "../ui/TableContextMenu";
import ClearTableModal from "../tables/ClearTableModal";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchTables,
  fetchInactiveTables,
  setSelectedTable,
  setHoveredTable,
  setPopupPosition,
  setArrangeMode,
  setDragMode,
  setSelectedTool,
  setDragState,
  setTempPosition,
  clearTempPosition,
  setIsUpdatingPosition,
  setShowRenameModal,
  setShowTransferModal,
  setShowInactiveTablesModal,
  setShowDeleteModal,
  setShowClearModal,
  setIsContextMenuOpen,
  setSelectedTableForAction,
  setTableToClear,
  setTransferSourceTable,
  setTransferSourceOrder,
  clearTransferState,
  updateTablePosition,
  deleteTable,
  clearTableReservation,
  createTable,
  fetchTableOrder
} from "@/store/slices/tablesSlice";
import {
  selectTables,
  selectSelectedTable,
  selectHoveredTable,
  selectPopupPosition,
  selectIsArrangeMode,
  selectIsDragMode,
  selectSelectedTool,
  selectDragState,
  selectTempPositions,
  selectIsUpdatingPosition,
  selectShowRenameModal,
  selectShowTransferModal,
  selectShowInactiveTablesModal,
  selectShowDeleteModal,
  selectShowClearModal,
  selectIsContextMenuOpen,
  selectSelectedTableForAction,
  selectTableToClear,
  selectTransferSourceTable,
  selectTransferSourceOrder,
  selectInactiveTablesCount,
  selectIsDeleting,
  selectTableOrders,
  selectPrintedTables
} from "@/store/slices/tablesSelectors";

export const TablesLayout: React.FC<TablesLayoutProps> = ({ onTableSelect, onClose, hideHeaderFooter = false }) => {
  const dispatch = useAppDispatch();

  // Redux selectors
  const tables = useAppSelector(selectTables);
  const selectedTable = useAppSelector(selectSelectedTable);
  const hoveredTable = useAppSelector(selectHoveredTable);
  const popupPosition = useAppSelector(selectPopupPosition);
  const isArrangeMode = useAppSelector(selectIsArrangeMode);
  const isDragMode = useAppSelector(selectIsDragMode);
  const selectedTool = useAppSelector(selectSelectedTool);
  const dragState = useAppSelector(selectDragState);
  const tempPositions = useAppSelector(selectTempPositions);
  const isUpdatingPosition = useAppSelector(selectIsUpdatingPosition);
  const showRenameModal = useAppSelector(selectShowRenameModal);
  const showTransferModal = useAppSelector(selectShowTransferModal);
  const showInactiveTablesModal = useAppSelector(selectShowInactiveTablesModal);
  const showDeleteConfirmModal = useAppSelector(selectShowDeleteModal);
  const showClearDialog = useAppSelector(selectShowClearModal);
  const isContextMenuOpen = useAppSelector(selectIsContextMenuOpen);
  const selectedTableForAction = useAppSelector(selectSelectedTableForAction);
  const tableToClear = useAppSelector(selectTableToClear);
  const transferSourceTable = useAppSelector(selectTransferSourceTable);
  const transferSourceOrder = useAppSelector(selectTransferSourceOrder);
  const inactiveTablesCount = useAppSelector(selectInactiveTablesCount);
  const isDeletingTable = useAppSelector(selectIsDeleting);
  const tableOrders = useAppSelector(selectTableOrders);
  const printedTables = useAppSelector(selectPrintedTables);

  // Refs
  const canvasRef = useRef<HTMLDivElement>(null);
  const layoutRef = useRef<HTMLDivElement>(null);
  const dragStateRef = useRef(dragState);

  console.log("🎯 [TablesLayout] COMPONENT RENDERING");
  console.log("🎯 [TablesLayout] Redux state:", {
    tablesCount: tables?.length || 0,
    selectedTable,
    tableOrders,
    printedTablesCount: printedTables?.length || 0
  });

  // Fetch tables on mount
  useEffect(() => {
    dispatch(fetchTables({ includeOrders: true }));
    dispatch(fetchInactiveTables());
  }, [dispatch]);

  const refreshTablesData = useCallback(async () => {
    await dispatch(fetchTables({ includeOrders: true })).unwrap();
    await dispatch(fetchInactiveTables()).unwrap();
  }, [dispatch]);

  useEffect(() => {
    dragStateRef.current = dragState;
  }, [dragState]);

  const handleRenameTable = useCallback(
    (table: Table) => {
      console.log("✏️ [TablesLayout] handleRenameTable called for table:", table);
      dispatch(setSelectedTableForAction(table));
      dispatch(setShowRenameModal(true));
      console.log("✅ [TablesLayout] Rename modal state set to true");
    },
    [dispatch]
  );

  const handleTransferOrder = useCallback(
    async (table: Table) => {
      console.log("🔄 [TablesLayout] handleTransferOrder called for table:", table);
      try {
        if (!table.currentOrder?.orderId) {
          console.log("❌ [TablesLayout] No order found for table", table.number);
          toast.error("No order found for this table");
          return;
        }
        console.log("📡 [TablesLayout] Fetching order details for orderId:", table.currentOrder.orderId);
        const fullOrderData = await dispatch(fetchTableOrder(table.currentOrder.orderId)).unwrap();
        console.log("✅ [TablesLayout] Order data fetched:", fullOrderData);
        dispatch(setSelectedTableForAction(table));
        dispatch(setTransferSourceTable(table));
        dispatch(setTransferSourceOrder(fullOrderData));
        dispatch(setShowTransferModal(true));
        console.log("✅ [TablesLayout] Transfer modal state set to true");
      } catch (error: any) {
        console.error("❌ [TablesLayout] Failed to fetch order details:", error);
        toast.error("Failed to load order details");
      }
    },
    [dispatch]
  );

  const handleDeleteTable = useCallback(
    (table: Table) => {
      console.log("🗑️ [TablesLayout] handleDeleteTable called for table:", table);
      if (table.status === "opened") {
        console.log("❌ [TablesLayout] Cannot delete table with active orders");
        toast.error("Cannot delete table with active orders");
        return;
      }
      dispatch(setSelectedTableForAction(table));
      dispatch(setShowDeleteModal(true));
      console.log("✅ [TablesLayout] Delete modal state set to true");
    },
    [dispatch]
  );

  const requestClearTable = useCallback(
    (table: Table) => {
      console.log("🧹 [TablesLayout] requestClearTable called for table:", table);
      dispatch(setTableToClear(table));
      dispatch(setShowClearModal(true));
      console.log("✅ [TablesLayout] Clear dialog state set to true");
    },
    [dispatch]
  );

  const handleClearTable = useCallback(
    async (table: Table) => {
      try {
        await dispatch(clearTableReservation(table.id.toString())).unwrap();
        toast.success(`Table ${table.number} has been cleared`);
      } catch (error: any) {
        console.error("Failed to clear table:", error);
        toast.error(error.response?.data?.message || "Failed to clear table");
      }
    },
    [dispatch]
  );

  const confirmClearTable = useCallback(async () => {
    if (!tableToClear) return;
    await handleClearTable(tableToClear);
    dispatch(setShowClearModal(false));
    dispatch(setTableToClear(null));
  }, [tableToClear, handleClearTable, dispatch]);

  const confirmDeleteTable = useCallback(async () => {
    if (!selectedTableForAction) return;
    try {
      await dispatch(deleteTable(selectedTableForAction.id.toString())).unwrap();
      toast.success(`Table ${selectedTableForAction.number} deleted`);
      await refreshTablesData();
      dispatch(setShowDeleteModal(false));
      dispatch(setSelectedTableForAction(null));
    } catch (error: any) {
      console.error("Delete table error:", error);
      toast.error(error.response?.data?.message || "Failed to delete table");
    }
  }, [selectedTableForAction, dispatch, refreshTablesData]);

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
      const currentTable = tables.find(t => t.id === table.id);
      const currentPosition = currentTable?.position || { x: 50, y: 50 };
      const tableCenterX = (currentPosition.x / 100) * rect.width;
      const tableCenterY = (currentPosition.y / 100) * rect.height;
      const offsetX = mouseX - tableCenterX;
      const offsetY = mouseY - tableCenterY;
      dispatch(
        setDragState({
          isDragging: true,
          tableId: table.id,
          offset: { x: offsetX, y: offsetY },
          startPosition: currentPosition
        })
      );
      document.body.style.cursor = "grabbing";
      document.body.style.userSelect = "none";
    },
    [isDragMode, tables, dispatch]
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
      dispatch(setTempPosition({ tableId: currentDragState.tableId, position: newPosition }));
    },
    [pixelToPercentage, dispatch]
  );

  const handleGlobalMouseUp = useCallback(async () => {
    const currentDragState = dragStateRef.current;
    if (!currentDragState?.isDragging) return;
    const finalPosition = tempPositions[currentDragState.tableId];
    if (finalPosition) {
      try {
        await dispatch(updateTablePosition({ tableId: currentDragState.tableId, position: finalPosition })).unwrap();
      } catch (error) {
        console.error("Failed to update table position:", error);
        toast.error("Failed to update table position");
        dispatch(clearTempPosition(currentDragState.tableId));
      }
    }
    dispatch(setDragState(null));
  }, [tempPositions, dispatch]);

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
        dispatch(setSelectedTable(table));
        onTableSelect(table);
      }
    },
    [isDragMode, isArrangeMode, onTableSelect, dispatch]
  );

  const handleTableHover = useCallback(
    (table: Table, e: React.MouseEvent) => {
      if (isDragMode || isArrangeMode) return;
      if (table.status === "opened" && table.currentOrder) {
        dispatch(setHoveredTable(table));
        dispatch(
          setPopupPosition({
            x: e.clientX,
            y: e.clientY - 10
          })
        );
      }
    },
    [isDragMode, isArrangeMode, dispatch]
  );

  const handleTableLeave = useCallback(() => {
    dispatch(setHoveredTable(null));
    dispatch(setPopupPosition(null));
  }, [dispatch]);

  const handleCanvasClick = useCallback(
    async (e: React.MouseEvent) => {
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
        const existingNumbers = tables.map(t => t.number);
        const maxNumber = existingNumbers.length > 0 ? Math.max(...existingNumbers) : 0;
        const nextNumber = maxNumber + 1;
        const newTableData = {
          number: nextNumber,
          seats: config.seats,
          shape: config.shape,
          position: constrainedPosition
        };
        await dispatch(createTable(newTableData)).unwrap();
        toast.success(`Table ${nextNumber} created successfully`);
        dispatch(setSelectedTool("select"));
      } catch (error) {
        console.error("Failed to create table:", error);
        toast.error("Failed to create table");
      }
    },
    [selectedTool, isDragMode, isArrangeMode, constrainPosition, tables, dispatch]
  );

  return (
    <div
      ref={layoutRef}
      className="md:h-[calc(100vh-0rem)] h-[100dvh] w-full flex flex-col overflow-hidden"
      onContextMenu={e => {
        const target = e.target as HTMLElement | null;
        if (target && target.closest("[data-table-trigger]")) {
          return;
        }
        e.preventDefault();
      }}
    >
      <>
        <div className="h-full flex flex-col">
          {!hideHeaderFooter && (
            <div className="flex items-center justify-between px-6 py-2 border-b border-gray-200">
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
                      <Button key={tool} variant={selectedTool === tool ? "default" : "outline"} size="sm" onClick={() => dispatch(setSelectedTool(tool as any))} disabled={isDragMode} className="flex items-center gap-1" title={title}>
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
                      dispatch(setDragMode(!isDragMode));
                      if (!isDragMode) {
                        dispatch(setSelectedTool("select"));
                      }
                    }}
                    className={isDragMode ? "bg-red-500/10 border border-red-500" : ""}
                  >
                    <Move className="w-4 h-4" />
                    {isDragMode ? "Exit Dragging" : "Drag"}
                  </Button>

                  <Separator orientation="vertical" className="h-6" />

                  <Button variant="outline" size="sm" onClick={() => dispatch(setShowInactiveTablesModal(true))} className="relative">
                    Manage Tables
                    {inactiveTablesCount > 0 && <span className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">{inactiveTablesCount}</span>}
                  </Button>

                  <Separator orientation="vertical" className="h-6" />

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      dispatch(setArrangeMode(false));
                      dispatch(setDragMode(false));
                      dispatch(setSelectedTool("select"));
                    }}
                    className="text-red-600 hover:bg-red-50"
                  >
                    Exit Settings
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      dispatch(setArrangeMode(true));
                      dispatch(setSelectedTool("select"));
                    }}
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Settings
                  </Button>
                  <Button variant="ghost" size="sm" onClick={onClose} className="text-gray-500 hover:text-red-500">
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              )}
            </div>
          )}

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
                onContextMenu={e => {
                  const target = e.target as HTMLElement | null;
                  if (target && target.closest("[data-table-trigger]")) {
                    return;
                  }
                  e.preventDefault();
                }}
              >
                {tables.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center text-gray-500">
                      <div className="text-lg font-medium mb-2">No tables available</div>
                      <div className="text-sm">Tables are being loaded or none are configured.</div>
                    </div>
                  </div>
                ) : (
                  <div className="relative w-full h-full">
                    {tables.map((table, index) => {
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
                          {(() => {
                            const content = (
                              <div className="relative" data-table-trigger>
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
                                    <div className="text-xs text-gray-600 text-center">{table.name}</div>
                                  </div>

                                  {isDragMode && (
                                    <div className="absolute -top-1 -right-1 bg-blue-500 text-white rounded-full w-4 h-4 flex items-center justify-center">
                                      <Move className="w-2 h-2" />
                                    </div>
                                  )}

                                  {isUpdating && (
                                    <div className="absolute inset-0 bg-blue-500 bg-opacity-20 rounded-full flex items-center justify-center">
                                      <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                    </div>
                                  )}
                                </div>
                                {table.id && printedTables.includes(table.id.toString()) && (
                                  <div className="absolute -bottom-1 -left-1 bg-blue-500 text-white rounded-full w-10 h-10 flex items-center justify-center shadow-md z-10">
                                    <Printer className="w-6 h-6" />
                                  </div>
                                )}
                                {tableOrders[table.number?.toString()] && tableOrders[table.number.toString()] > 0 && <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shadow-lg border-2 border-white z-10">{tableOrders[table.number.toString()]}</div>}
                              </div>
                            );
                            return isDragMode || isArrangeMode ? (
                              content
                            ) : (
                              <TableContextMenu
                                table={table}
                                tableOrders={tableOrders}
                                onRename={handleRenameTable}
                                onTransfer={handleTransferOrder}
                                onClear={requestClearTable}
                                onDelete={handleDeleteTable}
                                onOpenChange={open => {
                                  dispatch(setIsContextMenuOpen(open));
                                  if (open) {
                                    dispatch(setHoveredTable(null));
                                    dispatch(setPopupPosition(null));
                                  }
                                }}
                              >
                                {content}
                              </TableContextMenu>
                            );
                          })()}
                        </div>
                      );
                    })}
                  </div>
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

        {hoveredTable && popupPosition && !isContextMenuOpen && (
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

        {/* Modals */}
        <ClearTableModal showClearDialog={showClearDialog} setShowClearDialog={show => dispatch(setShowClearModal(show))} tableToClear={tableToClear} confirmClearTable={confirmClearTable} setTableToClear={table => dispatch(setTableToClear(table))} />

        <RenameTableModal
          isOpen={showRenameModal}
          onClose={() => {
            dispatch(setShowRenameModal(false));
            dispatch(setSelectedTableForAction(null));
          }}
          table={selectedTableForAction}
          onTableRenamed={async () => {
            await refreshTablesData();
            dispatch(setShowRenameModal(false));
            dispatch(setSelectedTableForAction(null));
            toast.success("Table renamed successfully");
          }}
        />

        {console.log("🔍 [TablesLayout] TransferTableModal render check:", {
          showTransferModal,
          transferSourceTable,
          transferSourceOrder,
          tablesCount: tables.length
        })}
        <TransferTableModal
          isOpen={showTransferModal}
          onClose={() => {
            console.log("❌ [TablesLayout] TransferTableModal onClose called");
            dispatch(setShowTransferModal(false));
            dispatch(clearTransferState());
          }}
          tables={tables}
          sourceTable={transferSourceTable}
          sourceOrder={transferSourceOrder}
          onTransferComplete={async () => {
            console.log("✅ [TablesLayout] Transfer completed, refreshing data...");
            dispatch(setShowTransferModal(false));
            dispatch(clearTransferState());
            await refreshTablesData();
            toast.success("Transfer completed successfully");
          }}
        />

        <InactiveTablesModal
          isOpen={showInactiveTablesModal}
          onClose={() => dispatch(setShowInactiveTablesModal(false))}
          onTableActivated={() => {
            refreshTablesData();
          }}
        />

        <DeleteTableModal
          isOpen={showDeleteConfirmModal}
          onClose={() => {
            dispatch(setShowDeleteModal(false));
            dispatch(setSelectedTableForAction(null));
          }}
          onConfirmDelete={confirmDeleteTable}
          table={selectedTableForAction}
          isDeleting={isDeletingTable}
        />
      </>
    </div>
  );
};

// Default export for React.lazy()
export default TablesLayout;
