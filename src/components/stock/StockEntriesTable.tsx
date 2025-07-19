import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MaterialWithStock, StockEntry, StockEntryWithMaterial } from "@/types/inventory";
import { formatCurrency, formatNumber } from "@/utils/conversionLogic";
import { getDisplayQuantity } from "@/utils/inventoryCalculations";
import { Edit, Trash2 } from "lucide-react";

interface StockEntriesTableProps {
  stockEntries: StockEntryWithMaterial[];
  materialsWithStock: MaterialWithStock[];
  searchTerm: string;
  onEditStockEntry: (entry: StockEntry) => void;
  onDeleteStockEntry?: (id: string) => void;
}

export function StockEntriesTable({ stockEntries, materialsWithStock, searchTerm, onEditStockEntry, onDeleteStockEntry }: StockEntriesTableProps) {
  const filteredStockEntries = stockEntries.filter(entry => {
    // Use the material property directly from the stock entry if available
    const materialName = entry.material?.name || materialsWithStock.find(m => m.id === entry.materialId)?.name;

    return !searchTerm || materialName?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Stock Entries</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Material</TableHead>
              <TableHead>Supplier</TableHead>
              <TableHead>Remaining Qty</TableHead>
              <TableHead>Unit</TableHead>
              <TableHead>Cost/Unit</TableHead>
              <TableHead>Total Cost</TableHead>
              <TableHead>Purchase Date</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredStockEntries.map(entry => {
              // Use the material property directly from the stock entry if available
              const material = entry.material || materialsWithStock.find(m => m.id === entry.materialId);

              return (
                <TableRow key={entry.id}>
                  <TableCell className="font-medium">{material?.name || `Unknown Material (ID: ${entry.materialId})`}</TableCell>
                  <TableCell>{entry.supplier}</TableCell>
                  <TableCell>
                    {(() => {
                      const displayQty = getDisplayQuantity(entry, material);
                      return formatNumber(displayQty.quantity);
                    })()}
                  </TableCell>
                  <TableCell>
                    {(() => {
                      const displayQty = getDisplayQuantity(entry, material);
                      return (
                        <div className="flex items-center gap-2">
                          <span>{displayQty.unit}</span>
                          {displayQty.isConverted && (
                            <Badge variant="outline" className="text-xs">
                              Package
                            </Badge>
                          )}
                        </div>
                      );
                    })()}
                  </TableCell>
                  <TableCell>
                    {formatCurrency(entry.costPerPurchasedUnit)}
                    {material?.unitType === "package" && <span className="text-xs text-muted-foreground ml-1">(per {entry.purchasedUnit})</span>}
                  </TableCell>
                  <TableCell>{formatCurrency(entry.totalCost)}</TableCell>
                  <TableCell>{entry.purchaseDate.toLocaleDateString()}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => onEditStockEntry(entry)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      {onDeleteStockEntry && (
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
                              <AlertDialogAction onClick={() => onDeleteStockEntry(entry.id)}>Delete</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
