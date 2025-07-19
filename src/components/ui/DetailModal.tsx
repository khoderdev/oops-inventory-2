import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Material, MaterialWithSectionAssignments, MenuItem, Section, SectionAssignment, SectionWithAssignments, StockEntry } from "@/types/inventory";
import { convertMass, convertVolume, formatCurrency, formatNumber, isMassUnit, isVolumeUnit } from "@/utils/conversionLogic";
import { getCategoryLabel } from "@/utils/getCategoryLabel";
import { AlertTriangle, Edit, Package, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

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

  // Force update when sectionsWithAssignments changes and modal is open for a section
  useEffect(() => {
    if (selectedItem && selectedItem.type === "section" && sectionsWithAssignments) {
      // Find the updated section data
      const currentSection = selectedItem.data as Section;
      const updatedSection = sectionsWithAssignments.find(s => s.id === currentSection.id);

      // Debug: Log when section assignments are updated
      if (updatedSection) {
        console.log("DetailModal: Section assignments updated", {
          sectionId: currentSection.id,
          assignmentCount: updatedSection.assignments.length,
          assignments: updatedSection.assignments.map(a => ({
            id: a.id,
            materialName: a.material?.name,
            assignedQuantity: a.assignedQuantity,
            assignedUnit: a.assignedUnit,
            updatedAt: a.updatedAt
          }))
        });
      }

      // If we have assignment details dialog open, update it too
      if (showAssignmentDetails && selectedSectionForAssignments) {
        const updatedSectionForAssignments = sectionsWithAssignments.find(s => s.id === selectedSectionForAssignments.id);
        if (updatedSectionForAssignments) {
          setSelectedSectionForAssignments(updatedSectionForAssignments);
        }
      }
    }
  }, [sectionsWithAssignments, selectedItem, showAssignmentDetails, selectedSectionForAssignments]);

  if (!selectedItem) return null;

  // Extract sections from sectionsWithAssignments for easy lookup
  const sections = sectionsWithAssignments.map(s => ({ id: s.id, name: s.name, description: s.description }));

  const renderMaterialDetails = (material: MaterialWithSectionAssignments) => {
    const materialWithAssignments = materialsWithSectionAssignments.find(m => m.id === material.id);
    const sectionAssignments = materialWithAssignments?.sectionAssignments || [];

    // Calculate correct total value using proper unit conversion
    const calculateCorrectTotalValue = () => {
      // Find all sections with assignments for this material
      const allAssignments: SectionAssignment[] = [];

      sectionsWithAssignments.forEach(section => {
        section.assignments.forEach(assignment => {
          if (assignment.materialId === material.id) {
            allAssignments.push(assignment);
          }
        });
      });

      // Calculate total value from all assignments
      let totalValue = 0;

      allAssignments.forEach(assignment => {
        if (!assignment.stockEntry || !assignment.assignedQuantity) return;

        // Try multiple cost fields
        let costPerUnit = assignment.stockEntry.costPerPurchasedUnit || 0;

        // If costPerPurchasedUnit is 0, try alternative cost calculation
        if (costPerUnit === 0 && assignment.stockEntry.totalCost && assignment.stockEntry.purchasedQuantity) {
          costPerUnit = assignment.stockEntry.totalCost / assignment.stockEntry.purchasedQuantity;
        }

        const assignedUnit = assignment.assignedUnit || "";
        const purchasedUnit = assignment.stockEntry.purchasedUnit || "";
        const assignedQuantity = assignment.assignedQuantity;

        // If units are the same, simple multiplication
        if (assignedUnit === purchasedUnit) {
          totalValue += assignedQuantity * costPerUnit;
          return;
        }

        // Convert assigned quantity to purchased unit for cost calculation
        let convertedQuantity = assignedQuantity;

        // Handle mass unit conversions
        if (isMassUnit(assignedUnit) && isMassUnit(purchasedUnit)) {
          convertedQuantity = convertMass(assignedQuantity, assignedUnit, purchasedUnit);
        }
        // Handle volume unit conversions
        else if (isVolumeUnit(assignedUnit) && isVolumeUnit(purchasedUnit)) {
          convertedQuantity = convertVolume(assignedQuantity, assignedUnit, purchasedUnit);
        }
        // Handle package unit conversions
        else if (assignment.material?.unitType === "package" && assignment.material.packageQuantity) {
          // If assigning in base unit but stock is in package unit
          if (assignedUnit === assignment.material.baseUnit && purchasedUnit === assignment.material.inputUnit) {
            convertedQuantity = assignedQuantity / assignment.material.packageQuantity;
          }
          // If assigning in package unit but stock is in base unit
          else if (assignedUnit === assignment.material.inputUnit && purchasedUnit === assignment.material.baseUnit) {
            convertedQuantity = assignedQuantity * assignment.material.packageQuantity;
          }
        }

        totalValue += convertedQuantity * costPerUnit;
      });

      return totalValue;
    };

    const correctTotalValue = calculateCorrectTotalValue();

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
              <p className="font-semibold text-foreground">
                {formatCurrency(correctTotalValue)}
                {correctTotalValue !== material.totalValue && <span className="text-xs text-muted-foreground ml-2"></span>}
              </p>
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

    // Calculate correct section total value using proper unit conversion
    const calculateSectionTotalValue = () => {
      if (!sectionWithAssignments?.assignments) return 0;

      let totalValue = 0;

      sectionWithAssignments.assignments.forEach(assignment => {
        // Handle menu item assignments
        if (assignment.itemType === "menuItem" && assignment.menuItem) {
          totalValue += assignment.menuItem.price || 0;
          return;
        }

        // Handle material assignments
        if (!assignment.stockEntry || !assignment.assignedQuantity) return;

        // Try multiple cost fields
        let costPerUnit = assignment.stockEntry.costPerPurchasedUnit || 0;

        // If costPerPurchasedUnit is 0, try alternative cost calculation
        if (costPerUnit === 0 && assignment.stockEntry.totalCost && assignment.stockEntry.purchasedQuantity) {
          costPerUnit = assignment.stockEntry.totalCost / assignment.stockEntry.purchasedQuantity;
        }

        const assignedUnit = assignment.assignedUnit || "";
        const purchasedUnit = assignment.stockEntry.purchasedUnit || "";
        const assignedQuantity = assignment.assignedQuantity;

        // If units are the same, simple multiplication
        if (assignedUnit === purchasedUnit) {
          totalValue += assignedQuantity * costPerUnit;
          return;
        }

        // Convert assigned quantity to purchased unit for cost calculation
        let convertedQuantity = assignedQuantity;

        // Handle mass unit conversions
        if (isMassUnit(assignedUnit) && isMassUnit(purchasedUnit)) {
          convertedQuantity = convertMass(assignedQuantity, assignedUnit, purchasedUnit);
        }
        // Handle volume unit conversions
        else if (isVolumeUnit(assignedUnit) && isVolumeUnit(purchasedUnit)) {
          convertedQuantity = convertVolume(assignedQuantity, assignedUnit, purchasedUnit);
        }
        // Handle package unit conversions
        else if (assignment.material?.unitType === "package" && assignment.material.packageQuantity) {
          // If assigning in base unit but stock is in package unit
          if (assignedUnit === assignment.material.baseUnit && purchasedUnit === assignment.material.inputUnit) {
            convertedQuantity = assignedQuantity / assignment.material.packageQuantity;
          }
          // If assigning in package unit but stock is in base unit
          else if (assignedUnit === assignment.material.inputUnit && purchasedUnit === assignment.material.baseUnit) {
            convertedQuantity = assignedQuantity * assignment.material.packageQuantity;
          }
        }

        totalValue += convertedQuantity * costPerUnit;
      });

      return totalValue;
    };

    const correctSectionTotalValue = calculateSectionTotalValue();

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
            <p>
              {formatCurrency(correctSectionTotalValue)}
              {correctSectionTotalValue !== (sectionWithAssignments?.totalValue || 0) && <span className="text-xs text-muted-foreground ml-2"></span>}
            </p>
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
                    <div key={`${assignment.id}-${assignment.updatedAt?.getTime()}-menu`} className="group p-3 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors relative">
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
                      {onDeleteAssignment && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="absolute top-2 right-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity bg-red-100 hover:bg-red-200 text-red-600"
                          onClick={e => {
                            e.stopPropagation();
                            onDeleteAssignment(assignment.id);
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  );
                }

                // Material/Stock Entry Assignment
                if (itemType === "stockEntry" && (assignment.material || assignment.stockEntry)) {
                  // Calculate assignment value with proper unit conversion
                  const calculateAssignmentValue = () => {
                    if (!assignment.stockEntry || !assignment.assignedQuantity) return 0;

                    // Try multiple cost fields
                    let costPerUnit = assignment.stockEntry.costPerPurchasedUnit || 0;

                    // If costPerPurchasedUnit is 0, try alternative cost calculation
                    if (costPerUnit === 0 && assignment.stockEntry.totalCost && assignment.stockEntry.purchasedQuantity) {
                      costPerUnit = assignment.stockEntry.totalCost / assignment.stockEntry.purchasedQuantity;
                    }
                    const assignedUnit = assignment.assignedUnit || "";
                    const purchasedUnit = assignment.stockEntry.purchasedUnit || "";
                    const assignedQuantity = assignment.assignedQuantity;

                    // If units are the same, simple multiplication
                    if (assignedUnit === purchasedUnit) {
                      return assignedQuantity * costPerUnit;
                    }

                    // Convert assigned quantity to purchased unit for cost calculation
                    let convertedQuantity = assignedQuantity;

                    // Handle mass unit conversions
                    if (isMassUnit(assignedUnit) && isMassUnit(purchasedUnit)) {
                      convertedQuantity = convertMass(assignedQuantity, assignedUnit, purchasedUnit);
                    }
                    // Handle volume unit conversions
                    else if (isVolumeUnit(assignedUnit) && isVolumeUnit(purchasedUnit)) {
                      convertedQuantity = convertVolume(assignedQuantity, assignedUnit, purchasedUnit);
                    }
                    // Handle package unit conversions
                    else if (assignment.material?.unitType === "package" && assignment.material.packageQuantity) {
                      // If assigning in base unit but stock is in package unit
                      if (assignedUnit === assignment.material.baseUnit && purchasedUnit === assignment.material.inputUnit) {
                        convertedQuantity = assignedQuantity / assignment.material.packageQuantity;
                      }
                      // If assigning in package unit but stock is in base unit
                      else if (assignedUnit === assignment.material.inputUnit && purchasedUnit === assignment.material.baseUnit) {
                        convertedQuantity = assignedQuantity * assignment.material.packageQuantity;
                      }
                    }

                    return convertedQuantity * costPerUnit;
                  };

                  const assignmentValue = calculateAssignmentValue();

                  // Calculate converted quantity for package units
                  const getQuantityDisplay = () => {
                    const material = assignment.material;
                    const assignedQty = assignment.assignedQuantity || 0;
                    const assignedUnit = assignment.assignedUnit || "";

                    if (material?.unitType === "package" && material.packageQuantity && material.packageQuantity > 0) {
                      // Check if we're assigning in base units (bottles) or package units (boxes)
                      const isAssigningInBaseUnit = assignedUnit === material.baseUnit;
                      const isAssigningInPackageUnit = assignedUnit === material.inputUnit;

                      if (isAssigningInBaseUnit) {
                        // Assigning in base units (e.g., 10 bottles)
                        // Use assignedIndividualQuantity if available, otherwise use assignedQty directly
                        const individualQty = assignment.assignedIndividualQuantity || assignedQty;
                        return (
                          <div className="text-sm text-green-700">
                            <div>
                              {formatNumber(assignedQty)} {assignedUnit}
                            </div>
                          </div>
                        );
                      } else if (isAssigningInPackageUnit) {
                        const individualQty = assignment.assignedIndividualQuantity || assignedQty * material.packageQuantity;
                        return (
                          <div className="text-sm text-green-700">
                            <div>
                              {formatNumber(assignedQty)} {assignedUnit}
                            </div>
                            <div className="text-xs text-green-600">
                              ({formatNumber(individualQty)} {material.baseUnit})
                            </div>
                          </div>
                        );
                      }
                    }

                    return (
                      <div className="text-sm text-green-700">
                        {formatNumber(assignedQty)} {assignedUnit}
                      </div>
                    );
                  };

                  return (
                    <div key={`${assignment.id}-${assignment.updatedAt?.getTime()}-${assignment.assignedQuantity}-${assignment.assignedUnit}`} className="group p-3 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors relative">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-lg text-green-900">{assignment.material?.name || assignment.stockEntry?.materialId || "Material"}</span>
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
                      {onDeleteAssignment && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="absolute top-2 right-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity bg-red-100 hover:bg-red-200 text-red-600"
                          onClick={e => {
                            e.stopPropagation();
                            onDeleteAssignment(assignment.id);
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  );
                }
                return (
                  <div key={`${assignment.id}-${assignment.updatedAt?.getTime()}-unknown`} className="group p-3 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors relative">
                    <div className="text-sm text-gray-600">Unknown assignment type: {assignment.itemType || "undefined"}</div>
                    {onDeleteAssignment && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute top-2 right-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity bg-red-100 hover:bg-red-200 text-red-600"
                        onClick={e => {
                          e.stopPropagation();
                          onDeleteAssignment(assignment.id);
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
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
                    {(() => {
                      const assignedUnit = assignment.assignedUnit || "";
                      const isAssigningInBaseUnit = assignedUnit === assignment.material.baseUnit;
                      const isAssigningInPackageUnit = assignedUnit === assignment.material.inputUnit;

                      if (isAssigningInBaseUnit) {
                        // Already in base units, no conversion needed
                        return null;
                      } else if (isAssigningInPackageUnit) {
                        // Convert package units to base units
                        const individualQty = assignment.assignedIndividualQuantity || (assignment.assignedQuantity || 0) * assignment.material.packageQuantity;
                        return `(${formatNumber(individualQty)} ${assignment.material.baseUnit})`;
                      }
                      return null;
                    })()}
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
                    Total Value:{" "}
                    <span className="font-semibold text-foreground">
                      {formatCurrency(
                        (() => {
                          if (!selectedSectionForAssignments?.assignments) return 0;

                          let totalValue = 0;

                          selectedSectionForAssignments.assignments.forEach(assignment => {
                            // Handle menu item assignments
                            if (assignment.itemType === "menuItem" && assignment.menuItem) {
                              totalValue += assignment.menuItem.price || 0;
                              return;
                            }

                            // Handle material assignments
                            if (!assignment.stockEntry || !assignment.assignedQuantity) return;

                            // Try multiple cost fields
                            let costPerUnit = assignment.stockEntry.costPerPurchasedUnit || 0;

                            // If costPerPurchasedUnit is 0, try alternative cost calculation
                            if (costPerUnit === 0 && assignment.stockEntry.totalCost && assignment.stockEntry.purchasedQuantity) {
                              costPerUnit = assignment.stockEntry.totalCost / assignment.stockEntry.purchasedQuantity;
                            }

                            const assignedUnit = assignment.assignedUnit || "";
                            const purchasedUnit = assignment.stockEntry.purchasedUnit || "";
                            const assignedQuantity = assignment.assignedQuantity;

                            // If units are the same, simple multiplication
                            if (assignedUnit === purchasedUnit) {
                              totalValue += assignedQuantity * costPerUnit;
                              return;
                            }

                            // Convert assigned quantity to purchased unit for cost calculation
                            let convertedQuantity = assignedQuantity;

                            // Handle mass unit conversions
                            if (isMassUnit(assignedUnit) && isMassUnit(purchasedUnit)) {
                              convertedQuantity = convertMass(assignedQuantity, assignedUnit, purchasedUnit);
                            }
                            // Handle volume unit conversions
                            else if (isVolumeUnit(assignedUnit) && isVolumeUnit(purchasedUnit)) {
                              convertedQuantity = convertVolume(assignedQuantity, assignedUnit, purchasedUnit);
                            }
                            // Handle package unit conversions
                            else if (assignment.material?.unitType === "package" && assignment.material.packageQuantity) {
                              // If assigning in base unit but stock is in package unit
                              if (assignedUnit === assignment.material.baseUnit && purchasedUnit === assignment.material.inputUnit) {
                                convertedQuantity = assignedQuantity / assignment.material.packageQuantity;
                              }
                              // If assigning in package unit but stock is in base unit
                              else if (assignedUnit === assignment.material.inputUnit && purchasedUnit === assignment.material.baseUnit) {
                                convertedQuantity = assignedQuantity * assignment.material.packageQuantity;
                              }
                            }

                            totalValue += convertedQuantity * costPerUnit;
                          });

                          return totalValue;
                        })()
                      )}
                    </span>
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

                        // Calculate assignment value with proper unit conversion
                        const calculateAssignmentValue = () => {
                          if (itemType === "menuItem") {
                            return assignment.menuItem?.price || 0;
                          }

                          if (!assignment.stockEntry || !assignment.assignedQuantity) return 0;

                          const costPerUnit = assignment.stockEntry.costPerPurchasedUnit || 0;
                          const assignedUnit = assignment.assignedUnit || "";
                          const purchasedUnit = assignment.stockEntry.purchasedUnit || "";
                          const assignedQuantity = assignment.assignedQuantity;

                          // If units are the same, simple multiplication
                          if (assignedUnit === purchasedUnit) {
                            return assignedQuantity * costPerUnit;
                          }

                          // Convert assigned quantity to purchased unit for cost calculation
                          let convertedQuantity = assignedQuantity;

                          // Handle mass unit conversions
                          if (isMassUnit(assignedUnit) && isMassUnit(purchasedUnit)) {
                            convertedQuantity = convertMass(assignedQuantity, assignedUnit, purchasedUnit);
                          }
                          // Handle volume unit conversions
                          else if (isVolumeUnit(assignedUnit) && isVolumeUnit(purchasedUnit)) {
                            convertedQuantity = convertVolume(assignedQuantity, assignedUnit, purchasedUnit);
                          }
                          // Handle package unit conversions
                          else if (assignment.material?.unitType === "package" && assignment.material.packageQuantity) {
                            // If assigning in base unit but stock is in package unit
                            if (assignedUnit === assignment.material.baseUnit && purchasedUnit === assignment.material.inputUnit) {
                              convertedQuantity = assignedQuantity / assignment.material.packageQuantity;
                            }
                            // If assigning in package unit but stock is in base unit
                            else if (assignedUnit === assignment.material.inputUnit && purchasedUnit === assignment.material.baseUnit) {
                              convertedQuantity = assignedQuantity * assignment.material.packageQuantity;
                            }
                          }

                          return convertedQuantity * costPerUnit;
                        };

                        const assignmentValue = calculateAssignmentValue();

                        return (
                          <TableRow key={`${assignment.id}-${assignment.updatedAt?.getTime()}-${assignment.assignedQuantity}-${assignment.assignedUnit}-${assignment.itemType}`} className="hover:bg-muted/50">
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
                                  {assignment.material?.unitType === "package" &&
                                    assignment.material.packageQuantity &&
                                    assignment.material.packageQuantity > 0 &&
                                    (() => {
                                      const assignedUnit = assignment.assignedUnit || "";
                                      const isAssigningInBaseUnit = assignedUnit === assignment.material.baseUnit;
                                      const isAssigningInPackageUnit = assignedUnit === assignment.material.inputUnit;

                                      if (isAssigningInBaseUnit) {
                                        // Already in base units, no conversion display needed
                                        return null;
                                      } else if (isAssigningInPackageUnit) {
                                        // Convert package units to base units
                                        const individualQty = assignment.assignedIndividualQuantity || (assignment.assignedQuantity || 0) * assignment.material.packageQuantity;
                                        return (
                                          <div className="text-xs text-muted-foreground">
                                            ({formatNumber(individualQty)} {assignment.material.baseUnit})
                                          </div>
                                        );
                                      }
                                      return null;
                                    })()}
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
