import React from 'react';
import { Table } from '@/types/inventory';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Circle, Square, Triangle } from 'lucide-react';

interface TablesPageProps {
  tables: Table[];
  tableOrders: { [tableId: string]: number };
  selectedTable: Table | null;
  onTableSelect: (table: Table) => void;
  onClose: () => void;
}

export const TablesPage: React.FC<TablesPageProps> = ({
  tables,
  tableOrders,
  selectedTable,
  onTableSelect,
  onClose
}) => {
  console.log('📊 TablesPage RENDERING');
  console.log('📊 Tables count:', tables?.length || 0);
  
  // Group tables by section
  const tablesBySection = React.useMemo(() => {
    const sections: Record<string, Table[]> = {};
    
    if (Array.isArray(tables)) {
      tables.forEach(table => {
        const section = table.section || 'Main';
        if (!sections[section]) {
          sections[section] = [];
        }
        sections[section].push(table);
      });
    }
    
    return sections;
  }, [tables]);
  
  // Get shape icon based on table shape
  const getTableShape = (shape: string | undefined) => {
    switch (shape?.toLowerCase()) {
      case 'circle':
        return <Circle className="h-4 w-4" />;
      case 'square':
        return <Square className="h-4 w-4" />;
      default:
        return <Triangle className="h-4 w-4" />;
    }
  };
  
  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'opened':
        return 'bg-red-100 border-red-300 text-red-800';
      case 'cleaning':
        return 'bg-yellow-100 border-yellow-300 text-yellow-800';
      default:
        return 'bg-green-100 border-green-300 text-green-800';
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
        
        <div className="flex items-center space-x-2">
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
      
      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {Object.entries(tablesBySection).map(([section, sectionTables]) => (
          <div key={section} className="mb-8">
            <h2 className="text-lg font-semibold mb-4 text-gray-700 border-b pb-2">{section}</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
              {sectionTables.map(table => (
                <div
                  key={table.id}
                  className={`border rounded-lg p-4 cursor-pointer transition-all ${
                    selectedTable?.id === table.id 
                      ? 'ring-2 ring-blue-500 border-blue-500' 
                      : `${getStatusColor(table.status)}`
                  }`}
                  onClick={() => onTableSelect(table)}
                >
                  <div className="flex flex-col items-center">
                    <div className="flex items-center justify-center w-12 h-12 rounded-full bg-white border mb-2">
                      <span className="text-lg font-bold">{table.number}</span>
                    </div>
                    <div className="text-sm font-medium">Table {table.number}</div>
                    <div className="text-xs text-gray-500 flex items-center space-x-1">
                      <span>{table.seats} seats</span>
                      {getTableShape(table.shape)}
                    </div>
                    <div className={`text-xs mt-1 ${
                      table.status === 'opened' ? 'text-red-600 font-medium' : 
                      table.status === 'cleaning' ? 'text-yellow-600' : 'text-green-600'
                    }`}>
                      {table.status === 'opened' ? 'Occupied' : 
                       table.status === 'cleaning' ? 'Cleaning' : 'Available'}
                    </div>
                    {tableOrders[table.id] && (
                      <div className="mt-2 bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                        {tableOrders[table.id]} order(s)
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      
      {/* Footer */}
      {selectedTable && (
        <div className="bg-white border-t border-gray-200 p-4 flex justify-end">
          <Button 
            onClick={() => onTableSelect(selectedTable)}
            disabled={selectedTable.status === 'cleaning'}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {selectedTable.status === 'opened' ? 'Continue Order' : 'Start Order'}
          </Button>
        </div>
      )}
    </div>
  );
};

export default TablesPage;
