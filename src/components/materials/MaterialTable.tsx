import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TanStackTable } from "@/components/ui/TanStackTable";
import { useInventoryStore } from "@/hooks/useInventoryStore";
import { MaterialTableProps, MaterialWithStock } from "@/types/inventory";
import { highlightText } from "@/utils/highlightText";
import { Edit, Plus, Search, Trash2, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { createColumnHelper, getCoreRowModel, useReactTable, ColumnDef, SortingState, ColumnFiltersState } from "@tanstack/react-table";
import { getCategoriesByType } from "@/api/categories.api";
import { Category } from "@/types/categories";

export function MaterialTable({ filteredMaterials, onEditMaterial, onAddStock, onDeleteMaterial }: MaterialTableProps) {
  const { setShowMaterialForm } = useInventoryStore();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("ASC");
  const [showFloatingButton, setShowFloatingButton] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [sorting, setSorting] = useState<SortingState>([{ id: "name", desc: false }]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const visibleMaterials = useMemo(() => {
    return filteredMaterials.filter(material => {
      const searchLower = searchTerm.toLowerCase();
      const matchesName = material.name.toLowerCase().includes(searchLower);
      const matchesSearch = searchTerm === "" || matchesName;
      
      // Handle category filtering with different data formats
      const matchesCategory = categoryFilter === "all" || (() => {
        const materialCategoryId = (material as any).categoryId;
        const categoryInfo = categories.find(c => c.id === materialCategoryId || c.value === material.category);
        
        // Check if category matches by value
        if (typeof material.category === 'string') {
          return material.category === categoryFilter;
        } else if (typeof material.category === 'object' && material.category !== null && 'value' in material.category) {
          return (material.category as any).value === categoryFilter;
        } else if (categoryInfo) {
          return categoryInfo.value === categoryFilter;
        }
        
        return false;
      })();

      return matchesSearch && matchesCategory;
    });
  }, [filteredMaterials, searchTerm, categoryFilter, categories]);

  const sortedMaterials = useMemo(() => {
    const arr = [...visibleMaterials];
    arr.sort((a, b) => {
      const aVal = (a as any)[sortBy] ?? "";
      const bVal = (b as any)[sortBy] ?? "";
      const aStr = String(aVal).toLowerCase();
      const bStr = String(bVal).toLowerCase();
      const cmp = aStr.localeCompare(bStr);
      return sortOrder === "ASC" ? cmp : -cmp;
    });
    return arr;
  }, [visibleMaterials, sortBy, sortOrder]);

  const paginatedMaterials = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return sortedMaterials.slice(startIndex, endIndex);
  }, [sortedMaterials, currentPage, pageSize]);

  const paginationInfo = useMemo(() => {
    const totalItems = visibleMaterials.length;
    const totalPages = Math.ceil(totalItems / pageSize);
    const startIndex = (currentPage - 1) * pageSize + 1;
    const endIndex = Math.min(currentPage * pageSize, totalItems);

    return {
      currentPage,
      totalPages,
      totalItems,
      itemsPerPage: pageSize,
      startIndex,
      endIndex,
      hasPreviousPage: currentPage > 1,
      hasNextPage: currentPage < totalPages
    };
  }, [visibleMaterials.length, currentPage, pageSize]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoadingCategories(true);
        const response = await getCategoriesByType("materials", true);
        setCategories(response.totalItems || []);
      } catch (error) {
        console.error("Failed to fetch categories:", error);
        setCategories([]);
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchCategories();
  }, []);

  const handleSortChange = useCallback((newSortBy: string, newSortOrder: "ASC" | "DESC") => {
    setSortBy(newSortBy);
    setSortOrder(newSortOrder);
    setCurrentPage(1);
  }, []);

  const goToFirstPage = useCallback(() => {
    setCurrentPage(1);
  }, []);

  const goToPreviousPage = useCallback(() => {
    setCurrentPage(prev => Math.max(1, prev - 1));
  }, []);

  const goToNextPage = useCallback(() => {
    setCurrentPage(prev => Math.min(paginationInfo.totalPages, prev + 1));
  }, [paginationInfo.totalPages]);

  const goToLastPage = useCallback(() => {
    setCurrentPage(paginationInfo.totalPages);
  }, [paginationInfo.totalPages]);

  const handlePageSizeChange = useCallback((newSize: string) => {
    const size = Number(newSize);
    setPageSize(size);
    setCurrentPage(1);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const scrollContainer = scrollContainerRef.current;
      if (!scrollContainer) return;
      const currentScrollY = scrollContainer.scrollTop;
      if (currentScrollY < lastScrollY || currentScrollY < 50) {
        setShowFloatingButton(true);
      } else if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setShowFloatingButton(false);
      }

      setLastScrollY(currentScrollY);
    };

    const scrollContainer = scrollContainerRef.current;
    if (scrollContainer) {
      scrollContainer.addEventListener("scroll", handleScroll, { passive: true });
      return () => scrollContainer.removeEventListener("scroll", handleScroll);
    }
  }, [lastScrollY]);

  const columnHelper = createColumnHelper<MaterialWithStock>();

  const columns = useMemo<ColumnDef<MaterialWithStock>[]>(
    () => [
      columnHelper.accessor("name", {
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => {
              const newOrder = sortBy === "name" && sortOrder === "ASC" ? "DESC" : "ASC";
              handleSortChange("name", newOrder);
            }}
            className="h-auto p-0 font-semibold hover:bg-transparent"
          >
            Material Name
            <span className="ml-2 text-xs">{sortBy === "name" ? (sortOrder === "ASC" ? "↑" : "↓") : "↕"}</span>
          </Button>
        ),
        cell: ({ getValue }) => <div className="font-medium">{highlightText(getValue(), searchTerm)}</div>,
        enableSorting: false,
        size: 250
      }),

      columnHelper.accessor("category", {
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => {
              const newOrder = sortBy === "category" && sortOrder === "ASC" ? "DESC" : "ASC";
              handleSortChange("category", newOrder);
            }}
            className="h-auto p-0 font-semibold hover:bg-transparent"
          >
            Category
            <span className="ml-2 text-xs">{sortBy === "category" ? (sortOrder === "ASC" ? "↑" : "↓") : "↕"}</span>
          </Button>
        ),
        cell: ({ getValue, row }) => {
          const category = getValue();
          const materialCategoryId = (row.original as any).categoryId;
          const categoryInfo = categories.find(c => c.id === materialCategoryId || c.value === category);
          
          // If no category value, show a placeholder
          if (!category && !materialCategoryId) {
            return (
              <Badge variant="outline" className="text-xs font-medium bg-gray-100 text-gray-500 border-gray-200">
                No Category
              </Badge>
            );
          }

          return (
            <Badge variant="outline" className={`text-xs font-medium ${getCategoryColor(categoryInfo?.value || category)}`}>
              {categoryInfo?.name || category}
            </Badge>
          );
        },
        enableSorting: false,
        size: 150
      }),

      columnHelper.accessor("baseUnit", {
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => {
              const newOrder = sortBy === "baseUnit" && sortOrder === "ASC" ? "DESC" : "ASC";
              handleSortChange("baseUnit", newOrder);
            }}
            className="h-auto p-0 font-semibold hover:bg-transparent"
          >
            Base Unit
            <span className="ml-2 text-xs">{sortBy === "baseUnit" ? (sortOrder === "ASC" ? "↑" : "↓") : "↕"}</span>
          </Button>
        ),
        cell: ({ getValue }) => <div className="text-gray-700 font-mono text-sm">{getValue()}</div>,
        enableSorting: false,
        size: 120
      }),

      columnHelper.accessor("unitType", {
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => {
              const newOrder = sortBy === "unitType" && sortOrder === "ASC" ? "DESC" : "ASC";
              handleSortChange("unitType", newOrder);
            }}
            className="h-auto p-0 font-semibold hover:bg-transparent"
          >
            Unit Type
            <span className="ml-2 text-xs">{sortBy === "unitType" ? (sortOrder === "ASC" ? "↑" : "↓") : "↕"}</span>
          </Button>
        ),
        cell: ({ getValue }) => <div className="text-gray-700 capitalize">{getValue()}</div>,
        enableSorting: false,
        size: 120
      }),

      columnHelper.accessor("inputUnit", {
        header: "Input Unit",
        cell: ({ getValue, row }) => {
          const inputUnit = getValue();
          const baseUnit = row.original.baseUnit;
          return <div className="text-gray-700 font-mono text-sm">{inputUnit && inputUnit !== baseUnit ? inputUnit : "-"}</div>;
        },
        enableSorting: false,
        size: 120
      }),

      columnHelper.display({
        id: "actions",
        enableSorting: false,
        header: ({ column }) => <div className="flex justify-center w-full">Actions</div>,
        cell: ({ row }) => (
          <div className="flex items-center justify-center gap-2 -mr-6">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm" onClick={() => onEditMaterial(row.original)} className="h-8 w-8 p-0 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700">
                  <Edit className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="!z-[9999]">
                <p>Edit {row.original.name}</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm" onClick={() => onAddStock(row.original.id)} className={`h-8 w-8 p-0 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700 ${row.original.stockEntries && row.original.stockEntries.length > 0 ? "bg-teal-300/25 border-teal-300" : "bg-red-500/25 border-red-300 hover:bg-red-300 hover:border-red-500"}`}>
                  <Plus className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="!z-[9999] relative" side="top" sideOffset={5}>
                <p>{row.original.stockEntries && row.original.stockEntries.length > 0 ? `Add more stock for ${row.original.name} (${row.original.stockEntries.length} entries)` : `No stock entries - Add initial stock for ${row.original.name}`}</p>
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
                <TooltipContent className="!z-[9999]">
                  <p>Delete {row.original.name}</p>
                </TooltipContent>
              </Tooltip>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Material</AlertDialogTitle>
                  <AlertDialogDescription>Are you sure you want to delete "{row.original.name}"? This action cannot be undone.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => onDeleteMaterial(row.original.id)} className="bg-red-600 hover:bg-red-700">
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        ),
        size: 200
      })
    ],
    [searchTerm, onEditMaterial, onAddStock, onDeleteMaterial, sortBy, sortOrder, handleSortChange, categories]
  );

  const table = useReactTable({
    data: paginatedMaterials,
    columns,
    state: {
      sorting,
      columnFilters
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    manualSorting: true,
    manualFiltering: true,
    manualPagination: true
  });

  const getCategoryColor = useCallback((category: string) => {
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
  }, []);

  return (
    <TooltipProvider delayDuration={100} skipDelayDuration={10}>
      <div className="h-full flex flex-col p-2">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between space-y-4 px-5">
          {/* Title Section */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 ">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Materials</h1>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                <>
                  <span>Total: {paginationInfo.totalItems} materials</span>
                  <span>•</span>
                  <span>
                    Showing {paginationInfo.startIndex}-{paginationInfo.endIndex} of {paginationInfo.totalItems}
                  </span>
                  <span>•</span>
                  <span>
                    Page {paginationInfo.currentPage} of {paginationInfo.totalPages}
                  </span>
                </>
                {(searchTerm || categoryFilter !== "all") && (
                  <>
                    <span>•</span>
                    <span className="text-blue-600 font-medium">
                      Filtered results
                      {categoryFilter !== "all" && ` (${categories.find(c => c.value === categoryFilter)?.name})`}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 z-10" />
              <Input type="search" placeholder="Search by material name..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10 border-gray-200 focus:border-emerald-500 focus:ring-emerald-500 !h-10 min-h-[2.5rem]" />
            </div>

            {/* Category Filter */}
            <div className="w-fit shrink-0">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="border-gray-200 focus:border-emerald-500 focus:ring-emerald-500 !h-10 min-h-[2.5rem] w-full">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category.id} value={category.value}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Page Size Selector */}
            <div className="w-fit shrink-0">
              <Select value={pageSize.toString()} onValueChange={handlePageSizeChange}>
                <SelectTrigger className="border-gray-200 focus:border-emerald-500 focus:ring-emerald-500 !h-10 min-h-[2.5rem] w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="25">25 per page</SelectItem>
                  <SelectItem value="50">50 per page</SelectItem>
                  <SelectItem value="100">100 per page</SelectItem>
                  <SelectItem value="200">200 per page</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Pagination Controls */}
            {paginationInfo.totalPages > 1 && (
              <div className="flex items-center gap-1">
                <Button variant="outline" size="sm" onClick={goToFirstPage} disabled={!paginationInfo.hasPreviousPage} className="h-10 px-3">
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={goToPreviousPage} disabled={!paginationInfo.hasPreviousPage} className="h-10 px-3">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="px-3 py-2 text-sm font-medium bg-gray-50 rounded border">{paginationInfo.currentPage}</span>
                <Button variant="outline" size="sm" onClick={goToNextPage} disabled={!paginationInfo.hasNextPage} className="h-10 px-3">
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={goToLastPage} disabled={!paginationInfo.hasNextPage} className="h-10 px-3">
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Content Section */}
        <div ref={scrollContainerRef} className="flex-1 overflow-hidden overflow-y-auto relative">
          {/* Empty State */}
          {visibleMaterials.length === 0 && (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <p className="text-gray-600 mb-2">No materials found</p>
                {(searchTerm || categoryFilter !== "all") && <p className="text-sm text-gray-500">Try adjusting your search or filter criteria</p>}
              </div>
            </div>
          )}

          {/* Mobile Card View */}
          {paginatedMaterials.length > 0 && (
            <div className="lg:hidden space-y-4 mt-3">
              {paginatedMaterials.map(material => {
                const materialCategoryId = (material as any).categoryId;
                const categoryInfo = categories.find(c => c.id === materialCategoryId || c.value === material.category);
                return (
                  <div key={material.id} className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 text-base mb-1 truncate">{highlightText(material.name, searchTerm)}</h3>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={`text-xs font-medium ${getCategoryColor(material.category)}`}>
                            {categoryInfo?.name || material.category}
                          </Badge>
                          {material.isPOSItem && (
                            <Badge variant="secondary" className="text-xs font-medium">
                              POS
                            </Badge>
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
                          <Button variant="outline" size="sm" onClick={() => onEditMaterial(material)} className="flex-1 h-8 text-xs hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700">
                            <Edit className="h-3 w-3 mr-1" />
                            Edit
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent className="z-[9999]">
                          <p>Edit {material.name}</p>
                        </TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="outline" size="sm" onClick={() => onAddStock(material.id)} className={`flex-1 h-8 text-xs hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700 ${material.stockEntries && material.stockEntries.length > 0 ? "bg-teal-500/25 border-teal-300" : "bg-red-500/25 border-red-300"}`}>
                            <Plus className="h-3 w-3 mr-1" />
                            Stock
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent className="z-[9999]">
                          <p>{material.stockEntries && material.stockEntries.length > 0 ? `Add more stock for ${material.name} (${material.stockEntries.length} entries)` : `No stock entries - Add initial stock for ${material.name}`}</p>
                        </TooltipContent>
                      </Tooltip>
                      <AlertDialog>
                        <Tooltip>
                          <AlertDialogTrigger asChild>
                            <TooltipTrigger asChild>
                              <Button variant="outline" size="sm" className="h-8 px-3 text-xs hover:bg-red-50 hover:border-red-300 hover:text-red-700">
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </TooltipTrigger>
                          </AlertDialogTrigger>
                          <TooltipContent className="z-[9999]">
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
                  </div>
                );
              })}
            </div>
          )}

          {/* Desktop Table View - TanStack Virtualized */}
          {paginatedMaterials.length > 0 && (
            <div className="hidden lg:block px-2">
              <div className="h-[calc(100vh-192px)] overflow-y-hidden mt-1">
                <TanStackTable table={table} virtualized={true} customHeaderAlignment={{ actions: "center" }} customCellAlignment={{ actions: "center" }} estimatedRowSize={60} overscan={10} loading={false} emptyMessage="No materials found" maxHeight="calc(100vh-192px)" />
              </div>
            </div>
          )}

          {/* Bottom Pagination Controls for Mobile */}
          {paginationInfo.totalPages > 1 && (
            <div className="lg:hidden mt-6 px-4">
              <div className="flex items-center justify-between bg-white p-4 rounded-lg border">
                <div className="text-sm text-gray-600">
                  Page {paginationInfo.currentPage} of {paginationInfo.totalPages}
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={goToPreviousPage} disabled={!paginationInfo.hasPreviousPage} className="h-9 px-3">
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={goToNextPage} disabled={!paginationInfo.hasNextPage} className="h-9 px-3">
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Floating Add Button */}
        <div className={`fixed bottom-6 right-6 z-50 transition-all duration-300 ease-in-out transform ${showFloatingButton ? "translate-y-0 opacity-100 scale-100" : "translate-y-16 opacity-0 scale-95 pointer-events-none"}`}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button onClick={() => setShowMaterialForm(true)} className="bg-primary hover:bg-primary/80 text-white shadow-lg hover:shadow-xl transition-all duration-200 rounded-full h-14 w-14 p-0 group" size="lg">
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
