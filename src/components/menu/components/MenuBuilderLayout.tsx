import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { TooltipProvider } from "@/components/ui/tooltip";
import { MenuItemForm } from "../MenuItemForm";
import MenuItemCardView from "../MenuItemCardView";
import { TanStackTable } from "@/components/ui/TanStackTable";
import { MenuItem } from "@/types/inventory";
import { MenuBuilderLayoutProps, mapToCategory } from "@/types/menuItems";
import { useInventoryStore } from "@/hooks/useInventoryStore";

const MenuBuilderLayoutComponent: React.FC<MenuBuilderLayoutProps> = ({
  searchTerm,
  setSearchTerm,
  selectedCategory,
  setSelectedCategory,
  menuItemCategories,
  dataValidationEnabled,
  validationResults,
  showValidationPanel,
  setShowValidationPanel,
  filteredMenuItems,
  currentMenuItems,
  categories,
  showMenuItemForm,
  handleCloseModal,
  editingMenuItem,
  handleUpdateMenuItem,
  handleAddMenuItem,
  handleCancel,
  isMobile,
  handleDeleteMenuItem,
  handleTogglePOSVisibility,
  handlePrinterAssignment,
  handleSelectMenuItem,
  selectedMenuItems,
  bulkSelectionMode,
  highlightSearchTerm,
  categoriesFiltered,
  calculateMenuItemCost,
  table
}) => {
  // Get materials from inventory store
  const { materialsWithStock } = useInventoryStore();
  
  return (
    <TooltipProvider delayDuration={100} skipDelayDuration={10}>
      <div className="flex flex-col h-[calc(100vh-6.5rem)] overflow-hidden">
        <Card className="!border-0 !shadow-none !bg-background flex flex-col h-full">
          <CardHeader className="flex-shrink-0 px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <CardTitle className="text-2xl sm:text-3xl font-bold text-gray-900 flex-shrink-0">Menu Items</CardTitle>

              <div className="flex flex-col sm:flex-row gap-3 lg:gap-4 flex-1 lg:max-w-2xl">
                <div className="relative flex-1 min-w-0">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input type="search" placeholder="Search menu items..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10 h-10" />
                </div>
                <Select value={selectedCategory} onValueChange={value => setSelectedCategory(value)}>
                  <SelectTrigger className="w-full sm:w-[180px] lg:w-[200px] h-10">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {menuItemCategories.map(category => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {dataValidationEnabled && validationResults && (validationResults.summary.errors > 0 || validationResults.summary.warnings > 0) && (
              <div className={`mt-4 p-3 sm:p-4 rounded-lg border ${validationResults.summary.errors > 0 ? "bg-red-50 border-red-200" : "bg-yellow-50 border-yellow-200"}`}>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    {validationResults.summary.errors > 0 ? <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-red-600" /> : <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-600" />}
                    <h3 className={`font-medium text-sm sm:text-base ${validationResults.summary.errors > 0 ? "text-red-800" : "text-yellow-800"}`}>Data Validation Issues Found</h3>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => setShowValidationPanel(!showValidationPanel)} className="text-xs self-start sm:self-auto">
                    {showValidationPanel ? "Hide Details" : "Show Details"}
                  </Button>
                </div>

                <div className="text-xs sm:text-sm mb-2">
                  <span className={validationResults.summary.errors > 0 ? "text-red-700" : "text-yellow-700"}>
                    {validationResults.summary.errors} errors, {validationResults.summary.warnings} warnings
                  </span>
                </div>

                {showValidationPanel && (
                  <div className="space-y-2 max-h-60 sm:max-h-80 overflow-y-auto border rounded-md bg-white/50 p-2">
                    {validationResults.issues.map((issue, index) => (
                      <div key={index} className={`p-2 sm:p-3 rounded-md text-xs sm:text-sm border-l-4 ${issue.type === "error" ? "bg-red-50 border-l-red-500 text-red-900" : issue.type === "warning" ? "bg-yellow-50 border-l-yellow-500 text-yellow-900" : "bg-blue-50 border-l-blue-500 text-blue-900"}`}>
                        <div className="flex items-start gap-2">
                          <div className="flex-shrink-0 mt-0.5">{issue.type === "error" ? <span className="text-red-600 font-bold text-xs">❌</span> : issue.type === "warning" ? <span className="text-yellow-600 font-bold text-xs">⚠️</span> : <span className="text-blue-600 font-bold text-xs">ℹ️</span>}</div>
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold mb-1 text-xs sm:text-sm">{issue.materialName || "System"}</div>
                            <div className="mb-2 text-xs sm:text-sm">{issue.message}</div>
                            {issue.suggestion && (
                              <div className="mt-2 p-2 bg-white/70 rounded text-xs border-l-2 border-l-gray-300">
                                <span className="font-medium text-gray-600">💡 Suggestion:</span> {issue.suggestion}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    <div className="text-xs text-center py-2 text-gray-500 border-t">Showing all {validationResults.issues.length} validation issues</div>
                  </div>
                )}
              </div>
            )}

            {(searchTerm || selectedCategory !== "all") && (
              <div className="mt-3 text-xs sm:text-sm text-muted-foreground px-1">
                Showing <span className="font-medium">{filteredMenuItems.length}</span> of <span className="font-medium">{currentMenuItems.length}</span> menu items
                {searchTerm && (
                  <span className="block sm:inline">
                    {" "}
                    matching <span className="font-medium">"{searchTerm}"</span>
                  </span>
                )}
                {selectedCategory !== "all" && (
                  <span className="block sm:inline">
                    {" "}
                    in <span className="font-medium">{categories.find(c => c.value === selectedCategory)?.name}</span>
                  </span>
                )}
              </div>
            )}
          </CardHeader>
          <CardContent className="flex-1 flex flex-col overflow-hidden p-3 sm:p-4 lg:p-6">
            <Dialog open={showMenuItemForm} onOpenChange={handleCloseModal} modal={true}>
              <DialogContent className="max-w-[95vw] sm:max-w-6xl max-h-[90vh] overflow-y-auto" aria-describedby="menu-item-form-description" onPointerDownOutside={e => e.preventDefault()} onInteractOutside={e => e.preventDefault()}>
                <DialogHeader>
                  <DialogTitle className="text-lg sm:text-xl">{editingMenuItem ? "Edit Menu Item" : "Create New Menu Item"}</DialogTitle>
                </DialogHeader>
                <MenuItemForm 
                  menuItem={editingMenuItem} 
                  categories={mapToCategory(menuItemCategories)} 
                  onSubmit={editingMenuItem ? handleUpdateMenuItem : handleAddMenuItem} 
                  onCancel={handleCancel} 
                  materials={materialsWithStock || []} 
                />
              </DialogContent>
            </Dialog>

            {isMobile ? (
              <MenuItemCardView
                items={filteredMenuItems}
                onEdit={handleAddMenuItem}
                onDelete={(id: string) => handleDeleteMenuItem(id)}
                onTogglePosVisibility={(id: string, visible: boolean) => {
                  const item = filteredMenuItems.find(item => item.id === id);
                  if (item) {
                    if (item.isPOSItem !== visible) {
                      handleTogglePOSVisibility(item);
                    }
                  }
                }}
                onPrinterAssignment={(item: MenuItem) => {
                  if (item && item.id) {
                    const printerId = item.printerId ? String(item.printerId) : "";
                    handlePrinterAssignment(item.id, printerId);
                  }
                }}
                onSelect={handleSelectMenuItem}
                selectedItems={selectedMenuItems}
                bulkSelectionMode={bulkSelectionMode}
                highlightSearchTerm={highlightSearchTerm}
                categories={categoriesFiltered}
                calculateMenuItemCost={calculateMenuItemCost}
              />
            ) : (
              <TanStackTable table={table} />
            )}
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
};

export const MenuBuilderLayout = React.memo(MenuBuilderLayoutComponent, (prevProps, nextProps) => {
  // Only re-render if these specific props change
  if (prevProps.searchTerm !== nextProps.searchTerm || prevProps.selectedCategory !== nextProps.selectedCategory || prevProps.showMenuItemForm !== nextProps.showMenuItemForm || prevProps.bulkSelectionMode !== nextProps.bulkSelectionMode || prevProps.showValidationPanel !== nextProps.showValidationPanel) {
    return false; // Re-render
  }

  // Don't re-render when these actions are performed
  if (prevProps.filteredMenuItems.length === nextProps.filteredMenuItems.length) {
    // Check if table data is functionally the same
    if (prevProps.table !== nextProps.table) {
      // Prevent re-render when only table instance reference changes but data is the same
      return true; // Skip re-render
    }
  }

  return false; // Default to re-render
});

export default MenuBuilderLayout;
