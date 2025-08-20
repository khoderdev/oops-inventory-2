import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { TanStackTable } from "@/components/ui/TanStackTable";
import { toast } from "@/hooks/use-toast";
import { NegativeStockReport } from "@/types/inventory";
import { formatNumber } from "@/utils/conversionLogic";
import { AlertTriangle, FileText, RefreshCw } from "lucide-react";
import { useState, useMemo } from "react";
import { createColumnHelper, getCoreRowModel, getSortedRowModel, useReactTable, SortingState } from "@tanstack/react-table";
import { salesAPI } from "@/api/sales.api.ts";

type NegativeStockProps = {
  negativeStockCount: number;
  className?: string;
};

export function NegativeStock({ negativeStockCount, className = "" }: NegativeStockProps) {
  const [negativeStockReport, setNegativeStockReport] = useState<NegativeStockReport | null>(null);
  const [loadingReport, setLoadingReport] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [reportSorting, setReportSorting] = useState<SortingState>([]);

  const negativeStockColumns = useMemo(
    () => [
      {
        id: "material",
        header: "Material",
        accessorKey: "materialName",
        cell: ({ row }: any) => {
          const item = row.original;
          return (
            <div className="flex items-center gap-2">
              {item.isVirtualEntry && <AlertTriangle className="h-4 w-4 text-red-600" />}
              {item.materialName}
              {item.isVirtualEntry && (
                <Badge variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200">
                  VIRTUAL
                </Badge>
              )}
            </div>
          );
        }
      },
      {
        id: "supplier",
        header: "Supplier",
        accessorKey: "supplier",
        cell: ({ row }: any) => {
          const item = row.original;
          return <span className={item.isVirtualEntry ? "text-red-600 font-medium" : ""}>{item.supplier}</span>;
        }
      },
      {
        id: "individualQuantity",
        header: "Individual Quantity",
        accessorKey: "purchasedIndividualQuantity",
        cell: ({ getValue }: any) => (
          <div className="text-red-600 font-medium flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            {formatNumber(getValue())}
          </div>
        )
      },
      {
        id: "unit",
        header: "Unit",
        accessorKey: "purchasedIndividualUnit"
      },
      {
        id: "purchasedQuantity",
        header: "Purchased Quantity",
        accessorKey: "purchasedQuantity",
        cell: ({ getValue }: any) => <span className="text-red-600 font-medium">{formatNumber(getValue())}</span>
      },
      {
        id: "purchasedUnit",
        header: "Purchased Unit",
        accessorKey: "purchasedUnit"
      },
      {
        id: "categoryId",
        header: "Category ID",
        accessorKey: "categoryId",
        cell: ({ getValue }: any) => (
          <Badge variant="outline" className="text-xs">
            {getValue() || "N/A"}
          </Badge>
        )
      },
      {
        id: "lastUpdated",
        header: "Last Updated",
        accessorKey: "lastUpdated",
        cell: ({ getValue }: any) => {
          const date = getValue();
          return date ? new Date(date).toLocaleDateString() : "N/A";
        }
      }
    ],
    []
  );

  // Negative stock report table
  const negativeStockTable = useReactTable({
    data: negativeStockReport?.negativeStockItems || [],
    columns: negativeStockColumns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: {
      sorting: reportSorting
    },
    onSortingChange: setReportSorting
  });

  const fetchNegativeStockReport = async () => {
    setLoadingReport(true);
    try {
      const response = await salesAPI.getNegativeStockReport();
      setNegativeStockReport(response.data);
      setShowReportDialog(true);
    } catch (error) {
      console.error("Error fetching negative stock report:", error);
      toast({
        title: "Error",
        description: "Failed to fetch negative stock report",
        variant: "destructive"
      });
    } finally {
      setLoadingReport(false);
    }
  };

  if (negativeStockCount <= 0) {
    return null;
  }

  return (
    <>
      <Button 
        variant="outline" 
        size="sm" 
        onClick={fetchNegativeStockReport} 
        disabled={loadingReport} 
        className={`border-red-200 text-red-700 hover:bg-red-50 hover:border-red-300 ${className}`}
      >
        {loadingReport ? <RefreshCw className="h-4 w-4 mr-1.5 animate-spin" /> : <FileText className="h-4 w-4 mr-1.5" />}
        <span className="hidden lg:inline">Negative Stock Report</span>
        <span className="lg:hidden">Report</span>
      </Button>

      <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
        <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Negative Stock Report
            </DialogTitle>
            <DialogDescription>Items with negative stock quantities that need attention</DialogDescription>
          </DialogHeader>

          {negativeStockReport && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="text-2xl font-bold text-red-600">{negativeStockReport.totalNegativeEntries || 0}</div>
                  <div className="text-sm text-red-700">Items with Negative Stock</div>
                </div>
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <div className="text-2xl font-bold text-orange-600">{negativeStockReport.summary?.totalVirtualEntries || 0}</div>
                  <div className="text-sm text-orange-700">Virtual Entries</div>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="text-2xl font-bold text-blue-600">{negativeStockReport.generatedAt ? new Date(negativeStockReport.generatedAt).toLocaleDateString() : new Date().toLocaleDateString()}</div>
                  <div className="text-sm text-blue-700">Report Date</div>
                </div>
              </div>

              {negativeStockReport.negativeStockItems && negativeStockReport.negativeStockItems.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Negative Stock Items</h3>
                  <TanStackTable 
                    table={negativeStockTable} 
                    virtualized={false} 
                    loading={false} 
                    emptyMessage="No negative stock items found" 
                    maxHeight="400px" 
                    showSortIcons={true} 
                    className="" 
                  />
                </div>
              )}

              {negativeStockReport.message && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-blue-900 mb-2">Report Summary</h3>
                  <p className="text-blue-800">{negativeStockReport.message}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
