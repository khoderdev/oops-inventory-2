import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import type { Table as TableType, TablesLayoutProps } from '@/types/inventory';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Circle, Square, Triangle, Move, RectangleHorizontal, Trash2, Settings, Printer, Clock } from 'lucide-react';
import { tablesAPI } from '@/api/tables.api';
import { ordersAPI } from '@/api/orders.api';
import { toast } from 'sonner';
import { formatTime, getTableShape, getTableStatusColor } from './constants';
import { RenameTableModal, TransferTableModal, InactiveTablesModal, DeleteTableModal } from '@/components/tables';
import { TableContextMenu } from '../ui/TableContextMenu';
import ClearTableModal from '../tables/ClearTableModal';

// Extended Table interface to include position properties
interface ExtendedTable extends Omit<TableType, 'table'> {
  table: ExtendedTable; // Self-referential property to match Table interface
  posX?: number;
  posY?: number;
  currentOrder?: {
    orderId: string;
    orderNumber?: string;
    customerName?: string;
    startTime: string | Date;
    totalAmount: number;
    itemCount: number;
    items?: any[];
    total?: number;
  };
}

// Component props interfaces
interface TableContextMenuProps {
  position: { x: number; y: number };
  table: ExtendedTable;
  onAction: (action: string, table: ExtendedTable) => void;
  onClose: () => void;
}

interface RenameTableModalProps {
  isOpen: boolean;
  onClose: () => void;
  table: ExtendedTable;
  onSuccess: () => Promise<void>;
}

interface TransferTableModalProps {
  isOpen: boolean;
  onClose: () => void;
  sourceTable: ExtendedTable;
  order: any;
  tables: ExtendedTable[];
  onSuccess: () => Promise<void>;
}

interface InactiveTablesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => Promise<void>;
}

interface DeleteTableModalProps {
  isOpen: boolean;
  onClose: () => void;
  table: ExtendedTable;
  isDeleting: boolean;
  onDelete: () => Promise<void>;
}

interface ClearTableModalProps {
  isOpen: boolean;
  onClose: () => void;
  table: ExtendedTable;
  onSuccess: () => Promise<void>;
}

// Use the same props interface as the original TablesLayout but with ExtendedTable
interface TablesPageProps extends Omit<TablesLayoutProps, 'tables' | 'selectedTable' | 'onTableSelect'> {
  tables: ExtendedTable[];
  selectedTable: ExtendedTable | null;
  onTableSelect: (table: ExtendedTable) => void;
}

export const TablesPage: React.FC<TablesPageProps> = ({
  tables,
  tableOrders = {},
  selectedTable,
  onTableSelect,
  onClose,
  printedTables = []
}) => {
  // State from original TablesLayout
  const safeTablesList = useMemo(() => Array.isArray(tables) ? tables : [], [tables]);
  const [updatedTables, setUpdatedTables] = useState<ExtendedTable[]>(safeTablesList);
  const [hoveredTable, setHoveredTable] = useState<ExtendedTable | null>(null);
  const [popupPosition, setPopupPosition] = useState<{ x: number; y: number } | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const layoutRef = useRef<HTMLDivElement>(null);
  const [isDragMode, setIsDragMode] = useState(false);
  const [isArrangeMode, setIsArrangeMode] = useState(false);
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
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showInactiveTablesModal, setShowInactiveTablesModal] = useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [selectedTableForAction, setSelectedTableForAction] = useState<ExtendedTable | null>(null);
  const [selectedOrderForTransfer, setSelectedOrderForTransfer] = useState<any>(null);
  const [inactiveTablesCount, setInactiveTablesCount] = useState(0);
  const [isDeletingTable, setIsDeletingTable] = useState(false);
  const [isContextMenuOpen, setIsContextMenuOpen] = useState(false);
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [tableToClear, setTableToClear] = useState<ExtendedTable | null>(null);
  
  // Group tables by section
  const tablesBySection = useMemo(() => {
    const sections: Record<string, ExtendedTable[]> = {};
    
    if (Array.isArray(updatedTables)) {
      updatedTables.forEach(table => {
        const section = table.section || 'Main';
        if (!sections[section]) {
          sections[section] = [];
        }
        sections[section].push(table);
      });
    }
    
    return sections;
  }, [updatedTables]);
  
  // Functions from original TablesLayout
  useEffect(() => {
    setUpdatedTables(safeTablesList);
    fetchInactiveTablesCount();
  }, [safeTablesList]);

  const fetchInactiveTablesCount = async () => {
    try {
      const response = await tablesAPI.getTables();
      let allTables = [];
      if (Array.isArray(response)) {
        allTables = response;
      } else {
        toast.error("Failed to fetch inactive tables");
        setInactiveTablesCount(0);
        return;
      }
      const inactiveCount = allTables.filter(table => table.isActive === false).length;
      setInactiveTablesCount(inactiveCount);
    } catch (error) {
      toast.error("Failed to fetch inactive tables");
      setInactiveTablesCount(0);
    }
  };

  const refreshTablesData = async () => {
    try {
      const response = await tablesAPI.getTables({ includeOrders: true });
      let freshTables = [];
      if (Array.isArray(response)) {
        freshTables = response;
      } else {
        toast.error("Failed to refresh tables");
        return;
      }
      const activeTables = freshTables.filter(table => table.isActive !== false);
      setUpdatedTables([...activeTables]);
      await fetchInactiveTablesCount();
    } catch (error) {
      toast.error("Failed to refresh tables");
    }
  };
  
  // Table action handlers
  const handleRenameTable = (table: ExtendedTable) => {
    setSelectedTableForAction(table);
    setShowRenameModal(true);
  };

  const handleTransferOrder = (table: ExtendedTable) => {
    if (!table.currentOrder) {
      toast.error("No active order to transfer");
      return;
    }
    setSelectedTableForAction(table);
    setSelectedOrderForTransfer(table.currentOrder);
    setShowTransferModal(true);
  };

  const handleDeleteTable = (table: ExtendedTable) => {
    setSelectedTableForAction(table);
    setShowDeleteConfirmModal(true);
  };

  const handleClearTable = (table: ExtendedTable) => {
    setTableToClear(table);
    setShowClearDialog(true);
  };

  const handleTableAction = (action: string, table: ExtendedTable) => {
    switch (action) {
      case "rename":
        handleRenameTable(table);
        break;
      case "transfer":
        handleTransferOrder(table);
        break;
      case "delete":
        handleDeleteTable(table);
        break;
      case "clear":
        handleClearTable(table);
        break;
      default:
        break;
    }
  };
  
  // Handle table hover for popup info
  const handleTableHover = (table: ExtendedTable, event: React.MouseEvent) => {
    if (!isArrangeMode && !isDragMode) {
      setHoveredTable(table);
      setPopupPosition({ x: event.clientX, y: event.clientY - 10 });
    }
  };

  const handleTableLeave = () => {
    if (!isContextMenuOpen) {
      setHoveredTable(null);
      setPopupPosition(null);
    }
  };
  
  return (
    <div className="fixed inset-0 bg-gray-50 z-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm" onClick={onClose}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-xl font-bold">Tables Layout</h1>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Table management buttons */}
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setIsArrangeMode(!isArrangeMode)}
              className={isArrangeMode ? "bg-blue-100" : ""}
            >
              <Move className="h-4 w-4 mr-1" />
              Arrange
            </Button>
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowInactiveTablesModal(true)}
            >
              <Settings className="h-4 w-4 mr-1" />
              Manage Tables {inactiveTablesCount > 0 && <span className="ml-1 bg-red-500 text-white rounded-full px-1.5 py-0.5 text-xs">{inactiveTablesCount}</span>}
            </Button>
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={refreshTablesData}
            >
              <Clock className="h-4 w-4 mr-1" />
              Refresh
            </Button>
          </div>
          
          {/* Table status legend */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="text-xs">Available</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span className="text-xs">Occupied</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <span className="text-xs">Cleaning</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Content */}
      <div className="flex-1 overflow-auto p-6" ref={layoutRef}>
        <div className="relative" ref={canvasRef}>
          {Object.entries(tablesBySection).map(([section, sectionTables]) => (
            <div key={section} className="mb-8">
              <h2 className="text-lg font-semibold mb-4 text-gray-700 border-b pb-2">{section}</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
                {sectionTables.map(table => {
                  const isPrinted = printedTables.includes(table.id);
                  const hasOrder = tableOrders[table.id] > 0;
                  
                  return (
                    <div
                      key={table.id}
                      className={`border rounded-lg p-4 cursor-pointer transition-all ${
                        selectedTable?.id === table.id 
                          ? 'ring-2 ring-blue-500 border-blue-500' 
                          : table.status === 'opened' 
                            ? 'border-red-300 bg-red-50' 
                            : table.status === 'cleaning'
                              ? 'border-yellow-300 bg-yellow-50'
                              : 'border-gray-200 hover:border-blue-300'
                      } ${isPrinted ? 'ring-1 ring-green-500' : ''}`}
                      onClick={() => !isArrangeMode && onTableSelect(table)}
                      onMouseEnter={(e) => handleTableHover(table, e)}
                      onMouseLeave={handleTableLeave}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        setSelectedTableForAction(table);
                        setPopupPosition({ x: e.clientX, y: e.clientY });
                        setIsContextMenuOpen(true);
                      }}
                      style={{
                        position: isArrangeMode ? 'absolute' : 'relative',
                        left: isArrangeMode ? `${(table as ExtendedTable).posX || 0}px` : 'auto',
                        top: isArrangeMode ? `${(table as ExtendedTable).posY || 0}px` : 'auto',
                        transform: tempPositions[table.id] && isArrangeMode
                          ? `translate(${tempPositions[table.id].x}px, ${tempPositions[table.id].y}px)`
                          : 'none',
                        zIndex: dragState?.tableId === table.id ? 10 : 1,
                        cursor: isArrangeMode ? 'move' : 'pointer'
                      }}
                    >
                      <div className="flex flex-col items-center">
                        <div className={`flex items-center justify-center w-12 h-12 rounded-full bg-white border mb-2 ${hasOrder ? 'border-blue-500' : ''}`}>
                          <span className="text-lg font-bold">{table.number}</span>
                        </div>
                        <div className="text-sm font-medium">Table {table.number}</div>
                        <div className="text-xs text-gray-500 flex items-center space-x-1">
                          <span>{table.seats} seats</span>
                          {table.shape === 'round' ? <Circle className="h-3 w-3" /> : 
                           table.shape === 'square' ? <Square className="h-3 w-3" /> : 
                           <RectangleHorizontal className="h-3 w-3" />}
                        </div>
                        <div className={`text-xs mt-1 ${
                          table.status === 'opened' ? 'text-red-600 font-medium' : 
                          table.status === 'cleaning' ? 'text-yellow-600' : 'text-green-600'
                        }`}>
                          {table.status === 'opened' ? 'Occupied' : 
                           table.status === 'cleaning' ? 'Cleaning' : 'Available'}
                        </div>
                        {tableOrders[table.id] > 0 && (
                          <div className="mt-2 bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                            {tableOrders[table.id]} order(s)
                          </div>
                        )}
                        {isPrinted && (
                          <div className="absolute -top-1 -right-1 bg-green-500 text-white rounded-full p-1">
                            <Printer className="h-3 w-3" />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Footer */}
      <div className="bg-white border-t border-gray-200 p-4 flex justify-between">
        <div>
          {isArrangeMode && (
            <Button 
              variant="outline" 
              onClick={() => {
                setIsArrangeMode(false);
                setTempPositions({});
              }}
            >
              Cancel
            </Button>
          )}
        </div>
        
        <div className="flex space-x-3">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          {selectedTable && !isArrangeMode && (
            <Button 
              onClick={() => onTableSelect(selectedTable)} 
              disabled={selectedTable.status === 'cleaning'}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {selectedTable.status === 'opened' ? 'Continue Order' : 'Start Order'}
            </Button>
          )}
        </div>
      </div>
      
      {/* Table hover popup */}
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
                  {hoveredTable.currentOrder && (
                    <>
                      <div className="text-center">
                        <div className="font-bold text-lg text-gray-800">
                          {hoveredTable.currentOrder?.orderNumber || `ORD-${String(hoveredTable.currentOrder?.orderId).padStart(4, '0')}`}
                        </div>
                      </div>
                      <Separator />
                    </>
                  )}
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status</span>
                    <span className="font-medium">{hoveredTable.status}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Seats</span>
                    <span className="font-medium">{hoveredTable.seats}</span>
                  </div>
                  
                  {hoveredTable.currentOrder && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Amount</span>
                        <span className="font-medium">{hoveredTable.currentOrder.totalAmount ? `$${hoveredTable.currentOrder.totalAmount.toFixed(2)}` : '-'}</span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-gray-600">Items</span>
                        <span className="font-medium">{hoveredTable.currentOrder.itemCount || 0}</span>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
      
      {/* Context menu is not used here directly - it's used as a wrapper in the table rendering */}
      
      {/* Modals */}
      {showRenameModal && selectedTableForAction && (
        <RenameTableModal
          isOpen={showRenameModal}
          onClose={() => setShowRenameModal(false)}
          table={selectedTableForAction as unknown as TableType}
          onTableRenamed={async () => await refreshTablesData()}
        />
      )}
      
      {showTransferModal && selectedTableForAction && selectedOrderForTransfer && (
        <TransferTableModal
          isOpen={showTransferModal}
          onClose={() => {
            setShowTransferModal(false);
            setSelectedOrderForTransfer(null);
          }}
          sourceTable={selectedTableForAction as unknown as TableType}
          sourceOrder={selectedOrderForTransfer}
          tables={updatedTables.filter(t => t.id !== selectedTableForAction.id && t.status !== 'opened') as unknown as TableType[]}
          onTransferComplete={refreshTablesData}
        />
      )}
      
      {showInactiveTablesModal && (
        <InactiveTablesModal
          isOpen={showInactiveTablesModal}
          onClose={() => setShowInactiveTablesModal(false)}
          onTablesUpdated={refreshTablesData}
        />
      )}
      
      {showDeleteConfirmModal && selectedTableForAction && (
        <DeleteTableModal
          isOpen={showDeleteConfirmModal}
          onClose={() => setShowDeleteConfirmModal(false)}
          table={selectedTableForAction as unknown as TableType}
          isDeleting={isDeletingTable}
          onTableDeleted={async () => {
            setIsDeletingTable(true);
            try {
              await tablesAPI.deleteTable(selectedTableForAction.id);
              toast.success(`Table ${selectedTableForAction.number} deleted successfully`);
              refreshTablesData();
              setShowDeleteConfirmModal(false);
            } catch (error) {
              toast.error(`Failed to delete table: ${error}`);
            } finally {
              setIsDeletingTable(false);
            }
          }}
        />
      )}
      
      {showClearDialog && tableToClear && (
        <ClearTableModal
          showClearDialog={showClearDialog}
          setShowClearDialog={setShowClearDialog}
          tableToClear={tableToClear as unknown as TableType}
          setTableToClear={setTableToClear as unknown as React.Dispatch<React.SetStateAction<TableType | null>>}
          confirmClearTable={async () => {
            try {
              await tablesAPI.clearTable(tableToClear.id);
              toast.success(`Table ${tableToClear.number} cleared successfully`);
              refreshTablesData();
              setShowClearDialog(false);
              setTableToClear(null);
            } catch (error) {
              toast.error(`Failed to clear table: ${error}`);
            }
          }}
        />
      )}
    </div>
  );
};

export default TablesPage;
