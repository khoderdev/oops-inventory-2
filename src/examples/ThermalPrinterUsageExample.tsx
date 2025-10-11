import React, { useState } from 'react';
import { Printer, Eye } from 'lucide-react';
import ThermalPreviewModal from '@/components/ThermalPreviewModal/ThermalPreviewModal';
import { formatItemsForPrinter } from '@/utils/thermalPrinterFormatter';
import { POSCartItem, Table } from '@/types/inventory';
import { Employee } from '@/types/employee';
import { OrderType } from '@/types/orders';

/**
 * ThermalPrinterUsageExample - Example of how to integrate thermal printer preview
 * into your existing POS screens
 * 
 * This shows how to:
 * 1. Add a "Preview Print" button to your UI
 * 2. Generate formatted content using your existing formatter
 * 3. Show the preview modal before printing
 * 4. Handle the actual print action
 */
const ThermalPrinterUsageExample: React.FC = () => {
  const [showPreview, setShowPreview] = useState(false);
  
  // Example data - replace with your actual cart/order data
  const cartItems: POSCartItem[] = [
    {
      id: '1',
      name: 'Grilled Chicken Breast',
      quantity: 2,
      price: 15.99,
      assignedPrinter: { id: '1', name: 'Kitchen Printer' },
      printerId: '1'
    },
    {
      id: '2',
      name: 'Caesar Salad',
      quantity: 1,
      price: 8.50,
      assignedPrinter: { id: '1', name: 'Kitchen Printer' },
      printerId: '1'
    }
  ];

  const selectedTable: Table = {
    id: '1',
    number: '12',
    capacity: 4,
    status: 'occupied',
    section: 'main'
  };

  const selectedEmployee: Employee = {
    id: '1',
    user: {
      id: '1',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@restaurant.com'
    },
    role: 'waiter',
    isActive: true
  };

  const orderType: OrderType = 'dine-in';

  // Preview order number
  const previewOrderNumber = `PREV-${Date.now().toString().slice(-6)}`;

  // Example: Format items for printer
  const handlePrintOrder = () => {
    const formattedReceipt = formatItemsForPrinter({
      items: cartItems,
      currentOrder: null,
      orderType,
      selectedTable,
      selectedEmployee,
      previewOrderNumber
    });
  };

  const handlePrintWithPreview = () => {
    setShowPreview(true);
  };

  const handleDirectPrint = () => {
    const content = getFormattedContent();
    // Here you would send to your actual printer
    console.log('Printing directly:', content);
    // Your existing print logic here
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
        
        {/* Order Items */}
        <div className="space-y-2 mb-6">
          {cartItems.map((item) => (
            <div key={item.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
              <div>
                <span className="font-medium">{item.name}</span>
                <span className="text-sm text-gray-600 ml-2">x{item.quantity}</span>
              </div>
              <span className="font-medium">${(item.price * item.quantity).toFixed(2)}</span>
            </div>
          ))}
        </div>

        {/* Order Details */}
        <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 rounded">
          <div>
            <span className="text-sm text-gray-600">Table:</span>
            <span className="ml-2 font-medium">{selectedTable.number}</span>
          </div>
          <div>
            <span className="text-sm text-gray-600">Order Type:</span>
            <span className="ml-2 font-medium capitalize">{orderType}</span>
          </div>
          <div>
            <span className="text-sm text-gray-600">Staff:</span>
            <span className="ml-2 font-medium">
              {selectedEmployee.user?.firstName} {selectedEmployee.user?.lastName}
            </span>
          </div>
          <div>
            <span className="text-sm text-gray-600">Printer:</span>
            <span className="ml-2 font-medium">{cartItems[0]?.assignedPrinter?.name}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3">
          <button
            onClick={handlePrintWithPreview}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <Eye className="w-4 h-4" />
            <span>Preview & Print</span>
          </button>
          
          <button
            onClick={handleDirectPrint}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>Print Directly</span>
          </button>
        </div>
      </div>

      {/* Thermal Preview Modal */}
      <ThermalPreviewModal
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        content={getFormattedContent()}
        title="Kitchen Order Preview"
        printerName={cartItems[0]?.assignedPrinter?.name}
      />
    </div>
  );
};

export default ThermalPrinterUsageExample;
