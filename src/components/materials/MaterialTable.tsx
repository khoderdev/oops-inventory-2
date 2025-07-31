import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useInventoryStore } from "@/hooks/useInventoryStore";
import { MATERIAL_CATEGORIES, MaterialTableProps } from "@/types/inventory";
import { highlightText } from "@/utils/highlightText";
import { Edit, Plus, Search, Trash2 } from "lucide-react";
import { useState } from "react";

export function MaterialTable({ filteredMaterials, onEditMaterial, onAddStock, onDeleteMaterial }: MaterialTableProps) {
  const { setShowMaterialForm } = useInventoryStore();
  const [searchTerm, setSearchTerm] = useState("");
  
  // Filter and sort materials - latest added first
  const searchFilteredMaterials = filteredMaterials
    .filter(material => {
      return !searchTerm || material.name.toLowerCase().includes(searchTerm.toLowerCase());
    })
    .sort((a, b) => {
      // Sort by createdAt date in descending order (latest first)
      const dateA = new Date(a.createdAt || 0).getTime();
      const dateB = new Date(b.createdAt || 0).getTime();
      return dateB - dateA;
    });
  return (
    <Card className="!border-none">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-3xl font-bold">Materials</CardTitle>
          <Button size="sm" onClick={() => setShowMaterialForm(true)} className="w-fit">
            <Plus className="h-4 w-4 mr-2" />
            Add Material
          </Button>
        </div>

        {/* Search Input */}
        <div className="mt-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search by material name..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" />
          </div>
          {searchTerm && (
            <div className="mt-2 text-sm text-muted-foreground">
              Showing {searchFilteredMaterials.length} of {filteredMaterials.length} materials
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[calc(100vh-240px)] overflow-hidden border rounded-md">
          <Table>
            <TableHeader className="sticky top-0 bg-background z-10 border-b">
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
          </Table>
          <div className="h-[calc(100%-53px)] overflow-y-auto">
            <Table>
              <TableBody>
                {searchFilteredMaterials.map(material => (
                  <TableRow key={material.id}>
                    <TableCell className="font-medium">{highlightText(material.name, searchTerm)}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{MATERIAL_CATEGORIES.find(c => c.value === material.category)?.label}</Badge>
                    </TableCell>
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
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
