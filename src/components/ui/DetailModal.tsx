import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Material, MaterialWithSectionAssignments, MenuItem, Section, SectionAssignment, SectionWithAssignments, StockEntry } from "@/types/inventory";
import { convertMass, convertVolume, formatCurrency, formatNumber, isMassUnit, isVolumeUnit } from "@/utils/conversionLogic";
import { getCategoryLabel } from "@/utils/getCategoryLabel";
import { AlertTriangle, Edit, Package, Plus, Trash2 } from "lucide-react";
import { useEffect, useState, useMemo, useCallback } from "react";

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
  onAddAssignment?: (sectionId: string) => void;
  onEditAssignment?: (assignment: SectionAssignment) => void;
  onDeleteAssignment?: (assignmentId: string) => void;
}

export const DetailModal = ({ isOpen, onClose, selectedItem, materialsWithSectionAssignments, sectionsWithAssignments, onShowAssignmentForm, onAddAssignment, onEditAssignment, onDeleteAssignment }: DetailModalProps) => {
  const [showAssignmentDetails, setShowAssignmentDetails] = useState(false);
  const [selectedSectionForAssignments, setSelectedSectionForAssignments] = useState<SectionWithAssignments | null>(null);
  const [forceUpdateKey, setForceUpdateKey] = useState(0);
  const [lastAssignmentCount, setLastAssignmentCount] = useState(0);
  const [lastAssignmentDataHash, setLastAssignmentDataHash] = useState("");

  // Memoize the current section data to ensure we always have the latest version
  const currentSectionData = useMemo(() => {
    if (selectedItem && selectedItem.type === "section") {
      const currentSection = selectedItem.data as Section;
      return sectionsWithAssignments.find(s => s.id === currentSection.id) || null;
    }
    return null;
  }, [selectedItem, sectionsWithAssignments]);

  // Create a hash of assignment data to detect deep changes
  const createAssignmentDataHash = useCallback((assignments: SectionAssignment[]) => {
    try {
      const hashData = assignments.map(a => ({
        id: a.id,
        materialName: a.material?.name || a.menuItem?.name,
        assignedQuantity: a.assignedQuantity,
        assignedUnit: a.assignedUnit,
        itemType: a.itemType
      }));
      return JSON.stringify(hashData);
    } catch {
      return `${assignments.length}-${Date.now()}`;
    }
  }, []);

  // Enhanced state synchronization effect with deep change detection
  useEffect(() => {
    if (selectedItem && selectedItem.type === "section" && sectionsWithAssignments && isOpen && currentSectionData) {
      const currentSection = selectedItem.data as Section;
      const currentAssignmentCount = currentSectionData.assignments.length;
      const currentAssignmentHash = createAssignmentDataHash(currentSectionData.assignments);
      
      // Detect when assignments have been added, removed, or changed
      const countChanged = currentAssignmentCount !== lastAssignmentCount;
      const dataChanged = currentAssignmentHash !== lastAssignmentDataHash;
      
      if (countChanged || dataChanged) {
        console.log("DetailModal: Assignment data changed", {
          sectionId: currentSection.id,
          previousCount: lastAssignmentCount,
          currentCount: currentAssignmentCount,
          countChanged,
          dataChanged,
          assignments: currentSectionData.assignments.map(a => ({
            id: a.id,
            materialName: a.material?.name || a.menuItem?.name,
            assignedQuantity: a.assignedQuantity,
            assignedUnit: a.assignedUnit,
            itemType: a.itemType,
            updatedAt: a.updatedAt
          }))
        });

        setLastAssignmentCount(currentAssignmentCount);
        setLastAssignmentDataHash(currentAssignmentHash);
        setForceUpdateKey(prev => prev + 1);
      }

      // If we have assignment details dialog open, update it too
      if (showAssignmentDetails && selectedSectionForAssignments) {
        const updatedSectionForAssignments = sectionsWithAssignments.find(s => s.id === selectedSectionForAssignments.id);
        if (updatedSectionForAssignments) {
          setSelectedSectionForAssignments(updatedSectionForAssignments);
        }
      }
    }
  }, [selectedItem, sectionsWithAssignments, isOpen, currentSectionData, lastAssignmentCount, lastAssignmentDataHash, showAssignmentDetails, selectedSectionForAssignments, createAssignmentDataHash]);

  // Initialize assignment data when modal opens
  useEffect(() => {
    if (isOpen && selectedItem && selectedItem.type === "section" && currentSectionData) {
      const initialCount = currentSectionData.assignments.length;
      const initialHash = createAssignmentDataHash(currentSectionData.assignments);
      
      setLastAssignmentCount(initialCount);
      setLastAssignmentDataHash(initialHash);
      setForceUpdateKey(0);
    } else if (!isOpen) {
      // Reset states when modal closes
      setForceUpdateKey(0);
      setLastAssignmentCount(0);
      setLastAssignmentDataHash("");
    }
  }, [isOpen, selectedItem, currentSectionData, createAssignmentDataHash]);

  // Additional effect to detect prop changes and force updates with multiple intervals
  useEffect(() => {
    if (isOpen && selectedItem && selectedItem.type === "section") {
      // Use multiple timeouts to catch async updates at different intervals
      const timeouts = [50, 100, 200, 300].map(delay => 
        setTimeout(() => {
          setForceUpdateKey(prev => prev + 1);
        }, delay)
      );

      return () => timeouts.forEach(clearTimeout);
    }
  }, [sectionsWithAssignments, isOpen, selectedItem]);

  // Handler for adding new assignments with state sync
  const handleAddAssignment = useCallback(() => {
    const currentSection = selectedItem?.data as Section;
    console.log("DetailModal: Add Assignment button clicked", {
      sectionId: currentSection?.id,
      sectionName: currentSection?.name,
      onShowAssignmentFormExists: !!onShowAssignmentForm,
      onAddAssignmentExists: !!onAddAssignment,
      selectedItem: selectedItem
    });
    
    if (onAddAssignment && currentSection?.id) {
      console.log("DetailModal: Using onAddAssignment with sectionId:", currentSection.id);
      onAddAssignment(currentSection.id);
      setShowAssignmentDetails(false);
      // Force update after a short delay to catch any state changes
      setTimeout(() => setForceUpdateKey(prev => prev + 1), 50);
    } else if (onShowAssignmentForm) {
      console.log("DetailModal: Falling back to onShowAssignmentForm(true)");
      onShowAssignmentForm(true);
      setShowAssignmentDetails(false);
      // Force update after a short delay to catch any state changes
      setTimeout(() => setForceUpdateKey(prev => prev + 1), 50);
    } else {
      console.log("DetailModal: No assignment form callbacks available");
    }
  }, [onShowAssignmentForm, onAddAssignment, selectedItem]);

  // Handler for deleting assignments with immediate UI update
  const handleDeleteAssignment = useCallback((assignmentId: string) => {
    if (onDeleteAssignment) {
      onDeleteAssignment(assignmentId);
      // Force immediate update
      setForceUpdateKey(prev => prev + 1);
      // Update assignment count and hash to reflect deletion
      if (currentSectionData) {
        const newCount = Math.max(0, currentSectionData.assignments.length - 1);
        setLastAssignmentCount(newCount);
        // Update hash for remaining assignments
        const remainingAssignments = currentSectionData.assignments.filter(a => a.id !== assignmentId);
        setLastAssignmentDataHash(createAssignmentDataHash(remainingAssignments));
      }
    }
  }, [onDeleteAssignment, currentSectionData, createAssignmentDataHash]);

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
    // Use the memoized current section data to ensure we have the latest assignments
    const sectionWithAssignments = currentSectionData || sectionsWithAssignments.find(s => s.id === section.id);

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
      <div className="space-y-4" key={`section-${section.id}-${forceUpdateKey}`}>
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
              {onShowAssignmentForm && (
                <Button onClick={handleAddAssignment}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Assignment
                </Button>
              )}
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
                
                // Use a more reliable key that includes the force update key
                const assignmentKey = `${assignment.id}-${index}-${forceUpdateKey}`;
                
                // Menu Item Assignment
                if (itemType === "menuItem" && assignment.menuItem) {
                  return (
                    <div key={assignmentKey} className="group p-3 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors relative">
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
                            handleDeleteAssignment(assignment.id);
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
                    <div key={assignmentKey} className="group p-3 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors relative">
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
                            handleDeleteAssignment(assignment.id);
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  );
                }
                return (
                  <div key={assignmentKey} className="group p-3 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors relative">
                    <div className="text-sm text-gray-600">Unknown assignment type: {assignment.itemType || "undefined"}</div>
                    {onDeleteAssignment && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute top-2 right-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity bg-red-100 hover:bg-red-200 text-red-600"
                        onClick={e => {
                          e.stopPropagation();
                          handleDeleteAssignment(assignment.id);
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
    </Dialog>
  );
};
