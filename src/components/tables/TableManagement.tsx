import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { tablesAPI } from '@/api/tables.api';
import { Table } from '@/types/inventory';
import { TableManagementToolbar } from './TableManagementToolbar';
import { CreateTableModal } from './CreateTableModal';
import { RenameTableModal } from './RenameTableModal';
import { BulkTableModal } from './BulkTableModal';
import { TransferTableModal } from './TransferTableModal';
import { TableActionsMenu } from './TableActionsMenu';
import { Circle, Square, RectangleHorizontal, Users, MapPin, Clock, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface TableManagementProps {
  onTableSelect?: (table: Table) => void;
  selectedTable?: Table | null;
  tableOrders?: Record<string, any>;
  showSelection?: boolean;
}

export const TableManagement: React.FC<TableManagementProps> = ({
  onTableSelect,
  selectedTable,
  tableOrders = {},
  showSelection = false
}) => {
  const [tables, setTables] = useState<Table[]>([]);
  const [sections, setSections] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // UI State
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSection, setSelectedSection] = useState('all');

  // Modal States
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [selectedTableForAction, setSelectedTableForAction] = useState<Table | null>(null);

  // Load data
  useEffect(() => {
    loadTables();
    loadSections();
  }, []);

  const loadTables = async () => {
    try {
      setIsLoading(true);
      const response = await tablesAPI.getTables({ includeOrders: true });
      setTables(response.data.data || []);
      setError(null);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to load tables');
      toast.error('Failed to load tables');
    } finally {
      setIsLoading(false);
    }
  };

  const loadSections = async () => {
    try {
      const response = await tablesAPI.getTableSections();
      setSections(response.data.data || []);
    } catch (error) {
      console.error('Failed to load sections:', error);
    }
  };

  // Filter tables based on search and section
  const filteredTables = useMemo(() => {
    return tables.filter(table => {
      const matchesSearch = !searchQuery || 
        table.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        table.number.toString().includes(searchQuery);
      
      const matchesSection = selectedSection === 'all' || table.section === selectedSection;
      
      return matchesSearch && matchesSection;
    });
  }, [tables, searchQuery, selectedSection]);

  // Table statistics
  const tableStats = useMemo(() => {
    const total = filteredTables.length;
    const available = filteredTables.filter(t => t.status === 'available').length;
    const occupied = filteredTables.filter(t => t.status === 'opened').length;
    
    return { total, available, occupied };
  }, [filteredTables]);

  // Action handlers
  const handleCreateTable = () => {
    setShowCreateModal(true);
  };

  const handleBulkCreate = () => {
    setShowBulkModal(true);
  };

  const handleEditTable = (table: Table) => {
    setSelectedTableForAction(table);
    // Could open an edit modal here
    toast.info('Edit functionality can be added here');
  };

  const handleRenameTable = (table: Table) => {
    setSelectedTableForAction(table);
    setShowRenameModal(true);
  };

  const handleTransferOrder = (table: Table) => {
    setSelectedTableForAction(table);
    setShowTransferModal(true);
  };

  const handleDuplicateTable = async (table: Table) => {
    try {
      const response = await tablesAPI.duplicateTable(table.id.toString());
      toast.success(response.data.message);
      loadTables();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to duplicate table');
    }
  };

  const handleDeleteTable = async (table: Table) => {
    if (table.status === 'opened') {
      toast.error('Cannot delete table with active orders');
      return;
    }

    if (confirm(`Are you sure you want to delete Table ${table.number}?`)) {
      try {
        await tablesAPI.deleteTable(table.id.toString());
        toast.success('Table deleted successfully');
        loadTables();
      } catch (error: any) {
        toast.error(error.response?.data?.message || 'Failed to delete table');
      }
    }
  };

  const getShapeIcon = (shape: string) => {
    switch (shape) {
      case 'round': return <Circle className="w-4 h-4" />;
      case 'rectangle': return <RectangleHorizontal className="w-4 h-4" />;
      default: return <Square className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-500';
      case 'opened': return 'bg-red-500';
      case 'reserved': return 'bg-yellow-500';
      case 'cleaning': return 'bg-blue-500';
      case 'out_of_order': return 'bg-gray-500';
      default: return 'bg-gray-400';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading tables...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <TableManagementToolbar
        totalTables={tableStats.total}
        availableTables={tableStats.available}
        occupiedTables={tableStats.occupied}
        sections={sections}
        selectedSection={selectedSection}
        onSectionChange={setSelectedSection}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onCreateTable={handleCreateTable}
        onBulkCreate={handleBulkCreate}
      />

      {/* Tables Grid/List */}
      {filteredTables.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-muted-foreground">
            {searchQuery || selectedSection !== 'all' ? 
              'No tables match your filters' : 
              'No tables found. Create your first table to get started.'
            }
          </div>
          {!searchQuery && selectedSection === 'all' && (
            <Button onClick={handleCreateTable} className="mt-4">
              Create First Table
            </Button>
          )}
        </div>
      ) : (
        <div className={
          viewMode === 'grid' 
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
            : 'space-y-2'
        }>
          {filteredTables.map(table => (
            <Card 
              key={table.id} 
              className={`
                relative cursor-pointer transition-all hover:shadow-md
                ${selectedTable?.id === table.id ? 'ring-2 ring-primary' : ''}
                ${showSelection ? 'hover:ring-1 hover:ring-primary/50' : ''}
              `}
              onClick={() => showSelection && onTableSelect?.(table)}
            >
              <CardContent className="p-4">
                {/* Status Indicator */}
                <div className={`absolute top-2 right-2 w-3 h-3 rounded-full ${getStatusColor(table.status)}`} />
                
                {/* Table Header */}
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-lg">Table {table.number}</h3>
                    <p className="text-sm text-muted-foreground">{table.name}</p>
                  </div>
                  <TableActionsMenu
                    table={table}
                    onEdit={handleEditTable}
                    onRename={handleRenameTable}
                    onTransfer={handleTransferOrder}
                    onDuplicate={handleDuplicateTable}
                    onDelete={handleDeleteTable}
                  />
                </div>

                {/* Table Details */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {table.seats} seats
                    </div>
                    <div className="flex items-center gap-1">
                      {getShapeIcon(table.shape)}
                      {table.shape}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 text-sm">
                    <MapPin className="w-4 h-4" />
                    {table.section}
                  </div>

                  {/* Order Info */}
                  {table.status === 'opened' && table.currentOrder && (
                    <div className="mt-3 p-2 bg-red-50 rounded border border-red-200">
                      <div className="flex items-center gap-1 text-sm text-red-800">
                        <Clock className="w-4 h-4" />
                        Active Order
                      </div>
                      <div className="text-xs text-red-600 mt-1">
                        {table.currentOrder.itemCount} items • ${table.currentOrder.totalAmount}
                      </div>
                    </div>
                  )}

                  {/* Status Badge */}
                  <div className="flex justify-between items-center mt-3">
                    <Badge variant={table.status === 'opened' ? 'destructive' : 'secondary'}>
                      {table.status.replace('_', ' ')}
                    </Badge>
                    
                    {table.status === 'opened' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTransferOrder(table);
                        }}
                      >
                        Transfer
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modals */}
      <CreateTableModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onTableCreated={loadTables}
        sections={sections}
      />

      <RenameTableModal
        isOpen={showRenameModal}
        onClose={() => {
          setShowRenameModal(false);
          setSelectedTableForAction(null);
        }}
        onTableRenamed={loadTables}
        table={selectedTableForAction}
      />

      <BulkTableModal
        isOpen={showBulkModal}
        onClose={() => setShowBulkModal(false)}
        onTablesCreated={loadTables}
        sections={sections}
      />

      <TransferTableModal
        isOpen={showTransferModal}
        onClose={() => {
          setShowTransferModal(false);
          setSelectedTableForAction(null);
        }}
        onTransferComplete={loadTables}
        tables={tables}
        sourceTable={selectedTableForAction}
        sourceOrder={selectedTableForAction?.currentOrder}
      />
    </div>
  );
};
