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
    <Card className="!border-none h-full flex flex-col">
      <CardHeader className="space-y-6">
        {/* Title Section */}
        <div className="flex flex-col space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex flex-col space-y-2">
              <CardTitle className="text-2xl sm:text-3xl font-bold text-gray-900">Materials</CardTitle>
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                <span>Total: {filteredMaterials.length} materials</span>
                {searchTerm && (
                  <span className="text-blue-600">Filtered: {searchFilteredMaterials.length} results</span>
                )}
              </div>
            </div>
            
            {/* Primary Action */}
            <Button 
              onClick={() => setShowMaterialForm(true)} 
              className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm w-full sm:w-auto"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Material
            </Button>
          </div>

          {/* Search Bar */}
          <div className="relative w-full sm:max-w-sm md:max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input 
              placeholder="Search by material name..." 
              value={searchTerm} 
              onChange={e => setSearchTerm(e.target.value)} 
              className="pl-10 border-gray-200 focus:border-emerald-500 focus:ring-emerald-500 w-full" 
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-2 sm:p-4 lg:p-6 flex-1 overflow-hidden">
        {/* Mobile Card View */}
        <div className="block lg:hidden h-full overflow-y-auto space-y-4 pr-2">
          {searchFilteredMaterials.map(material => {
            const categoryInfo = MATERIAL_CATEGORIES.find(c => c.value === material.category);
            const getCategoryColor = (category: string) => {
              switch (category) {
                case 'meat': return 'bg-red-100 text-red-800 border-red-200';
                case 'dairy': return 'bg-blue-100 text-blue-800 border-blue-200';
                case 'vegetables': return 'bg-green-100 text-green-800 border-green-200';
                case 'grains': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
                case 'spices': return 'bg-orange-100 text-orange-800 border-orange-200';
                case 'beverages': return 'bg-purple-100 text-purple-800 border-purple-200';
                case 'alcohol': return 'bg-pink-100 text-pink-800 border-pink-200';
                default: return 'bg-gray-100 text-gray-800 border-gray-200';
              }
            };
            
            return (
              <Card key={material.id} className="overflow-hidden border border-gray-200 hover:shadow-md transition-shadow duration-200">
                {/* Header Section */}
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-4 py-3 border-b border-gray-200">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg text-gray-900 truncate">
                        {highlightText(material.name, searchTerm)}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge 
                          variant="outline" 
                          className={`text-xs font-medium ${getCategoryColor(material.category)}`}
                        >
                          {categoryInfo?.label || material.category}
                        </Badge>
                        {material.isPOSItem && (
                          <Badge variant="outline" className="text-xs bg-emerald-100 text-emerald-800 border-emerald-200">
                            POS Item
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Content Section */}
                <div className="px-4 py-3">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-gray-500 font-medium">Base Unit:</span>
                      <p className="text-gray-900 font-semibold">{material.baseUnit}</p>
                    </div>
                    <div>
                      <span className="text-gray-500 font-medium">Unit Type:</span>
                      <p className="text-gray-900 font-semibold capitalize">{material.unitType}</p>
                    </div>
                    {material.inputUnit && material.inputUnit !== material.baseUnit && (
                      <div className="col-span-2">
                        <span className="text-gray-500 font-medium">Input Unit:</span>
                        <p className="text-gray-900 font-semibold">{material.inputUnit}</p>
                      </div>
                    )}
                    {material.description && (
                      <div className="col-span-2">
                        <span className="text-gray-500 font-medium">Description:</span>
                        <p className="text-gray-700 text-sm mt-1">{material.description}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions Section */}
                <div className="bg-gray-50 px-4 py-3 border-t border-gray-200">
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => onEditMaterial(material)} 
                      className="flex-1 h-9 border-gray-300 hover:border-gray-400 hover:bg-white"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => onAddStock(material.id)} 
                      className="flex-1 h-9 border-emerald-300 text-emerald-700 hover:border-emerald-400 hover:bg-emerald-50"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Stock
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-9 px-3 border-red-300 text-red-700 hover:border-red-400 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Material</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{material.name}"? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => onDeleteMaterial(material.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
        
        {/* Desktop Table View */}
        <div className="hidden lg:block">
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
        </div>
      </CardContent>
    </Card>
  );
}
