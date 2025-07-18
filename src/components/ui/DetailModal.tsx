import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Material, MaterialWithSectionAssignments, MenuItem, Section, SectionAssignment, SectionWithAssignments, StockEntry } from "@/types/inventory";
import { formatCurrency, formatNumber } from "@/utils/conversionLogic";
import { getCategoryLabel } from "@/utils/getCategoryLabel";
import { AlertTriangle, Edit, Package, Plus, Trash2 } from "lucide-react";
import { useState } from "react";

interface DetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedItem: {
    type: "material" | "stock" | "section" | "assignment";
    data: MaterialWithSectionAssignments | StockEntry | Section | SectionAssignment;
  } | null;
  materialsWithSectionAssignments: MaterialWithSectionAssignments[];
  sectionsWithAssignments: SectionWithAssignments[];
  onShowAssignmentForm?: (show: boolean) => void;
  onEditAssignment?: (assignment: SectionAssignment) => void;
  onDeleteAssignment?: (assignmentId: string) => void;
}

export const DetailModal = ({ isOpen, onClose, selectedItem, materialsWithSectionAssignments, sectionsWithAssignments, onShowAssignmentForm, onEditAssignment, onDeleteAssignment }: DetailModalProps) => {
  const [showAssignmentDetails, setShowAssignmentDetails] = useState(false);
  const [selectedSectionForAssignments, setSelectedSectionForAssignments] = useState<SectionWithAssignments | null>(null);
  if (!selectedItem) return null;

  // Extract sections from sectionsWithAssignments for easy lookup
  const sections = sectionsWithAssignments.map(s => ({ id: s.id, name: s.name, description: s.description }));

  const renderMaterialDetails = (material: MaterialWithSectionAssignments) => {
    const materialWithAssignments = materialsWithSectionAssignments.find(m => m.id === material.id);
    const sectionAssignments = materialWithAssignments?.sectionAssignments || [];

    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-xl font-bold text-foreground">{material.name}</h3>
          <p className="text-sm text-muted-foreground">{material.description}</p>
        </div>

        <div className="rounded-xl border border-border bg-muted/30 p-4 shadow-sm space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
            <div>
              <h4 className="text-sm font-semibold text-muted-foreground">Category</h4>
              <p className="text-base">{getCategoryLabel(material.category)}</p>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-muted-foreground">Base Unit</h4>
              <p>{material.baseUnit}</p>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-muted-foreground">Unit Type</h4>
              <p>{material.unitType}</p>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-muted-foreground">Cost per Unit</h4>
              <p className="font-medium">
                {formatCurrency(material.costPerBaseUnit)} / {material.baseUnit}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-muted/30 p-4 shadow-sm space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-4">
            <div>
              <h4 className="text-sm font-semibold text-muted-foreground">Total Quantity</h4>
              <p>
                {formatNumber(material.totalQuantityInBaseUnit)} {material.baseUnit}
              </p>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-muted-foreground">Available Quantity</h4>
              <p>
                {formatNumber(materialWithAssignments?.availableQuantity || material.totalQuantityInBaseUnit)} {material.baseUnit}
              </p>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-muted-foreground">Total Value</h4>
              <p className="font-semibold text-foreground">{formatCurrency(material.totalValue)}</p>
            </div>
          </div>
        </div>

        {sectionAssignments.length > 0 && (
          <div className="rounded-xl border border-border bg-muted/30 p-4 shadow-sm space-y-2">
            <h4 className="text-sm font-semibold text-muted-foreground">Section Assignments</h4>
            {sectionAssignments.map((assignment, index) => (
              <div key={index} className="rounded-md bg-accent/30 px-4 py-2 flex items-center justify-between">
                <span className="text-sm font-medium text-primary">{assignment.sectionName}</span>
                <span className="text-sm">
                  {formatNumber(assignment.assignedQuantity)} {assignment.assignedUnit}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderStockDetails = (stock: StockEntry) => {
    const material = materialsWithSectionAssignments.find(m => m.id === stock.materialId);

    return (
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold">{material?.name || "Unknown Material"}</h3>
          <p className="text-muted-foreground">{material?.description}</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium">Supplier</h4>
            <p>{stock.supplier}</p>
          </div>
          <div>
            <h4 className="font-medium">Purchase Date</h4>
            <p>{new Date(stock.purchaseDate).toLocaleDateString()}</p>
          </div>
          <div>
            <h4 className="font-medium">Quantity</h4>
            <p>
              {formatNumber(stock.purchasedQuantity)} {stock.purchasedUnit}
            </p>
          </div>
          <div>
            <h4 className="font-medium">Unit Cost</h4>
            <p>
              {formatCurrency(stock.costPerPurchasedUnit)}/{stock.purchasedUnit}
            </p>
          </div>
          <div>
            <h4 className="font-medium">Total Cost</h4>
            <p>{formatCurrency(stock.totalCost)}</p>
          </div>
          {stock.expiryDate && (
            <div>
              <h4 className="font-medium">Expiry Date</h4>
              <p>{new Date(stock.expiryDate).toLocaleDateString()}</p>
            </div>
          )}
          {stock.batchNumber && (
            <div>
              <h4 className="font-medium">Batch Number</h4>
              <p>{stock.batchNumber}</p>
            </div>
          )}
        </div>

        {stock.notes && (
          <div>
            <h4 className="font-medium">Notes</h4>
            <p className="text-muted-foreground">{stock.notes}</p>
          </div>
        )}
      </div>
    );
  };

  const renderSectionDetails = (section: Section) => {
    const sectionWithAssignments = sectionsWithAssignments.find(s => s.id === section.id);

    return (
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold">{section.name}</h3>
          <p className="text-muted-foreground">{section.description}</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium">Total Assignments</h4>
            <p>{sectionWithAssignments?.assignments.length || 0}</p>
          </div>
          <div>
            <h4 className="font-medium">Total Value</h4>
            <p>{formatCurrency(sectionWithAssignments?.totalValue || 0)}</p>
          </div>
        </div>

        {sectionWithAssignments?.assignments && sectionWithAssignments.assignments.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium">Assigned Items</h4>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setSelectedSectionForAssignments(sectionWithAssignments);
                  setShowAssignmentDetails(true);
                }}
              >
                <Package className="h-4 w-4 mr-2" />
                View All Assignments
              </Button>
            </div>
            <div className="space-y-2 mt-2">
              {sectionWithAssignments.assignments.map((assignment, index) => {
                // Determine itemType if it's not set
                let itemType = assignment.itemType;
                if (!itemType) {
                  if (assignment.menuItemId && assignment.menuItem?.id) {
                    itemType = "menuItem";
                  } else if (assignment.materialId && (assignment.material?.id || assignment.stockEntry?.id)) {
                    itemType = "stockEntry";
                  }
                }

                // Menu Item Assignment
                if (itemType === "menuItem" && assignment.menuItem) {
                  return (
                    <div key={index} className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-blue-900">{assignment.menuItem.name}</span>
                            <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">Menu Item</span>
                          </div>
                          <div className="text-sm text-blue-700 mt-1">Category: {assignment.menuItem.category || "No category"}</div>
                          {assignment.menuItem.description && <div className="text-sm text-blue-600 mt-1">{assignment.menuItem.description}</div>}
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-blue-700">1 item</div>
                          <div className="font-semibold text-blue-900">{formatCurrency(assignment.menuItem.price || 0)}</div>
                        </div>
                      </div>
                    </div>
                  );
                }

                // Material/Stock Entry Assignment
                if (itemType === "stockEntry" && (assignment.material || assignment.stockEntry)) {
                  const assignmentValue = (assignment.assignedQuantity || 0) * (assignment.stockEntry?.costPerPurchasedUnit || assignment.material?.costPerBaseUnit || 0);

                  // Calculate converted quantity for package units
                  const getQuantityDisplay = () => {
                    const material = assignment.material;
                    const assignedQty = assignment.assignedQuantity || 0;
                    const assignedUnit = assignment.assignedUnit || "";

                    if (material?.unitType === "package" && material.packageQuantity && material.packageQuantity > 0) {
                      // Use assignedIndividualQuantity if available, otherwise calculate
                      const convertedQty = assignment.assignedIndividualQuantity || assignedQty * material.packageQuantity;
                      return (
                        <div className="text-sm text-green-700">
                          <div>
                            {formatNumber(assignedQty)} {assignedUnit}
                          </div>
                          <div className="text-xs text-green-600">
                            ({formatNumber(convertedQty)} {material.baseUnit})
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div className="text-sm text-green-700">
                        {formatNumber(assignedQty)} {assignedUnit}
                      </div>
                    );
                  };

                  return (
                    <div key={index} className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-green-900">{assignment.material?.name || assignment.stockEntry?.materialId || "Material"}</span>
                            <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full">Material</span>
                            {assignment.material?.unitType === "package" && <span className="px-2 py-1 text-xs bg-orange-100 text-orange-700 rounded-full">Package</span>}
                          </div>
                          {assignment.stockEntry?.supplier && <div className="text-sm text-green-700 mt-1">Supplier: {assignment.stockEntry.supplier}</div>}
                          {assignment.stockEntry?.batchNumber && <div className="text-sm text-green-600 mt-1">Batch: {assignment.stockEntry.batchNumber}</div>}
                        </div>
                        <div className="text-right">
                          {getQuantityDisplay()}
                          <div className="font-semibold text-green-900">{formatCurrency(assignmentValue)}</div>
                        </div>
                      </div>
                      {assignment.notes && (
                        <div className="text-sm text-green-600 mt-2 pt-2 border-t border-green-200">
                          <span className="font-medium">Notes:</span> {assignment.notes}
                        </div>
                      )}
                    </div>
                  );
                }

                // Fallback for unknown assignment types
                return (
                  <div key={index} className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                    <div className="text-sm text-gray-600">Unknown assignment type: {assignment.itemType || "undefined"}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderAssignmentDetails = (
    assignment: SectionAssignment & {
      stockEntry?: StockEntry;
      material?: Material;
      menuItem?: MenuItem;
    }
  ) => {
    const isMenuItem = assignment.itemType === "menuItem";

    if (isMenuItem) {
      return (
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold">{assignment.menuItem?.name || "Menu Item"}</h3>
            <p className="text-muted-foreground">Assigned to: {sections.find(s => s.id === assignment.sectionId)?.name || "Unknown Section"}</p>
          </div>

          <div className="rounded-xl border border-border bg-muted/30 p-4 shadow-sm space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
              <div>
                <h4 className="text-sm font-semibold text-muted-foreground">Category</h4>
                <p className="text-base">{assignment.menuItem?.category || "Unknown"}</p>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-muted-foreground">Price</h4>
                <p className="font-medium">{formatCurrency(assignment.menuItem?.price || 0)}</p>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-muted-foreground">Description</h4>
                <p>{assignment.menuItem?.description || "No description"}</p>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-muted-foreground">Created</h4>
                <p>{assignment.menuItem?.createdAt ? new Date(assignment.menuItem.createdAt).toLocaleDateString() : "Unknown"}</p>
              </div>
            </div>
          </div>

          {assignment.notes && (
            <div className="rounded-xl border border-border bg-muted/30 p-4 shadow-sm">
              <h4 className="text-sm font-semibold text-muted-foreground mb-2">Assignment Notes</h4>
              <p className="text-sm">{assignment.notes}</p>
            </div>
          )}
        </div>
      );
    }

    // Material assignment rendering
    return (
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold">{assignment.material?.name || "Material"}</h3>
          <p className="text-muted-foreground">Assigned to: {sections.find(s => s.id === assignment.sectionId)?.name || "Unknown Section"}</p>
        </div>

        <div className="rounded-xl border border-border bg-muted/30 p-4 shadow-sm space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
            <div>
              <h4 className="text-sm font-semibold text-muted-foreground">Assigned Quantity</h4>
              <div className="text-base">
                <div>
                  {formatNumber(assignment.assignedQuantity || 0)} {assignment.assignedUnit}
                </div>
                {assignment.material?.unitType === "package" && assignment.material.packageQuantity && assignment.material.packageQuantity > 0 && (
                  <div className="text-sm text-muted-foreground mt-1">
                    ({formatNumber(assignment.assignedIndividualQuantity || (assignment.assignedQuantity || 0) * assignment.material.packageQuantity)} {assignment.material.baseUnit})
                  </div>
                )}
              </div>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-muted-foreground">Material Category</h4>
              <p>{assignment.material?.category || "Unknown"}</p>
            </div>
            {assignment.stockEntry && (
              <>
                <div>
                  <h4 className="text-sm font-semibold text-muted-foreground">Supplier</h4>
                  <p>{assignment.stockEntry.supplier}</p>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-muted-foreground">Batch Number</h4>
                  <p>{assignment.stockEntry.batchNumber || "N/A"}</p>
                </div>
              </>
            )}
          </div>
        </div>

        {assignment.notes && (
          <div className="rounded-xl border border-border bg-muted/30 p-4 shadow-sm">
            <h4 className="text-sm font-semibold text-muted-foreground mb-2">Assignment Notes</h4>
            <p className="text-sm">{assignment.notes}</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {selectedItem.type === "material" && "Material Details"}
            {selectedItem.type === "stock" && "Stock Entry Details"}
            {selectedItem.type === "section" && "Section Details"}
            {selectedItem.type === "assignment" && "Assignment Details"}
          </DialogTitle>
        </DialogHeader>
        <div className="py-4">
          {selectedItem.type === "material" && renderMaterialDetails(selectedItem.data as MaterialWithSectionAssignments)}
          {selectedItem.type === "stock" && renderStockDetails(selectedItem.data as StockEntry)}
          {selectedItem.type === "section" && renderSectionDetails(selectedItem.data as Section)}
          {selectedItem.type === "assignment" && renderAssignmentDetails(selectedItem.data as SectionAssignment & { stockEntry?: StockEntry; material?: Material; menuItem?: MenuItem })}
        </div>
      </DialogContent>

      {/* Assignment Details Dialog */}
      <Dialog open={showAssignmentDetails} onOpenChange={setShowAssignmentDetails}>
        <DialogContent className="w-[95vw] max-w-[900px] max-h-[90vh] overflow-y-auto p-6">
          <DialogHeader className="pb-4">
            <DialogTitle className="text-lg font-semibold flex items-center gap-2">
              <Package className="h-5 w-5" />
              {selectedSectionForAssignments?.name} Inventory
            </DialogTitle>
            <p className="text-sm text-muted-foreground mt-1">{selectedSectionForAssignments?.assignments.length || 0} items assigned to this section</p>
          </DialogHeader>

          <div className="space-y-4">
            {selectedSectionForAssignments?.assignments.length === 0 ? (
              <div className="text-center py-12 px-4">
                <AlertTriangle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No assignments found</h3>
                <p className="text-muted-foreground mb-4">Assign materials to this section to start tracking inventory.</p>
                {onShowAssignmentForm && (
                  <Button
                    onClick={() => {
                      onShowAssignmentForm(true);
                      setShowAssignmentDetails(false);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Assignment
                  </Button>
                )}
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center">
                  <div className="text-sm text-muted-foreground">
                    Total Value: <span className="font-semibold text-foreground">{formatCurrency(selectedSectionForAssignments?.totalValue || 0)}</span>
                  </div>
                  {onShowAssignmentForm && (
                    <Button
                      size="sm"
                      onClick={() => {
                        onShowAssignmentForm(true);
                        setShowAssignmentDetails(false);
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Assignment
                    </Button>
                  )}
                </div>

                <ScrollArea className="h-[400px] rounded-md border">
                  <Table>
                    <TableHeader className="sticky top-0 bg-background">
                      <TableRow>
                        <TableHead className="w-[200px] sm:w-[300px]">Material</TableHead>
                        <TableHead className="w-[150px] sm:w-[200px]">Quantity</TableHead>
                        <TableHead className="w-[120px] text-right">Value</TableHead>
                        <TableHead className="w-[120px] text-center">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedSectionForAssignments?.assignments.map(assignment => {
                        // Determine itemType if it's not set
                        let itemType = assignment.itemType;
                        if (!itemType) {
                          if (assignment.menuItemId && assignment.menuItem?.id) {
                            itemType = "menuItem";
                          } else if (assignment.materialId && (assignment.material?.id || assignment.stockEntry?.id)) {
                            itemType = "stockEntry";
                          }
                        }

                        const assignmentValue = itemType === "menuItem" ? assignment.menuItem?.price || 0 : (assignment.assignedQuantity || 0) * (assignment.stockEntry?.costPerPurchasedUnit || assignment.material?.costPerBaseUnit || 0);

                        return (
                          <TableRow key={assignment.id} className="hover:bg-muted/50">
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div className="min-w-0 flex-1">
                                  <div className="font-medium truncate">{itemType === "menuItem" ? assignment.menuItem?.name : assignment.material?.name || "Unknown"}</div>
                                  <div className="text-sm text-muted-foreground truncate">{itemType === "menuItem" ? assignment.menuItem?.category : assignment.material?.category || "Material"}</div>
                                </div>
                                <div className="flex gap-1">
                                  {itemType === "menuItem" && <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">Menu</span>}
                                  {itemType === "stockEntry" && <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full">Material</span>}
                                  {assignment.material?.unitType === "package" && <span className="px-2 py-1 text-xs bg-orange-100 text-orange-700 rounded-full">Package</span>}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              {itemType === "menuItem" ? (
                                <div className="text-sm">1 item</div>
                              ) : (
                                <div className="text-sm">
                                  <div>
                                    {formatNumber(assignment.assignedQuantity || 0)} {assignment.assignedUnit}
                                  </div>
                                  {assignment.material?.unitType === "package" && assignment.material.packageQuantity && assignment.material.packageQuantity > 0 && (
                                    <div className="text-xs text-muted-foreground">
                                      ({formatNumber(assignment.assignedIndividualQuantity || (assignment.assignedQuantity || 0) * assignment.material.packageQuantity)} {assignment.material.baseUnit})
                                    </div>
                                  )}
                                </div>
                              )}
                            </TableCell>
                            <TableCell className="text-right font-mono">{formatCurrency(assignmentValue)}</TableCell>
                            <TableCell>
                              <div className="flex items-center justify-center gap-1">
                                {onEditAssignment && onShowAssignmentForm && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => {
                                      onEditAssignment(assignment);
                                      onShowAssignmentForm(true);
                                      setShowAssignmentDetails(false);
                                    }}
                                    className="h-8 w-8 p-0 hover:bg-muted"
                                  >
                                    <Edit className="h-3 w-3" />
                                  </Button>
                                )}
                                {onDeleteAssignment && (
                                  <Button size="sm" variant="ghost" onClick={() => onDeleteAssignment(assignment.id)} className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive">
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
};
