import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useInventoryStore } from "@/hooks/useInventoryStore";
import { MATERIAL_CATEGORIES, MaterialTableProps } from "@/types/inventory";
import { highlightText } from "@/utils/highlightText";
import { Edit, Plus, Search, Trash2, ChevronUp, ChevronDown } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useState, useEffect, useRef } from "react";

export function MaterialTable({ filteredMaterials, onEditMaterial, onAddStock, onDeleteMaterial }: MaterialTableProps) {
  const { setShowMaterialForm } = useInventoryStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<"name" | "baseUnit" | "createdAt">("createdAt");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [showFloatingButton, setShowFloatingButton] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Handle sorting
  const handleSort = (field: "name" | "baseUnit" | "createdAt") => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Handle scroll for floating button
  useEffect(() => {
    const handleScroll = () => {
      const scrollContainer = scrollContainerRef.current;
      if (!scrollContainer) return;

      const currentScrollY = scrollContainer.scrollTop;
      
      // Show button when scrolling up or at top, hide when scrolling down
      if (currentScrollY < lastScrollY || currentScrollY < 50) {
        setShowFloatingButton(true);
      } else if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setShowFloatingButton(false);
      }
      
      setLastScrollY(currentScrollY);
    };

    const scrollContainer = scrollContainerRef.current;
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', handleScroll, { passive: true });
      return () => scrollContainer.removeEventListener('scroll', handleScroll);
    }
  }, [lastScrollY]);

  // Filter and sort materials
  const searchFilteredMaterials = filteredMaterials
    .filter(material => {
      const matchesSearch = !searchTerm || material.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter === "all" || material.category === categoryFilter;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case "name": {
          comparison = a.name.localeCompare(b.name);
          break;
        }
        case "baseUnit": {
          comparison = a.baseUnit.localeCompare(b.baseUnit);
          break;
        }
        case "createdAt":
        default: {
          const dateA = new Date(a.createdAt || 0).getTime();
          const dateB = new Date(b.createdAt || 0).getTime();
          comparison = dateA - dateB;
          break;
        }
      }

      return sortDirection === "asc" ? comparison : -comparison;
    });

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "meat":
        return "bg-red-100 text-red-800 border-red-200";
      case "dairy":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "vegetables":
        return "bg-green-100 text-green-800 border-green-200";
      case "grains":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "spices":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "beverages":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "alcohol":
        return "bg-pink-100 text-pink-800 border-pink-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <TooltipProvider delayDuration={100} skipDelayDuration={10}>
      <div className="h-full flex flex-col p-2">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between space-y-4 px-5">
          {/* Title Section */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 ">
            <div className="space-y-1">
              <h1 className="text-2xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Materials</h1>
              <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                <span>Total: {filteredMaterials.length} materials</span>
                {(searchTerm || categoryFilter !== "all") && (
                  <span className="text-blue-600 font-medium">
                    Filtered: {searchFilteredMaterials.length} results
                    {categoryFilter !== "all" && ` (${MATERIAL_CATEGORIES.find(c => c.value === categoryFilter)?.label})`}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex items-center gap-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 z-10" />
              <Input 
                placeholder="Search by material name..." 
                value={searchTerm} 
                onChange={e => setSearchTerm(e.target.value)} 
                className="pl-10 border-gray-200 focus:border-emerald-500 focus:ring-emerald-500 !h-10 min-h-[2.5rem]" 
              />
            </div>

            {/* Category Filter */}
            <div className="w-fit shrink-0">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="border-gray-200 focus:border-emerald-500 focus:ring-emerald-500 !h-10 min-h-[2.5rem] w-full">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {MATERIAL_CATEGORIES.map(category => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div ref={scrollContainerRef} className="flex-1 overflow-hidden overflow-y-auto relative">
          {/* Mobile Card View */}
          <div className="lg:hidden space-y-4">
            {searchFilteredMaterials.map(material => {
              const categoryInfo = MATERIAL_CATEGORIES.find(c => c.value === material.category);

              return (
                <div key={material.id} className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 text-base mb-1 truncate">
                        {highlightText(material.name, searchTerm)}
                      </h3>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={`text-xs font-medium ${getCategoryColor(material.category)}`}>
                          {categoryInfo?.label || material.category}
                        </Badge>
                        {material.isPOSItem && (
                          <Badge variant="secondary" className="text-xs font-medium">POS</Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                    <div className="space-y-1">
                      <span className="text-gray-500 text-xs font-medium">Base Unit</span>
                      <p className="font-mono text-gray-900">{material.baseUnit}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-gray-500 text-xs font-medium">Unit Type</span>
                      <p className="capitalize text-gray-900">{material.unitType}</p>
                    </div>
                    {material.inputUnit && material.inputUnit !== material.baseUnit && (
                      <div className="col-span-2 space-y-1">
                        <span className="text-gray-500 text-xs font-medium">Input Unit</span>
                        <p className="font-mono text-gray-900">{material.inputUnit}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 pt-2 border-t border-gray-100">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => onEditMaterial(material)} 
                          className="flex-1 h-8 text-xs hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700"
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          Edit
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Edit {material.name}</p>
                      </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => onAddStock(material.id)} 
                          className="flex-1 h-8 text-xs hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700"
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Stock
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Add stock for {material.name}</p>
                      </TooltipContent>
                    </Tooltip>
                    <AlertDialog>
                      <Tooltip>
                        <AlertDialogTrigger asChild>
                          <TooltipTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="h-8 px-3 text-xs hover:bg-red-50 hover:border-red-300 hover:text-red-700"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </TooltipTrigger>
                        </AlertDialogTrigger>
                        <TooltipContent>
                          <p>Delete {material.name}</p>
                        </TooltipContent>
                      </Tooltip>
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
              );
            })}
          </div>

          {/* Desktop Table View */}
          <div className="hidden lg:block px-4">
            <div className="w-full h-[calc(100vh-210px)] rounded-lg border overflow-hidden bg-white mt-4">
              <Table className="w-full">
                <TableHeader className="bg-gray-100 sticky top-0 z-10">
                  <TableRow className="border-b border-gray-200">
                    <TableHead className="w-[25%] px-6 py-4 text-left font-semibold text-gray-900">
                      <Button 
                        variant="ghost" 
                        className="h-auto p-0 font-semibold text-gray-900 hover:text-gray-700 flex items-center justify-between w-full group transition-colors duration-200 hover:bg-transparent" 
                        onClick={() => handleSort("name")}
                      >
                        <span>Material Name</span>
                        <div className="flex items-center justify-center w-5 h-5 ml-2">
                          {sortField === "name" ? (
                            sortDirection === "asc" ? (
                              <ChevronUp className="h-4 w-4 text-emerald-600 transition-all duration-200" />
                            ) : (
                              <ChevronDown className="h-4 w-4 text-emerald-600 transition-all duration-200" />
                            )
                          ) : (
                            <div className="flex flex-col items-center justify-center opacity-60 group-hover:opacity-80 transition-opacity duration-200">
                              <ChevronUp className="h-2.5 w-2.5 text-gray-400 -mb-0.5" />
                              <ChevronDown className="h-2.5 w-2.5 text-gray-400" />
                            </div>
                          )}
                        </div>
                      </Button>
                    </TableHead>
                    <TableHead className="w-[15%] px-4 py-4 text-left font-semibold text-gray-900">Category</TableHead>
                    <TableHead className="w-[12%] px-4 py-4 text-left font-semibold text-gray-900">
                      <Button 
                        variant="ghost" 
                        className="h-auto p-0 font-semibold text-gray-900 hover:text-gray-700 flex items-center justify-between w-full group transition-colors duration-200 hover:bg-transparent" 
                        onClick={() => handleSort("baseUnit")}
                      >
                        <span>Base Unit</span>
                        <div className="flex items-center justify-center w-5 h-5 ml-2">
                          {sortField === "baseUnit" ? (
                            sortDirection === "asc" ? (
                              <ChevronUp className="h-4 w-4 text-emerald-600 transition-all duration-200" />
                            ) : (
                              <ChevronDown className="h-4 w-4 text-emerald-600 transition-all duration-200" />
                            )
                          ) : (
                            <div className="flex flex-col items-center justify-center opacity-60 group-hover:opacity-80 transition-opacity duration-200">
                              <ChevronUp className="h-2.5 w-2.5 text-gray-400 -mb-0.5" />
                              <ChevronDown className="h-2.5 w-2.5 text-gray-400" />
                            </div>
                          )}
                        </div>
                      </Button>
                    </TableHead>
                    <TableHead className="w-[12%] px-4 py-4 text-left font-semibold text-gray-900">Unit Type</TableHead>
                    <TableHead className="w-[12%] px-4 py-4 text-left font-semibold text-gray-900">Input Unit</TableHead>
                    <TableHead className="w-[24%] px-6 py-4 text-center font-semibold text-gray-900">Actions</TableHead>
                  </TableRow>
                </TableHeader>
              </Table>

              <div className="h-[calc(100%-60px)] overflow-y-auto">
                <Table className="w-full">
                  <TableBody>
                    {searchFilteredMaterials.map(material => {
                      const categoryInfo = MATERIAL_CATEGORIES.find(c => c.value === material.category);

                      return (
                        <TableRow key={material.id} className="hover:bg-gray-50/50 border-b border-gray-100 transition-colors">
                          <TableCell className="w-[25%] px-6 py-4 font-medium text-gray-900">{highlightText(material.name, searchTerm)}</TableCell>
                          <TableCell className="w-[15%] px-4 py-4">
                            <Badge variant="outline" className={`text-xs font-medium ${getCategoryColor(material.category)}`}>
                              {categoryInfo?.label || material.category}
                            </Badge>
                          </TableCell>
                          <TableCell className="w-[12%] px-4 py-4 text-gray-700 font-mono text-sm">{material.baseUnit}</TableCell>
                          <TableCell className="w-[12%] px-4 py-4 text-gray-700 capitalize">{material.unitType}</TableCell>
                          <TableCell className="w-[12%] px-4 py-4 text-gray-700 font-mono text-sm">{material.inputUnit && material.inputUnit !== material.baseUnit ? material.inputUnit : "-"}</TableCell>
                          <TableCell className="w-[24%] px-6 py-4">
                            <div className="flex items-center justify-center gap-2">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="outline" size="sm" onClick={() => onEditMaterial(material)} className="h-8 w-8 p-0 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700">
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Edit {material.name}</p>
                                </TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="outline" size="sm" onClick={() => onAddStock(material.id)} className="h-8 w-8 p-0 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700">
                                    <Plus className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Add stock for {material.name}</p>
                                </TooltipContent>
                              </Tooltip>
                              <AlertDialog>
                                <Tooltip>
                                  <AlertDialogTrigger asChild>
                                    <TooltipTrigger asChild>
                                      <Button variant="outline" size="sm" className="h-8 w-8 p-0 hover:bg-red-50 hover:border-red-300 hover:text-red-700">
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                  </AlertDialogTrigger>
                                  <TooltipContent>
                                    <p>Delete {material.name}</p>
                                  </TooltipContent>
                                </Tooltip>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Material</AlertDialogTitle>
                                    <AlertDialogDescription>Are you sure you want to delete "{material.name}"? This action cannot be undone.</AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => onDeleteMaterial(material.id)} className="bg-red-600 hover:bg-red-700">
                                      Delete
                                    </AlertDialogAction>
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
        
        {/* Floating Add Button */}
        <div 
          className={`fixed bottom-6 right-6 z-50 transition-all duration-300 ease-in-out transform ${
            showFloatingButton 
              ? 'translate-y-0 opacity-100 scale-100' 
              : 'translate-y-16 opacity-0 scale-95 pointer-events-none'
          }`}
        >
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                onClick={() => setShowMaterialForm(true)} 
                className="bg-primary hover:bg-primary/80 text-white shadow-lg hover:shadow-xl transition-all duration-200 rounded-full h-14 w-14 p-0 group"
                size="lg"
              >
                <Plus className="h-6 w-6 group-hover:scale-110 transition-transform duration-200" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Add new material</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </TooltipProvider>
  );
}
