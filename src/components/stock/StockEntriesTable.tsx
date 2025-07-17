import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Material, StockEntry } from "@/types/inventory";
import { formatCurrency, formatNumber } from "@/utils/conversionLogic";
import { Edit, Trash2 } from "lucide-react";

interface StockEntriesTableProps {
  stockEntries: StockEntry[];
  materials: Material[];
  setSelectedItem: (item: { type: string; data: any }) => void;
  setIsDetailModalOpen: (open: boolean) => void;
  setEditingStock: (stock: StockEntry | undefined) => void;
  setShowStockForm: (show: boolean) => void;
  handleDeleteStock: (stockId: string) => void;
}

export function StockEntriesTable({ stockEntries, materials, setSelectedItem, setIsDetailModalOpen, setEditingStock, setShowStockForm, handleDeleteStock }: StockEntriesTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Stock Entries</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Material</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Unit Cost</TableHead>
                <TableHead>Total Cost</TableHead>
                <TableHead>Purchase Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stockEntries.map(entry => {
                const material = materials.find(m => m.id === entry.materialId);
                return (
                  <TableRow
                    key={entry.id}
                    onClick={() => {
                      setSelectedItem({
                        type: "stock",
                        data: entry
                      });
                      setIsDetailModalOpen(true);
                    }}
                    className="cursor-pointer hover:bg-muted/50"
                  >
                    <TableCell>
                      <div className="font-medium">{material?.name}</div>
                    </TableCell>
                    <TableCell>{entry.supplier}</TableCell>
                    <TableCell>
                      {formatNumber(entry.purchasedQuantity)} {entry.purchasedUnit}
                    </TableCell>
                    <TableCell>
                      {formatCurrency(entry.costPerPurchasedUnit)}/{entry.purchasedUnit}
                    </TableCell>
                    <TableCell>{formatCurrency(entry.totalCost)}</TableCell>
                    <TableCell>{entry.purchaseDate.toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={e => {
                            e.stopPropagation();
                            setEditingStock(entry);
                            setShowStockForm(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="outline">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Stock Entry</AlertDialogTitle>
                              <AlertDialogDescription>This will permanently delete this stock entry.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteStock(entry.id)}>Delete</AlertDialogAction>
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
      </CardContent>
    </Card>
  );
}
