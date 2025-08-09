import React from 'react';
import ThermalPrinterDemo from '@/components/ThermalPrinterDemo/ThermalPrinterDemo';

/**
 * ThermalPrinterTestPage - Dedicated page for testing thermal printer formatting
 * 
 * Add this to your routing to easily access the thermal printer simulator:
 * - Navigate to /thermal-printer-test
 * - Test different order scenarios
 * - Preview receipts before printing
 */
const ThermalPrinterTestPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <ThermalPrinterDemo />
    </div>
  );
};

export default ThermalPrinterTestPage;
