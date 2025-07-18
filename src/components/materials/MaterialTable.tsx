import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MATERIAL_CATEGORIES, MaterialWithStock } from "@/types/inventory";
import { formatCurrency } from "@/utils/conversionLogic";
import { Edit, Plus, Trash2 } from "lucide-react";

interface MaterialTableProps {
  filteredMaterials: MaterialWithStock[];
  onEditMaterial: (material: MaterialWithStock) => void;
  onAddStock: (materialId: string) => void;
  onDeleteMaterial: (materialId: string) => void;
}

export function MaterialTable({ filteredMaterials, onEditMaterial, onAddStock, onDeleteMaterial }: MaterialTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Material Entries</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Average Cost/Unit</TableHead>
              <TableHead>Total Cost</TableHead>
              <TableHead>Stock Entries</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredMaterials.map(material => (
              <TableRow key={material.id}>
                <TableCell className="font-medium">{material.name}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{MATERIAL_CATEGORIES.find(c => c.value === material.category)?.label}</Badge>
                </TableCell>
                <TableCell>
                  {(() => {
                    const cost = material.averageCostPerBaseUnit;
                    const formattedCost = cost < 0.01 && cost > 0 ? `$${cost.toFixed(6).replace(/\.?0+$/, "")}` : formatCurrency(cost);
                    return `${formattedCost}/${material.baseUnit}`;
                  })()}
                  {material.unitType === "package" && <span className="text-xs text-muted-foreground ml-1">(per {material.baseUnit})</span>}
                </TableCell>
                <TableCell>{formatCurrency(material.totalValue)}</TableCell>
                <TableCell>{material.stockEntries.length}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => onEditMaterial(material)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => onAddStock(material.id)}>
                      <Plus className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Material</AlertDialogTitle>
                          <AlertDialogDescription>Are you sure you want to delete "{material.name}"? This action cannot be undone.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => onDeleteMaterial(material.id)}>Delete</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
