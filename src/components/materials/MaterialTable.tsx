import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
    <>
      <div className="h-full flex flex-col bg-white">
        {/* Header Section */}
        <div className="px-4 py-6 border-b border-gray-200">
          {/* Title Section */}
          <div className="flex flex-col space-y-0">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex flex-col space-y-2">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Materials</h1>
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

            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search Input */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input 
                  placeholder="Search by material name..." 
                  value={searchTerm} 
                  onChange={e => setSearchTerm(e.target.value)} 
                  className="pl-10 border-gray-200 focus:border-emerald-500 focus:ring-emerald-500" 
                />
              </div>
            </div>
          </div>
        </div>
        
        {/* Content Section */}
        <div className="p-2 sm:p-4 lg:px-6 flex-1 overflow-hidden">
          {/* Mobile Card View */}
          <div className="block lg:hidden h-full overflow-y-auto space-y-3 pr-2">
            {searchFilteredMaterials.map(material => {
              const categoryInfo = MATERIAL_CATEGORIES.find(c => c.value === material.category);
              
              return (
                <div key={material.id} className="p-3 bg-gray-100 rounded-lg border-l-4 border-l-emerald-500 shadow-sm">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <h3 className="font-semibold text-sm">{highlightText(material.name, searchTerm)}</h3>
                      <p className="text-xs text-muted-foreground">{categoryInfo?.label || material.category}</p>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${getCategoryColor(material.category)}`}
                      >
                        {categoryInfo?.label || material.category}
                      </Badge>
                      {material.isPOSItem && (
                        <Badge variant="outline" className="text-xs bg-emerald-100 text-emerald-800 border-emerald-200">
                          POS
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                    <div>
                      <span className="text-muted-foreground">Base Unit:</span>
                      <span className="ml-1 font-medium">{material.baseUnit}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Type:</span>
                      <span className="ml-1 font-medium capitalize">{material.unitType}</span>
                    </div>
                    {material.inputUnit && material.inputUnit !== material.baseUnit && (
                      <div className="col-span-2">
                        <span className="text-muted-foreground">Input Unit:</span>
                        <span className="ml-1 font-medium">{material.inputUnit}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-1">
                    <Button variant="outline" size="sm" onClick={() => onEditMaterial(material)} className="h-7 px-2 text-xs">
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => onAddStock(material.id)} className="h-7 px-2 text-xs">
                      <Plus className="h-3 w-3" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm" className="h-7 px-2 text-xs">
                          <Trash2 className="h-3 w-3" />
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
                          <AlertDialogAction onClick={() => onDeleteMaterial(material.id)}>Delete</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Desktop Table View */}
          <div className="hidden lg:block">
            <div className="w-full h-[calc(100vh-310px)] border rounded-md overflow-x-auto">
              <div className="min-w-full h-full flex flex-col">
                {/* Fixed Header */}
                <div className="flex-shrink-0 bg-background border-b">
                  <Table className="min-w-full">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[200px] bg-background">Material Name</TableHead>
                        <TableHead className="min-w-[150px] bg-background">Category</TableHead>
                        <TableHead className="min-w-[120px] bg-background">Base Unit</TableHead>
                        <TableHead className="min-w-[120px] bg-background">Unit Type</TableHead>
                        <TableHead className="min-w-[120px] bg-background">Input Unit</TableHead>
                        <TableHead className="min-w-[100px] bg-background">POS Item</TableHead>
                        <TableHead className="min-w-[200px] bg-background">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                  </Table>
                </div>

                {/* Scrollable Body */}
                <div className="flex-1 overflow-y-auto">
                  <Table className="min-w-full">
                    <TableBody>
                      {searchFilteredMaterials
                        .sort((a, b) => {
                          // Sort by creation date, newest first
                          const dateA = new Date(a.createdAt || 0).getTime();
                          const dateB = new Date(b.createdAt || 0).getTime();
                          return dateB - dateA;
                        })
                        .map(material => {
                          const categoryInfo = MATERIAL_CATEGORIES.find(c => c.value === material.category);
                          
                          return (
                            <TableRow key={material.id} className="hover:bg-gray-50">
                              <TableCell className="font-medium min-w-[200px]">
                                {highlightText(material.name, searchTerm)}
                              </TableCell>
                              <TableCell className="min-w-[150px]">
                                <Badge 
                                  variant="outline" 
                                  className={`${getCategoryColor(material.category)}`}
                                >
                                  {categoryInfo?.label || material.category}
                                </Badge>
                              </TableCell>
                              <TableCell className="min-w-[120px]">{material.baseUnit}</TableCell>
                              <TableCell className="min-w-[120px] capitalize">{material.unitType}</TableCell>
                              <TableCell className="min-w-[120px]">
                                {material.inputUnit && material.inputUnit !== material.baseUnit 
                                  ? material.inputUnit 
                                  : '-'
                                }
                              </TableCell>
                              <TableCell className="min-w-[100px]">
                                {material.isPOSItem ? (
                                  <Badge variant="outline" className="bg-emerald-100 text-emerald-800 border-emerald-200">
                                    Yes
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="bg-gray-100 text-gray-600 border-gray-200">
                                    No
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell className="min-w-[200px]">
                                <div className="flex gap-2">
                                  <Button variant="outline" size="sm" onClick={() => onEditMaterial(material)}>
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={() => onAddStock(material.id)}
                                    className="border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                                  >
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
                                        <AlertDialogDescription>
                                          Are you sure you want to delete "{material.name}"? This action cannot be undone.
                                        </AlertDialogDescription>
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
                          );
                        })}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
