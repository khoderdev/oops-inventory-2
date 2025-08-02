import { salesAPI } from "@/api/sales.api.ts.tsx";
import { stockAPI } from "@/api/stock.api.ts.tsx";
import { PrinterAssignmentDialog } from "@/components/inventory/PrinterAssignmentDialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { useInventoryStore } from "@/hooks/useInventoryStore";
import { Material, NegativeStockReport, StockEntry, StockEntryWithMaterial } from "@/types/inventory";
import { formatCurrency, formatNumber } from "@/utils/conversionLogic";
import { highlightText } from "@/utils/highlightText";
import { AlertTriangle, Edit, Eye, FileText, Plus, Printer, RefreshCw, Search, Trash2 } from "lucide-react";
import { useState } from "react";

export function StockEntriesTable() {
  const { stockEntries, materialsWithStock, handleEditStockEntry, handleDeleteStockEntry, setShowStockForm, fetchTabData } = useInventoryStore();
  const materials = materialsWithStock;
  const [searchTerm, setSearchTerm] = useState("");
  const [negativeStockReport, setNegativeStockReport] = useState<NegativeStockReport | null>(null);
  const [loadingReport, setLoadingReport] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);
  const [showPrinterDialog, setShowPrinterDialog] = useState(false);
  const [selectedStockEntry, setSelectedStockEntry] = useState<StockEntryWithMaterial | null>(null);
  const materialsMap = new Map(materials.map(m => [m.id, m]));

  const stockEntriesWithMaterial = stockEntries
    .map(entry => ({
      ...entry,
      material: materialsMap.get(entry.materialId)
    }))
    .filter(entry => {
      const materialName = entry.material?.name;
      const supplier = entry.supplier;
      const searchLower = searchTerm.toLowerCase();
      return !searchTerm || materialName?.toLowerCase().includes(searchLower) || supplier?.toLowerCase().includes(searchLower);
    });

  const hasNegativeStock = (entry: (typeof stockEntriesWithMaterial)[0]) => {
    return (entry.purchasedIndividualQuantity && entry.purchasedIndividualQuantity < 0) || (entry.purchasedQuantity && entry.purchasedQuantity < 0);
  };

  const isVirtualEntry = (entry: (typeof stockEntriesWithMaterial)[0]) => {
    return entry.supplier === "VIRTUAL - Negative Stock";
  };

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

  const renderQuantityDisplay = (entry: (typeof stockEntriesWithMaterial)[0]) => {
    const { material } = entry;
    const isNegative = hasNegativeStock(entry);
    const isVirtual = isVirtualEntry(entry);

    return (
      <div className="space-y-1">
        {(() => {
          if (material?.unitType === "mass" && entry.purchasedIndividualQuantity !== undefined && entry.purchasedIndividualUnit) {
            return (
              <>
                <div className={`font-medium flex items-center gap-2 ${isNegative ? "text-red-600" : ""}`}>
                  {isNegative && <AlertTriangle className="h-4 w-4" />}
                  {formatNumber(entry.purchasedIndividualQuantity)} {entry.purchasedIndividualUnit}
                </div>
                <div className="text-sm text-muted-foreground">
                  (from {formatNumber(entry.purchasedQuantity)} {entry.purchasedUnit})
                </div>
              </>
            );
          } else if (material?.unitType === "package" && entry.purchasedIndividualQuantity !== undefined && entry.purchasedIndividualUnit) {
            return (
              <>
                <div className={`font-medium flex items-center gap-2 ${isNegative ? "text-red-600" : ""}`}>
                  {isNegative && <AlertTriangle className="h-4 w-4" />}
                  {formatNumber(entry.purchasedIndividualQuantity)} {entry.purchasedIndividualUnit}
                </div>
                {/* Only show "(from X pack)" if individual quantity is positive */}
                {entry.purchasedIndividualQuantity > 0 && material?.packageQuantity && (
                  <div className="text-sm text-muted-foreground">
                    (from {formatNumber(Math.ceil(entry.purchasedIndividualQuantity / material.packageQuantity))} {entry.purchasedUnit})
                  </div>
                )}
              </>
            );
          } else {
            return (
              <div className={`font-medium flex items-center gap-2 ${isNegative ? "text-red-600" : ""}`}>
                {isNegative && <AlertTriangle className="h-4 w-4" />}
                {formatNumber(entry.purchasedQuantity)} {entry.purchasedUnit}
              </div>
            );
          }
        })()}
      </div>
    );
  };

  const renderUnitDisplay = (entry: (typeof stockEntriesWithMaterial)[0]) => {
    const { material } = entry;

    return (
      <div className="flex items-center gap-2">
        <div className="space-y-1">
          <div>{entry.purchasedUnit}</div>
          {(() => {
            // For package units, show individual unit (e.g., piece)
            if (material?.unitType === "package" && entry.purchasedIndividualUnit) {
              return <div className="text-sm text-muted-foreground">{entry.purchasedIndividualUnit}</div>;
            }
            // For mass units, show converted unit (e.g., g)
            else if (entry.purchasedConvertedUnit && entry.purchasedConvertedUnit !== entry.purchasedUnit) {
              return <div className="text-sm text-muted-foreground">{entry.purchasedConvertedUnit}</div>;
            }
            return null;
          })()}
        </div>
        {material?.unitType === "package" && (
          <Badge variant="outline" className="text-xs">
            Package
          </Badge>
        )}
      </div>
    );
  };

  const negativeStockCount = stockEntriesWithMaterial.filter(hasNegativeStock).length;
  const virtualEntryCount = stockEntriesWithMaterial.filter(isVirtualEntry).length;

  const handleRowClick = (entryId: string) => {
    setSelectedRowId(selectedRowId === entryId ? null : entryId);
  };

  const handleTogglePOSVisibility = async (entry: StockEntry & { material?: Material }) => {
    if (!entry.material) {
      toast({
        title: "Error",
        description: "Material information not found",
        variant: "destructive"
      });
      return;
    }

    try {
      const newPOSStatus = !entry.isPOSItem;

      // Update the stock entry's POS visibility
      const response = await stockAPI.updateStockEntryPOS(entry.id.toString(), {
        isPOSItem: newPOSStatus
      });

      if (!response) {
        throw new Error("Failed to update stock entry POS visibility");
      }

      toast({
        title: "Success",
        description: `${entry.material.name} stock entry is now ${newPOSStatus ? "available in" : "hidden from"} POS`,
        variant: "default"
      });

      // Refresh the data to show updated state
      await fetchTabData("stock");
    } catch (error) {
      console.error("Error updating stock entry POS visibility:", error);
      toast({
        title: "Error",
        description: "Failed to update POS visibility",
        variant: "destructive"
      });
    }
  };

  const handleOpenPrinterDialog = (entry: StockEntryWithMaterial) => {
    setSelectedStockEntry(entry);
    setShowPrinterDialog(true);
  };

  const handlePrinterAssignmentChange = async () => {
    // Refresh the data to show updated printer assignments
    await fetchTabData("stock");
  };

  return (
    <Card className="w-full !border-none">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <CardTitle className="text-3xl font-bold">Stock Entries</CardTitle>
            {negativeStockCount > 0 && (
              <div className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-sm font-medium">
                  {negativeStockCount} negative stock entries
                  {virtualEntryCount > 0 && ` (${virtualEntryCount} virtual)`}
                </span>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            {negativeStockCount > 0 && (
              <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" onClick={fetchNegativeStockReport} disabled={loadingReport}>
                    {loadingReport ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <FileText className="h-4 w-4 mr-2" />}
                    Negative Stock Report
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-red-600" />
                      Negative Stock Report
                    </DialogTitle>
                    <DialogDescription>Items requiring immediate attention for stock reconciliation</DialogDescription>
                  </DialogHeader>

                  {negativeStockReport && (
                    <div className="space-y-6">
                      {/* Summary */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                          <div className="text-2xl font-bold text-red-600">{negativeStockReport.totalNegativeEntries}</div>
                          <div className="text-sm text-red-800">Total Negative Entries</div>
                        </div>
                        <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                          <div className="text-2xl font-bold text-orange-600">{negativeStockReport.summary.totalVirtualEntries}</div>
                          <div className="text-sm text-orange-800">Virtual Entries</div>
                        </div>
                        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="text-2xl font-bold text-blue-600">{Object.keys(negativeStockReport.summary.categorySummary).length}</div>
                          <div className="text-sm text-blue-800">Affected Categories</div>
                        </div>
                      </div>

                      {/* Category Summary */}
                      {Object.keys(negativeStockReport.summary.categorySummary).length > 0 && (
                        <div>
                          <h3 className="font-semibold mb-3">By Category</h3>
                          <div className="flex flex-wrap gap-2">
                            {Object.entries(negativeStockReport.summary.categorySummary).map(([category, count]) => (
                              <Badge key={category} variant="outline" className="px-3 py-1">
                                {category}: {count}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Detailed Items */}
                      <div>
                        <h3 className="font-semibold mb-3">Detailed Items</h3>
                        <div className="border rounded-lg overflow-hidden">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Material</TableHead>
                                <TableHead>Category</TableHead>
                                <TableHead>Supplier</TableHead>
                                <TableHead>Quantity</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Last Updated</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {negativeStockReport.negativeStockItems.map(item => (
                                <TableRow key={item.stockEntryId} className="border-l-4 border-l-red-500">
                                  <TableCell className="font-medium">{item.materialName}</TableCell>
                                  <TableCell>
                                    <Badge variant="outline">{item.category}</Badge>
                                  </TableCell>
                                  <TableCell className={item.isVirtualEntry ? "text-red-600 font-medium" : ""}>{item.supplier}</TableCell>
                                  <TableCell className="text-red-600 font-medium">
                                    {formatNumber(item.purchasedIndividualQuantity)} {item.purchasedIndividualUnit}
                                  </TableCell>
                                  <TableCell>{item.isVirtualEntry ? <Badge variant="destructive">Virtual</Badge> : <Badge variant="secondary">Stock Entry</Badge>}</TableCell>
                                  <TableCell>{new Date(item.lastUpdated).toLocaleString()}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </div>

                      {/* Generated timestamp */}
                      <div className="text-sm text-muted-foreground text-center">Generated: {new Date(negativeStockReport.generatedAt).toLocaleString()}</div>
                    </div>
                  )}
                </DialogContent>
              </Dialog>
            )}
            <Button size="sm" onClick={() => setShowStockForm(true)} className="w-fit">
              <Plus className="h-4 w-4 mr-2" />
              Add Stock
            </Button>
          </div>
        </div>

        {/* Search Input */}
        <div className="mt-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search by material name or supplier..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" />
          </div>
          {searchTerm && (
            <div className="mt-2 text-sm text-muted-foreground">
              Showing {stockEntriesWithMaterial.length} of {stockEntries.length} entries
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="w-full h-[calc(100vh-240px)] border rounded-md overflow-x-auto">
          <div className="min-w-full h-full flex flex-col">
            {/* Fixed Header */}
            <div className="flex-shrink-0 bg-background border-b">
              <Table className="min-w-full">
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[200px] bg-background">Material</TableHead>
                    <TableHead className="min-w-[150px] bg-background">Supplier</TableHead>
                    <TableHead className="min-w-[150px] bg-background">Remaining Qty</TableHead>
                    <TableHead className="min-w-[120px] bg-background">Unit</TableHead>
                    <TableHead className="min-w-[120px] bg-background">Cost/Unit</TableHead>
                    <TableHead className="min-w-[120px] bg-background">Total Cost</TableHead>
                    <TableHead className="min-w-[140px] bg-background">Purchase Date</TableHead>
                    <TableHead className="min-w-[220px] bg-background">Actions</TableHead>
                  </TableRow>
                </TableHeader>
              </Table>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto">
              <Table className="min-w-full">
                <TableBody>
                  {stockEntriesWithMaterial
                    .sort((a, b) => {
                      // Sort negative stock entries to the top, then by purchase date
                      const aNegative = hasNegativeStock(a);
                      const bNegative = hasNegativeStock(b);
                      if (aNegative && !bNegative) return -1;
                      if (!aNegative && bNegative) return 1;
                      return new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime();
                    })
                    .map(entry => {
                      const isNegative = hasNegativeStock(entry);
                      const isVirtual = isVirtualEntry(entry);
                      const isSelected = selectedRowId === entry.id;

                      return (
                        <TableRow key={entry.id} onClick={() => handleRowClick(entry.id)} className={`transition-colors ${isSelected ? "bg-blue-100 border-l-4 border-l-blue-500 hover:bg-blue-150" : isNegative ? "bg-red-50 border-l-4 border-l-red-500 hover:bg-red-100" : "hover:bg-gray-50"} ${isVirtual && !isSelected ? "border-l-red-600" : ""}`}>
                          <TableCell className="font-medium min-w-[200px]">
                            <div className="flex items-center gap-2">
                              {isNegative && <AlertTriangle className="h-4 w-4 text-red-600" />}
                              {entry.material?.name ? highlightText(entry.material.name, searchTerm) : `Unknown Material (ID: ${entry.materialId})`}
                            </div>
                          </TableCell>
                          <TableCell className="min-w-[150px]">
                            <div className="flex items-center gap-2">
                              <span className={isVirtual ? "text-red-600 font-medium" : ""}>{isVirtual ? "" : highlightText(entry.supplier || "", searchTerm)}</span>
                            </div>
                          </TableCell>
                          <TableCell className="min-w-[150px]">{renderQuantityDisplay(entry)}</TableCell>
                          <TableCell className="min-w-[120px]">{renderUnitDisplay(entry)}</TableCell>
                          <TableCell className="min-w-[120px]">
                            {formatCurrency(entry.costPerPurchasedUnit)}
                            {entry.material?.unitType === "package" && <span className="text-xs text-muted-foreground ml-1">(per {entry.purchasedUnit})</span>}
                          </TableCell>
                          <TableCell className="min-w-[120px]">{formatCurrency(entry.totalCost)}</TableCell>
                          <TableCell className="min-w-[140px]">{entry.purchaseDate.toLocaleDateString()}</TableCell>
                          <TableCell className="min-w-[220px]">
                            <div className="flex gap-2">
                              <Button
                                variant={entry.isPOSItem ? "default" : "outline"}
                                size="sm"
                                onClick={e => {
                                  e.stopPropagation();
                                  handleTogglePOSVisibility(entry);
                                }}
                                title={entry.isPOSItem ? "Hide from POS" : "Show in POS"}
                                className={entry.isPOSItem ? "bg-teal-600 hover:bg-teal-700 text-white" : ""}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={e => {
                                  e.stopPropagation();
                                  handleOpenPrinterDialog(entry);
                                }}
                                title={entry.assignedPrinter ? `Assigned to: ${entry.assignedPrinter.name}` : "Assign printer"}
                                className={entry.assignedPrinter ? "border-blue-500 text-blue-600" : ""}
                              >
                                <Printer className="h-4 w-4" />
                              </Button>
                              <Button variant="outline" size="sm" onClick={() => handleEditStockEntry(entry as StockEntry)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="outline" size="sm">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Stock Entry</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete this stock entry? This action cannot be undone.
                                      {isNegative && (
                                        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-red-800">
                                          <strong>Warning:</strong> This entry has negative stock quantities.
                                        </div>
                                      )}
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDeleteStockEntry(entry.id)}>Delete</AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </CardContent>

      {/* Printer Assignment Dialog */}
      <PrinterAssignmentDialog open={showPrinterDialog} onOpenChange={setShowPrinterDialog} item={selectedStockEntry} itemType="stock" onAssignmentChange={handlePrinterAssignmentChange} />
    </Card>
  );
}
