import { CardTitle } from "../ui/card";
import { formatCurrency } from "@/utils/conversionLogic";

export function SalesHistoryStats({ localFilteredSales, filteredTotal, localTotalQuantity }: { localFilteredSales: any; filteredTotal: any; localTotalQuantity: any }) {
  return (
    <div className="flex flex-row gap-4 mb-6 border border-green-300 items-center justify-between px-2 rounded-lg bg-green-500/15">
      <div className="flex flex-col items-center justify-between gap-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">Total Sales:</CardTitle>
          <p className="ml-1 font-semibold text-green-700">
            {localFilteredSales.length} Sale
            <span className="ml-1 font-semibold text-green-700">{formatCurrency(filteredTotal)}</span>
          </p>
        </div>
      </div>

      <div className="flex flex-col items-center justify-between gap-4 px-4 py-2">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center">
            <CardTitle className="text-sm font-medium">Items Sold:</CardTitle>
          </div>
          <p className="ml-1 font-semibold text-green-700">{localTotalQuantity}</p>
        </div>
      </div>

      <div className="flex flex-col items-center justify-between gap-4 px-4 py-2">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center">
            <CardTitle className="text-sm font-medium">Average Price:</CardTitle>
          </div>
          <p className="ml-1 font-semibold text-green-700">{localTotalQuantity > 0 ? formatCurrency(filteredTotal / localTotalQuantity) : formatCurrency(0)}</p>
        </div>
      </div>
    </div>
  );
}
