import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useInventoryData } from "@/hooks/useInventoryData";
import { useInventoryStore } from "@/hooks/useInventoryStore";
import { formatCurrency, formatNumber } from "@/utils/conversionLogic";
import { Edit, Plus, Trash2, AlertTriangle, FileText, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StockEntry, NegativeStockReport } from "@/types/inventory";
import { useState } from "react";
import { salesAPI } from "@/api/sales.api.ts.tsx";
import { toast } from "@/hooks/use-toast";

export function StockEntriesTable() {
  const { stockEntries, materials } = useInventoryData();
  const { handleEditStockEntry, handleDeleteStockEntry, setShowStockForm } = useInventoryStore();
  const [searchTerm] = useState("");
  const [negativeStockReport, setNegativeStockReport] = useState<NegativeStockReport | null>(null);
  const [loadingReport, setLoadingReport] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const materialsMap = new Map(materials.map(m => [m.id, m]));

  const stockEntriesWithMaterial = stockEntries
    .map(entry => ({
      ...entry,
      material: materialsMap.get(entry.materialId)
    }))
    .filter(entry => {
      const materialName = entry.material?.name;
      return !searchTerm || materialName?.toLowerCase().includes(searchTerm.toLowerCase());
    });

  // Helper function to check if stock entry has negative quantity
  const hasNegativeStock = (entry: (typeof stockEntriesWithMaterial)[0]) => {
    return (entry.purchasedIndividualQuantity && entry.purchasedIndividualQuantity < 0) || (entry.purchasedQuantity && entry.purchasedQuantity < 0);
  };

  // Helper function to check if it's a virtual negative stock entry
  const isVirtualEntry = (entry: (typeof stockEntriesWithMaterial)[0]) => {
    return entry.supplier === "VIRTUAL - Negative Stock";
  };

  // Fetch negative stock report
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
          // For mass units, show individual quantity as main (remaining after deductions)
          if (material?.unitType === "mass" && entry.purchasedIndividualQuantity !== undefined && entry.purchasedIndividualUnit) {
            return (
              <>
                <div className={`font-medium flex items-center gap-2 ${isNegative ? "text-red-600" : ""}`}>
                  {isNegative && <AlertTriangle className="h-4 w-4" />}
                  {formatNumber(entry.purchasedIndividualQuantity)} {entry.purchasedIndividualUnit}
                  {isVirtual && (
                    <Badge variant="destructive" className="text-xs">
                      VIRTUAL
                    </Badge>
                  )}
                </div>
                <div className="text-sm text-muted-foreground">
                  (from {formatNumber(entry.purchasedQuantity)} {entry.purchasedUnit})
                </div>
              </>
            );
          }
          // For package units, show individual quantity as main (remaining after deductions)
          else if (material?.unitType === "package" && entry.purchasedIndividualQuantity !== undefined && entry.purchasedIndividualUnit) {
            return (
              <>
                <div className={`font-medium flex items-center gap-2 ${isNegative ? "text-red-600" : ""}`}>
                  {isNegative && <AlertTriangle className="h-4 w-4" />}
                  {formatNumber(entry.purchasedIndividualQuantity)} {entry.purchasedIndividualUnit}
                  {isVirtual && (
                    <Badge variant="destructive" className="text-xs">
                      VIRTUAL
                    </Badge>
                  )}
                </div>
                <div className="text-sm text-muted-foreground">
                  (from {formatNumber(entry.purchasedQuantity)} {entry.purchasedUnit})
                </div>
              </>
            );
          }
          // Fallback: show original quantity
          else {
            return (
              <div className={`font-medium flex items-center gap-2 ${isNegative ? "text-red-600" : ""}`}>
                {isNegative && <AlertTriangle className="h-4 w-4" />}
                {formatNumber(entry.purchasedQuantity)} {entry.purchasedUnit}
                {isVirtual && (
                  <Badge variant="destructive" className="text-xs">
                    VIRTUAL
                  </Badge>
                )}
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

  // Count negative stock entries for summary
  const negativeStockCount = stockEntriesWithMaterial.filter(hasNegativeStock).length;
  const virtualEntryCount = stockEntriesWithMaterial.filter(isVirtualEntry).length;

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <CardTitle>Stock Entries</CardTitle>
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
                    <TableHead className="min-w-[180px] bg-background">Actions</TableHead>
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

                      return (
                        <TableRow key={entry.id} className={`${isNegative ? "bg-red-50 border-l-4 border-l-red-500 hover:bg-red-100" : ""} ${isVirtual ? "border-l-red-600" : ""}`}>
                          <TableCell className="font-medium min-w-[200px]">
                            <div className="flex items-center gap-2">
                              {isNegative && <AlertTriangle className="h-4 w-4 text-red-600" />}
                              {entry.material?.name || `Unknown Material (ID: ${entry.materialId})`}
                            </div>
                          </TableCell>
                          <TableCell className="min-w-[150px]">
                            <div className="flex items-center gap-2">
                              <span className={isVirtual ? "text-red-600 font-medium" : ""}>{entry.supplier}</span>
                              {isVirtual && (
                                <Badge variant="destructive" className="text-xs">
                                  AUTO-GENERATED
                                </Badge>
                              )}
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
                          <TableCell className="min-w-[180px]">
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm" onClick={() => handleEditStockEntry(entry as StockEntry)} disabled={isVirtual}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="outline" size="sm" disabled={isVirtual}>
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
    </Card>
  );
}
