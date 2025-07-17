import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Material } from "@/types/inventory";
import { formatCurrency, formatNumber } from "@/utils/conversionLogic";
import { getCategoryLabel } from "@/utils/getCategoryLabel";
import { Edit, Plus, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

interface MaterialsTableProps {
  filteredMaterials: Material[];
  materialsWithSectionAssignments: Material[];
  setSelectedItem: (item: { type: string; data: any }) => void;
  setIsDetailModalOpen: (open: boolean) => void;
  setSelectedMaterialId: (id: string) => void;
  setShowStockForm: (show: boolean) => void;
  setEditingMaterial: (material: Material | undefined) => void;
  setShowMaterialForm: (show: boolean) => void;
  handleDeleteMaterial: (materialId: string) => void;
}

export function MaterialsTable({ filteredMaterials, materialsWithSectionAssignments, setSelectedItem, setIsDetailModalOpen, setSelectedMaterialId, setShowStockForm, setEditingMaterial, setShowMaterialForm, handleDeleteMaterial }: MaterialsTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Materials Inventory</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Material</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Stock Quantity</TableHead>
                <TableHead>Avg. Cost/Unit</TableHead>
                <TableHead>Total Value</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMaterials.map(material => {
                const materialWithAssignments = materialsWithSectionAssignments.find(m => m.id === material.id);
                const sectionAssignments = materialWithAssignments?.sectionAssignments || [];
                return (
                  <TableRow
                    key={material.id}
                    onClick={() => {
                      setSelectedItem({
                        type: "material",
                        data: material
                      });
                      setIsDetailModalOpen(true);
                    }}
                    className="cursor-pointer hover:bg-muted/50"
                  >
                    <TableCell>
                      <div>
                        <div className="font-medium">{material.name}</div>
                        <div className="text-sm text-muted-foreground">{material.description}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{getCategoryLabel(material.category)}</Badge>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div>
                          Total: {formatNumber(material.totalQuantityInBaseUnit)} {material.baseUnit}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Available: {formatNumber(materialWithAssignments?.availableQuantity || material.totalQuantityInBaseUnit)} {material.baseUnit}
                        </div>
                        {sectionAssignments.length > 0 && <div className="text-sm text-muted-foreground mt-1">Assigned to: {sectionAssignments.map(a => `${a.sectionName} (${formatNumber(a.assignedQuantity)} ${a.assignedUnit})`).join(", ")}</div>}
                      </div>
                    </TableCell>
                    <TableCell>
                      {formatCurrency(material.averageCostPerBaseUnit)}/{material.baseUnit}
                    </TableCell>
                    <TableCell>{formatCurrency(material.totalValue)}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={e => {
                            e.stopPropagation();
                            setSelectedMaterialId(material.id);
                            setShowStockForm(true);
                          }}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={e => {
                            e.stopPropagation();
                            setEditingMaterial(material);
                            setShowMaterialForm(true);
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
                              <AlertDialogTitle>Delete Material</AlertDialogTitle>
                              <AlertDialogDescription>This will permanently delete "{material.name}" and all associated stock entries.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteMaterial(material.id)}>Delete</AlertDialogAction>
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
