import React, { useState } from 'react';
import ThermalPrinterSimulator from '../ThermalPrinterSimulator/ThermalPrinterSimulator';
import { formatItemsForPrinter } from '@/utils/thermalPrinterFormatter';
import { POSCartItem, Table } from '@/types/inventory';
import { Employee } from '@/types/employee';
import { Order, OrderType } from '@/types/orders';

/**
 * ThermalPrinterDemo - Interactive demo component for testing thermal printer formatting
 * 
 * This component allows you to:
 * - Test different order scenarios
 * - Preview how receipts will look on thermal paper
 * - Adjust parameters and see real-time updates
 */
const ThermalPrinterDemo: React.FC = () => {
  // Sample data for testing
  const [sampleItems] = useState<POSCartItem[]>([
    {
      id: '1',
      name: '7up',
      quantity: 2,
      price: 15.99,
      assignedPrinter: { id: '1', name: 'Bar Printer' },
      printerId: '1'
    },
    // {
    //   id: '2',
    //   name: 'Caesar Salad',
    //   quantity: 1,
    //   price: 8.50,
    //   assignedPrinter: { id: '1', name: 'Kitchen Printer' },
    //   printerId: '1'
    // },
    // {
    //   id: '3',
    //   name: 'French Fries',
    //   quantity: 3,
    //   price: 4.99,
    //   assignedPrinter: { id: '1', name: 'Kitchen Printer' },
    //   printerId: '1'
    // },
    // {
    //   id: '4',
    //   name: 'Chocolate Cake مع الكريمة',
    //   quantity: 1,
    //   price: 6.99,
    //   assignedPrinter: { id: '1', name: 'Kitchen Printer' },
    //   printerId: '1'
    // }
  ]);

  const [sampleTable] = useState<Table>({
    id: '1',
    number: '12',
    capacity: 4,
    status: 'occupied',
    section: 'main'
  });

  const [sampleEmployee] = useState<Employee>({
    id: '1',
    user: {
      id: '1',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@restaurant.com'
    },
    role: 'waiter',
    isActive: true
  });

  const [orderType, setOrderType] = useState<OrderType>('dine-in');
  const [includeTable, setIncludeTable] = useState(true);
  const [includeEmployee, setIncludeEmployee] = useState(true);

  // Generate preview order number
  const generatePreviewOrderNumber = (): string => {
    return `PREV-${Date.now().toString().slice(-6)}`;
  };

  // Generate the formatted content
  const formattedContent = formatItemsForPrinter({
    items: sampleItems,
    currentOrder: null,
    orderType,
    selectedTable: includeTable ? sampleTable : null,
    selectedEmployee: includeEmployee ? sampleEmployee : null,
    generatePreviewOrderNumber
  });

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          Thermal Printer Simulator
        </h1>
        <p className="text-gray-600">
          Preview how your kitchen orders will appear on thermal paper
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Controls Panel */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-lg font-semibold mb-4">Order Configuration</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Order Type
                </label>
                <select
                  value={orderType}
                  onChange={(e) => setOrderType(e.target.value as OrderType)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="dine-in">Dine In</option>
                  <option value="takeaway">Takeaway</option>
                  <option value="delivery">Delivery</option>
                </select>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="includeTable"
                  checked={includeTable}
                  onChange={(e) => setIncludeTable(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="includeTable" className="text-sm font-medium text-gray-700">
                  Include Table Information
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="includeEmployee"
                  checked={includeEmployee}
                  onChange={(e) => setIncludeEmployee(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="includeEmployee" className="text-sm font-medium text-gray-700">
                  Include Staff Information
                </label>
              </div>
            </div>
          </div>

          {/* Sample Items Display */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-lg font-semibold mb-4">Sample Order Items</h2>
            <div className="space-y-2">
              {sampleItems.map((item) => (
                <div key={item.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span className="font-medium">{item.name}</span>
                  <span className="text-sm text-gray-600">Qty: {item.quantity}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <span className="font-semibold">Total Items:</span>
                <span className="font-semibold">
                  {sampleItems.reduce((sum, item) => sum + item.quantity, 0)}
                </span>
              </div>
            </div>
          </div>

          {/* Raw Content Preview */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-lg font-semibold mb-4">Raw Formatted Content</h2>
            <pre className="text-xs bg-gray-100 p-4 rounded overflow-x-auto whitespace-pre-wrap font-mono">
              {formattedContent.split('\u001B').join('\\x1B')}
            </pre>
          </div>
        </div>

        {/* Thermal Printer Preview */}
        <div className="space-y-6">
          <ThermalPrinterSimulator
            content={formattedContent}
            title="Kitchen Station Receipt"
            showPaperEdges={true}
            className="sticky top-6"
          />
          
          {/* Additional Info */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-800 mb-2">ESC/POS Commands Used:</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• <code>\x1B\x45</code> - Bold text ON</li>
              <li>• <code>\x1B\x46</code> - Bold text OFF</li>
              <li>• <code>\x1B\x69</code> - Paper cut command</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThermalPrinterDemo;
