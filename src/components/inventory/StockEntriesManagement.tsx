import { StockEntriesTable } from "@/components/stock/StockEntriesTable";
import React from "react";

interface StockEntriesManagementProps {
  onDeleteStockEntry?: (id: string) => void;
}

export const StockEntriesManagement: React.FC<StockEntriesManagementProps> = ({
  onDeleteStockEntry
}) => {
  return (
    <div className="space-y-4">
      <StockEntriesTable />
    </div>
  );
};
