import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useInventoryData } from "@/hooks/useInventoryData";
import { useInventoryStore } from "@/hooks/useInventoryStore";
import { formatCurrency, formatNumber } from "@/utils/conversionLogic";
import { AlertCircle, Edit, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StockEntry } from "@/types/inventory";
import { useState } from "react";

export function StockEntriesTable() {
  const { stockEntries, materials, loading, error } = useInventoryData();
  const { handleEditStockEntry, handleDeleteStockEntry, setShowStockForm } = useInventoryStore();
  const [searchTerm] = useState("");
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

  const renderQuantityDisplay = (entry: (typeof stockEntriesWithMaterial)[0]) => {
    const { material } = entry;
    return (
      <div className="space-y-1">
        {(() => {
          // For mass units, show individual quantity as main (remaining after deductions)
          if (material?.unitType === "mass" && entry.purchasedIndividualQuantity && entry.purchasedIndividualUnit) {
            return (
              <>
                <div className="font-medium">
                  {formatNumber(entry.purchasedIndividualQuantity)} {entry.purchasedIndividualUnit}
                </div>
                <div className="text-sm text-muted-foreground">
                  (from {formatNumber(entry.purchasedQuantity)} {entry.purchasedUnit})
                </div>
              </>
            );
          }
          // For package units, show individual quantity as main (remaining after deductions)
          else if (material?.unitType === "package" && entry.purchasedIndividualQuantity && entry.purchasedIndividualUnit) {
            return (
              <>
                <div className="font-medium">
                  {formatNumber(entry.purchasedIndividualQuantity)} {entry.purchasedIndividualUnit}
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
              <div className="font-medium">
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

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Stock Entries</CardTitle>
          <Button size="sm" onClick={() => setShowStockForm(true)} className="w-fit">
            <Plus className="h-4 w-4 mr-2" />
            Add Stock
          </Button>
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
                .sort((a, b) => new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime())
                .map(entry => (
                  <TableRow key={entry.id}>
                    <TableCell className="font-medium min-w-[200px]">{entry.material?.name || `Unknown Material (ID: ${entry.materialId})`}</TableCell>
                    <TableCell className="min-w-[150px]">{entry.supplier}</TableCell>
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
                              <AlertDialogDescription>Are you sure you want to delete this stock entry? This action cannot be undone.</AlertDialogDescription>
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
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
      </CardContent>
    </Card>
  );
}
