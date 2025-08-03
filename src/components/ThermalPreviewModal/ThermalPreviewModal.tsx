import React from 'react';
import { X } from 'lucide-react';
import ThermalPrinterSimulator from '../ThermalPrinterSimulator/ThermalPrinterSimulator';

export interface ThermalPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  content: string;
  title?: string;
  printerName?: string;
}

/**
 * ThermalPreviewModal - Modal component for previewing thermal printer output
 * 
 * Use this component to show a preview of how the thermal receipt will look
 * before actually printing. Perfect for integration into existing POS screens.
 */
const ThermalPreviewModal: React.FC<ThermalPreviewModalProps> = ({
  isOpen,
  onClose,
  content,
  title = 'Print Preview',
  printerName
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
            {printerName && (
              <p className="text-sm text-gray-600 mt-1">
                Printer: {printerName}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="flex justify-center">
            <ThermalPrinterSimulator
              content={content}
              title=""
              showPaperEdges={true}
            />
          </div>
        </div>
        
        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
          <button
            onClick={() => {
              // Here you would trigger the actual print
              console.log('Printing content:', content);
              onClose();
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Print Now
          </button>
        </div>
      </div>
    </div>
  );
};

export default ThermalPreviewModal;
