import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { Section, SectionAssignment, SectionWithAssignments } from "@/types/inventory";
import { convertMass, convertVolume, formatCurrency, formatNumber, isMassUnit, isVolumeUnit } from "@/utils/conversionLogic";
import { AlertTriangle, Edit, FileText, Package, Plus, Trash2 } from "lucide-react";
import { memo, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

interface SectionsTableProps {
  sectionsWithAssignments: SectionWithAssignments[];
  selectedSectionId: string;
  sections: Section[];
  setSelectedItem: (item: { type: string; data: SectionWithAssignments | SectionAssignment }) => void;
  setIsDetailModalOpen: (open: boolean) => void;
  setEditingSection: (section: Section | undefined) => void;
  setShowSectionForm: (show: boolean) => void;
  handleDeleteSection: (sectionId: string) => void;
  setSelectedSectionId: (id: string) => void;
  setShowAssignmentForm: (show: boolean) => void;
  setEditingAssignment: (assignment: SectionAssignment | undefined) => void;
  handleDeleteAssignment: (assignmentId: string) => void;
  isLoading?: boolean;
}

// Memoized action buttons component for better performance
const ActionButtons = memo(({ onEdit, onDelete, onAdd, deleteTitle, deleteDescription, itemName }: { onEdit: (e?: React.MouseEvent) => void; onDelete: () => void; onAdd?: (e?: React.MouseEvent) => void; deleteTitle: string; deleteDescription: string; itemName: string }) => (
  <div className="flex items-center gap-1">
    <Button
      size="sm"
      variant="ghost"
      onClick={e => {
        e.stopPropagation();
        onEdit(e);
      }}
      className={cn("h-8 w-8 p-0", "text-slate-700 dark:text-slate-200", "hover:bg-blue-100/60 dark:hover:bg-blue-900/40 hover:text-blue-600 dark:hover:text-blue-400", "transition-all duration-200 rounded-md")}
      aria-label={`Edit ${itemName}`}
    >
      <Edit className="h-4 w-4" />
    </Button>

    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button size="sm" variant="ghost" className={cn("h-8 w-8 p-0", "text-slate-700 dark:text-slate-200", "hover:bg-red-100/60 dark:hover:bg-red-900/40 hover:text-red-600 dark:hover:text-red-400", "transition-all duration-200 rounded-md")} aria-label={`Delete ${itemName}`} onClick={e => e.stopPropagation()}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="sm:max-w-md bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
            <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
            {deleteTitle}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-left text-slate-600 dark:text-slate-400">{deleteDescription}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col-reverse sm:flex-row">
          <AlertDialogCancel className="mt-2 sm:mt-0 bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-slate-100 hover:bg-slate-200 dark:hover:bg-slate-600">Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onDelete} className="bg-red-600 text-white hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600">
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    {onAdd && (
      <Button
        size="sm"
        variant="ghost"
        onClick={e => {
          e.stopPropagation();
          onAdd(e);
        }}
        className={cn("h-8 w-8 p-0", "text-slate-700 dark:text-slate-200", "hover:bg-green-100/60 dark:hover:bg-green-900/40 hover:text-green-600 dark:hover:text-green-400", "transition-all duration-200 rounded-md")}
        aria-label={`Add assignment to ${itemName}`}
      >
        <Plus className="h-4 w-4" />
      </Button>
    )}
  </div>
));

ActionButtons.displayName = "ActionButtons";

// Memoized assignment row component
const AssignmentRow = memo(({ assignment, onRowClick, onEdit, onDelete }: { assignment: SectionAssignment; onRowClick: () => void; onEdit: () => void; onDelete: () => void }) => {
  const calculatedValue = useMemo(() => {
    if (!assignment.stockEntry || !assignment.assignedQuantity) return 0;

    const costPerUnit = assignment.stockEntry.costPerPurchasedUnit ?? 0;
    const assignedUnit = assignment.assignedUnit ?? "";
    const purchasedUnit = assignment.stockEntry.purchasedUnit ?? "";
    const assignedQuantity = assignment.assignedQuantity ?? 0;

    if (assignedUnit === purchasedUnit) {
      return assignedQuantity * costPerUnit;
    }

    let convertedQuantity = assignedQuantity;

    if (isMassUnit(assignedUnit) && isMassUnit(purchasedUnit)) {
      convertedQuantity = convertMass(assignedQuantity, assignedUnit, purchasedUnit);
    } else if (isVolumeUnit(assignedUnit) && isVolumeUnit(purchasedUnit)) {
      convertedQuantity = convertVolume(assignedQuantity, assignedUnit, purchasedUnit);
    } else if (assignment.material?.unitType === "package" && assignment.material.packageQuantity) {
      if (assignedUnit === assignment.material.baseUnit && purchasedUnit === assignment.material.inputUnit) {
        convertedQuantity = assignedQuantity / assignment.material.packageQuantity;
      } else if (assignedUnit === assignment.material.inputUnit && purchasedUnit === assignment.material.baseUnit) {
        convertedQuantity = assignedQuantity * assignment.material.packageQuantity;
      }
    }

    return convertedQuantity * costPerUnit;
  }, [assignment]);

  const isPackageUnit = assignment.material?.unitType === "package";
  const displayQuantity = useMemo(() => {
    const assignedQty = assignment.assignedQuantity ?? 0;
    const assignedUnit = assignment.assignedUnit ?? "";

    if (isPackageUnit && assignment.assignedIndividualQuantity) {
      const individualQty = assignment.assignedIndividualQuantity ?? 0;
      const baseUnit = assignment.material?.baseUnit ?? "";
      return `${formatNumber(assignedQty)} ${assignedUnit} (${formatNumber(individualQty)} ${baseUnit})`;
    }
    return `${formatNumber(assignedQty)} ${assignedUnit}`;
  }, [assignment, isPackageUnit]);

  const handleEdit = useCallback(() => onEdit(), [onEdit]);
  const handleDelete = useCallback(() => onDelete(), [onDelete]);

  return (
    <TableRow
      onClick={onRowClick}
      className={cn("group transition-all duration-200", "hover:bg-gradient-to-r hover:from-blue-50/60 hover:to-indigo-50/40", "dark:hover:from-blue-900/30 dark:hover:to-indigo-900/20", "border-b border-slate-100 dark:border-slate-700")}
      role="button"
      tabIndex={0}
      onKeyDown={e => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onRowClick();
        }
      }}
    >
      <TableCell className={cn("text-xs sm:text-sm lg:text-sm", "py-3 px-2 sm:py-4 sm:px-3 lg:px-4", "border-r-2 border-slate-200 dark:border-slate-600", "transition-colors duration-200", "group-hover:border-slate-200 dark:group-hover:border-slate-500")}>
        <div className="flex items-center gap-3 min-h-[20px] sm:min-h-[24px]">
          <div className="min-w-0 flex-1">
            <div className="font-semibold text-slate-900 dark:text-slate-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{assignment.material?.name ?? "Unknown Material"}</div>
            {assignment.notes && <div className="text-xs text-slate-600 dark:text-slate-400 truncate mt-1 italic">{assignment.notes}</div>}
          </div>
          {isPackageUnit && (
            <Badge variant="secondary" className="shrink-0 bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-200 border-purple-200 dark:border-purple-700">
              <Package className="h-3 w-3 mr-1" />
              Package
            </Badge>
          )}
        </div>
      </TableCell>
      <TableCell className={cn("text-xs sm:text-sm lg:text-sm font-mono font-medium text-center", "py-3 px-2 sm:py-4 sm:px-3 lg:px-4", "border-r-2 border-slate-200 dark:border-slate-600", "transition-colors duration-200", "group-hover:border-slate-200 dark:group-hover:border-slate-500")}>
        <span className="px-2 py-1 bg-white dark:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700 shadow-sm">{displayQuantity}</span>
      </TableCell>
      <TableCell className={cn("text-xs sm:text-sm lg:text-sm font-bold text-right", "py-3 px-2 sm:py-4 sm:px-3 lg:px-4", "border-r-2 border-slate-200 dark:border-slate-600", "transition-colors duration-200", "group-hover:border-slate-200 dark:group-hover:border-slate-500", "text-green-600 dark:text-green-400")}>{formatCurrency(calculatedValue)}</TableCell>
      <TableCell className={cn("text-xs sm:text-sm lg:text-sm text-center", "py-3 px-2 sm:py-4 sm:px-3 lg:px-4", "border-r-0", "transition-colors duration-200", "group-hover:border-slate-200 dark:group-hover:border-slate-500")}>
        <div className="flex justify-center">
          <ActionButtons onEdit={handleEdit} onDelete={handleDelete} deleteTitle="Remove Assignment" deleteDescription="This will remove this item from the section but won't delete the stock entry." itemName={assignment.material?.name ?? "assignment"} />
        </div>
      </TableCell>
    </TableRow>
  );
});

AssignmentRow.displayName = "AssignmentRow";

// Mobile card view for sections and assignments
const MobileCardView = ({
  sectionsWithAssignments,
  handleSectionRowClick,
  handleEditSection,
  handleDeleteSection,
  handleAddAssignment,
  handleAssignmentRowClick,
  handleEditAssignment,
  handleDeleteAssignment
}: {
  sectionsWithAssignments: SectionWithAssignments[];
  handleSectionRowClick: (section: SectionWithAssignments) => void;
  handleEditSection: (section: Section) => void;
  handleDeleteSection: (sectionId: string) => void;
  handleAddAssignment: (sectionId: string) => void;
  handleAssignmentRowClick: (assignment: SectionAssignment) => void;
  handleEditAssignment: (assignment: SectionAssignment) => void;
  handleDeleteAssignment: (assignmentId: string) => void;
}) => (
  <div className="block sm:hidden space-y-4 p-4">
    {sectionsWithAssignments.map(section => (
      <div key={section.id} className={cn("bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4 shadow-sm", "hover:shadow-md transition-shadow duration-200")}>
        <div className="space-y-3">
          <div className="flex justify-between items-center py-1">
            <span className="text-sm font-medium text-slate-600 dark:text-slate-400 truncate pr-3 cursor-pointer" onClick={() => handleSectionRowClick(section)}>
              Section:
            </span>
            <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex-shrink-0">{section.name}</div>
          </div>
          <div className="flex justify-between items-center py-1">
            <span className="text-sm font-medium text-slate-600 dark:text-slate-400 truncate pr-3">Items:</span>
            <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex-shrink-0">{section.assignments.length}</div>
          </div>
          <div className="flex justify-between items-center py-1">
            <span className="text-sm font-medium text-slate-600 dark:text-slate-400 truncate pr-3">Total Value:</span>
            <div className="text-sm font-semibold text-green-600 dark:text-green-400 flex-shrink-0">{formatCurrency(section.totalValue)}</div>
          </div>
          <div className="flex justify-end">
            <ActionButtons onEdit={() => handleEditSection(section)} onDelete={() => handleDeleteSection(section.id)} onAdd={() => handleAddAssignment(section.id)} deleteTitle="Delete Section" deleteDescription={`This will permanently delete the "${section.name}" section and all its assignments.`} itemName={section.name} />
          </div>
          {section.assignments.length > 0 && (
            <div className="mt-4 space-y-4">
              <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Assignments</h4>
              {section.assignments.map(assignment => (
                <div key={assignment.id} className={cn("bg-slate-50 dark:bg-slate-900 rounded-md border border-slate-200 dark:border-slate-700 p-3", "hover:shadow-sm transition-shadow duration-200")}>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center py-1">
                      <span className="text-sm font-medium text-slate-600 dark:text-slate-400 truncate pr-3 cursor-pointer" onClick={() => handleAssignmentRowClick(assignment)}>
                        Material:
                      </span>
                      <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex-shrink-0">{assignment.material?.name ?? "Unknown Material"}</div>
                    </div>
                    {assignment.notes && <div className="text-xs text-slate-600 dark:text-slate-400 truncate italic">{assignment.notes}</div>}
                    <div className="flex justify-between items-center py-1">
                      <span className="text-sm font-medium text-slate-600 dark:text-slate-400 truncate pr-3">Quantity:</span>
                      <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex-shrink-0 font-mono">
                        {(() => {
                          const assignedQty = assignment.assignedQuantity ?? 0;
                          const assignedUnit = assignment.assignedUnit ?? "";
                          const isPackageUnit = assignment.material?.unitType === "package";
                          if (isPackageUnit && assignment.assignedIndividualQuantity) {
                            const individualQty = assignment.assignedIndividualQuantity ?? 0;
                            const baseUnit = assignment.material?.baseUnit ?? "";
                            return `${formatNumber(assignedQty)} ${assignedUnit} (${formatNumber(individualQty)} ${baseUnit})`;
                          }
                          return `${formatNumber(assignedQty)} ${assignedUnit}`;
                        })()}
                      </div>
                    </div>
                    <div className="flex justify-between items-center py-1">
                      <span className="text-sm font-medium text-slate-600 dark:text-slate-400 truncate pr-3">Value:</span>
                      <div className="text-sm font-semibold text-green-600 dark:text-green-400 flex-shrink-0">
                        {formatCurrency(
                          (() => {
                            if (!assignment.stockEntry || !assignment.assignedQuantity) return 0;
                            const costPerUnit = assignment.stockEntry.costPerPurchasedUnit ?? 0;
                            const assignedUnit = assignment.assignedUnit ?? "";
                            const purchasedUnit = assignment.stockEntry.purchasedUnit ?? "";
                            const assignedQuantity = assignment.assignedQuantity ?? 0;
                            if (assignedUnit === purchasedUnit) {
                              return assignedQuantity * costPerUnit;
                            }
                            let convertedQuantity = assignedQuantity;
                            if (isMassUnit(assignedUnit) && isMassUnit(purchasedUnit)) {
                              convertedQuantity = convertMass(assignedQuantity, assignedUnit, purchasedUnit);
                            } else if (isVolumeUnit(assignedUnit) && isVolumeUnit(purchasedUnit)) {
                              convertedQuantity = convertVolume(assignedQuantity, assignedUnit, purchasedUnit);
                            } else if (assignment.material?.unitType === "package" && assignment.material.packageQuantity) {
                              if (assignedUnit === assignment.material.baseUnit && purchasedUnit === assignment.material.inputUnit) {
                                convertedQuantity = assignedQuantity / assignment.material.packageQuantity;
                              } else if (assignedUnit === assignment.material.inputUnit && purchasedUnit === assignment.material.baseUnit) {
                                convertedQuantity = assignedQuantity * assignment.material.packageQuantity;
                              }
                            }
                            return convertedQuantity * costPerUnit;
                          })()
                        )}
                      </div>
                    </div>
                    {assignment.material?.unitType === "package" && (
                      <div className="flex justify-between items-center py-1">
                        <span className="text-sm font-medium text-slate-600 dark:text-slate-400 truncate pr-3">Type:</span>
                        <Badge variant="secondary" className="shrink-0 bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-200 border-purple-200 dark:border-purple-700">
                          <Package className="h-3 w-3 mr-1" />
                          Package
                        </Badge>
                      </div>
                    )}
                    <div className="flex justify-end">
                      <ActionButtons onEdit={() => handleEditAssignment(assignment)} onDelete={() => handleDeleteAssignment(assignment.id)} deleteTitle="Remove Assignment" deleteDescription="This will remove this item from the section but won't delete the stock entry." itemName={assignment.material?.name ?? "assignment"} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    ))}
  </div>
);

// Main SectionsTable component
export const SectionsTable = memo(({ sectionsWithAssignments, selectedSectionId, sections, setSelectedItem, setIsDetailModalOpen, setEditingSection, setShowSectionForm, handleDeleteSection, setSelectedSectionId, setShowAssignmentForm, setEditingAssignment, handleDeleteAssignment, isLoading = false }: SectionsTableProps) => {
  // Memoized callbacks for better performance
  const handleSectionRowClick = useCallback(
    (section: SectionWithAssignments) => {
      setSelectedItem({ type: "section", data: section });
      setIsDetailModalOpen(true);
    },
    [setSelectedItem, setIsDetailModalOpen]
  );

  const handleAssignmentRowClick = useCallback(
    (assignment: SectionAssignment) => {
      setSelectedItem({ type: "assignment", data: assignment });
      setIsDetailModalOpen(true);
    },
    [setSelectedItem, setIsDetailModalOpen]
  );

  const handleEditSection = useCallback(
    (section: Section) => {
      setEditingSection(section);
      setShowSectionForm(true);
    },
    [setEditingSection, setShowSectionForm]
  );

  const handleAddAssignment = useCallback(
    (sectionId: string) => {
      setSelectedSectionId(sectionId);
      setShowAssignmentForm(true);
    },
    [setSelectedSectionId, setShowAssignmentForm]
  );

  const handleEditAssignment = useCallback(
    (assignment: SectionAssignment) => {
      setEditingAssignment(assignment);
      setShowAssignmentForm(true);
    },
    [setEditingAssignment, setShowAssignmentForm]
  );

  const selectedSection = useMemo(() => {
    return selectedSectionId ? sectionsWithAssignments.find(s => s.id === selectedSectionId) : null;
  }, [selectedSectionId, sectionsWithAssignments]);

  const selectedSectionName = useMemo(() => {
    return sections.find(s => s.id === selectedSectionId)?.name ?? "Unknown Section";
  }, [sections, selectedSectionId]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] text-center bg-gradient-to-br from-muted/30 to-muted/10 rounded-lg border-2 border-dashed border-muted-foreground/20">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-muted rounded w-1/4"></div>
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-12 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (sectionsWithAssignments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] text-center bg-gradient-to-br from-muted/30 to-muted/10 rounded-lg border-2 border-dashed border-muted-foreground/20">
        <div className="relative mb-6">
          <div className="rounded-full bg-gradient-to-br from-blue-50 to-indigo-50 p-4 shadow-lg">
            <Package className="h-8 w-8 text-blue-600" />
          </div>
          <div className="absolute -top-1 -right-1 rounded-full bg-yellow-100 p-1">
            <FileText className="h-4 w-4 text-yellow-600" />
          </div>
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-3">No Sections Available</h3>
        <p className="text-sm text-muted-foreground/80 max-w-md leading-relaxed mb-4">No sections found. Create your first section to start organizing your inventory.</p>
        <Button onClick={() => setShowSectionForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Section
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-card rounded-lg overflow-hidden">
      {/* Mobile View */}
      <MobileCardView sectionsWithAssignments={sectionsWithAssignments} handleSectionRowClick={handleSectionRowClick} handleEditSection={handleEditSection} handleDeleteSection={handleDeleteSection} handleAddAssignment={handleAddAssignment} handleAssignmentRowClick={handleAssignmentRowClick} handleEditAssignment={handleEditAssignment} handleDeleteAssignment={handleDeleteAssignment} />

      {/* Desktop View */}
      <div className="hidden sm:flex flex-col h-full">
        <CardHeader className="bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-800 dark:to-gray-800 px-3 sm:px-4 py-3 sm:py-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Package className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                Section Inventory
              </CardTitle>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">Manage and organize your inventory by sections</p>
            </div>
            <Button size="sm" onClick={() => setShowSectionForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Section
            </Button>
          </div>
        </CardHeader>

        <Card className="flex-1 bg-transparent border-0 shadow-none">
          <CardContent className="p-0">
            <div className={cn("h-full overflow-auto", "scrollbar-thin scrollbar-track-slate-100 scrollbar-thumb-slate-300 hover:scrollbar-thumb-slate-400", "dark:scrollbar-track-slate-800 dark:scrollbar-thumb-slate-600", "scroll-smooth")} style={{ maxHeight: "calc(100vh - 200px)", minHeight: "300px" }}>
              <Table className="w-full table-fixed min-w-[800px]" style={{ tableLayout: "fixed" }}>
                <TableHeader className="sticky top-0 z-10 bg-white dark:bg-card shadow-sm backdrop-blur-sm">
                  <TableRow className="border-b-2 border-slate-200 dark:border-slate-700 hover:bg-transparent bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-800 dark:to-gray-800">
                    <TableHead className={cn("font-bold text-xs sm:text-sm lg:text-sm", "text-slate-700 dark:text-slate-200", "py-3 px-2 sm:py-4 sm:px-3 lg:px-4", "border-r border-slate-200 dark:border-slate-600", "transition-colors hover:bg-slate-100/50 dark:hover:bg-slate-700/50")} style={{ width: "250px" }}>
                      <div className="flex items-center gap-2 min-h-[24px]">
                        <span className="truncate font-bold leading-tight">Section</span>
                      </div>
                    </TableHead>

                    <TableHead className={cn("font-bold text-xs sm:text-sm lg:text-sm text-center", "text-slate-700 dark:text-slate-200", "py-3 px-2 sm:py-4 sm:px-3 lg:px-4", "border-r border-slate-200 dark:border-slate-600", "transition-colors hover:bg-slate-100/50 dark:hover:bg-slate-700/50")} style={{ width: "100px" }}>
                      <div className="flex items-center gap-2 min-h-[24px] justify-center">
                        <span className="truncate font-bold leading-tight">Items</span>
                      </div>
                    </TableHead>

                    <TableHead className={cn("font-bold text-xs sm:text-sm lg:text-sm text-right", "text-slate-700 dark:text-slate-200", "py-3 px-2 sm:py-4 sm:px-3 lg:px-4", "border-r border-slate-200 dark:border-slate-600", "transition-colors hover:bg-slate-100/50 dark:hover:bg-slate-700/50")} style={{ width: "120px" }}>
                      <div className="flex items-center gap-2 min-h-[24px] justify-end">
                        <span className="truncate font-bold leading-tight">Total Value</span>
                      </div>
                    </TableHead>

                    <TableHead className={cn("font-bold text-xs sm:text-sm lg:text-sm text-center", "text-slate-700 dark:text-slate-200", "py-3 px-2 sm:py-4 sm:px-3 lg:px-4", "transition-colors hover:bg-slate-100/50 dark:hover:bg-slate-700/50")} style={{ width: "120px" }}>
                      <div className="flex items-center gap-2 min-h-[24px] justify-center">
                        <span className="truncate font-bold leading-tight">Actions</span>
                      </div>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sectionsWithAssignments.map((section, index) => (
                    <TableRow
                      key={section.id}
                      onClick={() => handleSectionRowClick(section)}
                      className={cn("group transition-all duration-200 cursor-pointer", "hover:bg-gradient-to-r hover:from-blue-50/60 hover:to-indigo-50/40", "dark:hover:from-blue-900/30 dark:hover:to-indigo-900/20", "border-b border-slate-100 dark:border-slate-700", "hover:shadow-sm", index % 2 === 0 && "bg-slate-50/30 dark:bg-slate-800/30")}
                      role="button"
                      tabIndex={0}
                      onKeyDown={e => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          handleSectionRowClick(section);
                        }
                      }}
                    >
                      <TableCell className={cn("text-xs sm:text-sm lg:text-sm", "py-3 px-2 sm:py-4 sm:px-3 lg:px-4", "border-r border-slate-200 dark:border-slate-600", "transition-colors duration-200")} style={{ width: "250px" }}>
                        <div className="font-semibold text-slate-900 dark:text-slate-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{section.name}</div>
                      </TableCell>

                      <TableCell className={cn("text-xs sm:text-sm lg:text-sm text-center", "py-3 px-2 sm:py-4 sm:px-3 lg:px-4", "border-r border-slate-200 dark:border-slate-600", "transition-colors duration-200")} style={{ width: "100px" }}>
                        <Badge variant="outline" className="font-mono bg-blue-50 text-blue-700 dark:bg-blue-900 dark:text-blue-200 border-blue-200 dark:border-blue-700 px-2 py-1 text-xs">
                          {section.assignments.length}
                        </Badge>
                      </TableCell>

                      <TableCell className={cn("text-xs sm:text-sm lg:text-sm font-semibold text-right", "py-3 px-2 sm:py-4 sm:px-3 lg:px-4", "border-r border-slate-200 dark:border-slate-600", "transition-colors duration-200", "text-green-600 dark:text-green-400")} style={{ width: "120px" }}>
                        {formatCurrency(section.totalValue)}
                      </TableCell>

                      <TableCell className={cn("text-xs sm:text-sm lg:text-sm text-center", "py-3 px-2 sm:py-4 sm:px-3 lg:px-4", "transition-colors duration-200")} style={{ width: "120px" }}>
                        <div className="flex justify-center">
                          <ActionButtons onEdit={() => handleEditSection(section)} onDelete={() => handleDeleteSection(section.id)} onAdd={() => handleAddAssignment(section.id)} deleteTitle="Delete Section" deleteDescription={`This will permanently delete the "${section.name}" section and all its assignments.`} itemName={section.name} />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Selected Section Details */}
        {selectedSection && (
          <Card className="mt-6 bg-transparent border-0 shadow-none">
            <CardHeader className="bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-800 dark:to-gray-800 border-b-2 border-primary/20 px-3 sm:px-4 py-2 sm:py-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Package className="h-6 w-6 text-green-600 dark:text-green-400" />
                    {selectedSectionName} - Items
                  </CardTitle>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-2 flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 dark:bg-blue-900 dark:text-blue-200 border-blue-200 dark:border-blue-700">
                        {selectedSection.assignments.length}
                      </Badge>
                      items
                    </span>
                    <span className="flex items-center gap-1">
                      Total value:
                      <span className="font-bold text-green-600 dark:text-green-400">{formatCurrency(selectedSection.totalValue)}</span>
                    </span>
                  </p>
                </div>
                <Button size="sm" onClick={() => handleAddAssignment(selectedSectionId)} className="shrink-0 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {selectedSection.assignments.length === 0 ? (
                <div className="flex flex-col items-center justify-center min-h-[200px] text-center bg-gradient-to-br from-muted/30 to-muted/10 rounded-lg border-2 border-dashed border-muted-foreground/20">
                  <div className="relative mb-6">
                    <div className="rounded-full bg-gradient-to-br from-blue-50 to-indigo-50 p-4 shadow-lg">
                      <Package className="h-8 w-8 text-blue-600" />
                    </div>
                    <div className="absolute -top-1 -right-1 rounded-full bg-yellow-100 p-1">
                      <FileText className="h-4 w-4 text-yellow-600" />
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-3">No Items Assigned</h3>
                  <p className="text-sm text-muted-foreground/80 max-w-md leading-relaxed mb-4">Add items to this section to start organizing your inventory.</p>
                  <Button onClick={() => handleAddAssignment(selectedSectionId)} className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Item
                  </Button>
                </div>
              ) : (
                <div className={cn("h-full overflow-auto", "scrollbar-thin scrollbar-track-slate-100 scrollbar-thumb-slate-300 hover:scrollbar-thumb-slate-400", "dark:scrollbar-track-slate-800 dark:scrollbar-thumb-slate-600", "scroll-smooth")} style={{ maxHeight: "300px" }}>
                  <Table className="w-full table-fixed min-w-[800px]" style={{ tableLayout: "fixed" }}>
                    <TableHeader className="sticky top-0 z-30 bg-white dark:bg-card shadow-sm backdrop-blur-sm">
                      <TableRow className="border-b-2 border-primary/20 hover:bg-transparent bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-800 dark:to-gray-800">
                        <TableHead className={cn("font-bold text-xs sm:text-sm lg:text-sm", "text-slate-700 dark:text-slate-200", "py-3 px-2 sm:py-4 sm:px-3 lg:px-4", "border-r-2 border-slate-300 dark:border-slate-600", "transition-colors hover:bg-slate-100/50 dark:hover:bg-slate-700/50", "bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-800 dark:to-gray-800", "rounded-tl-lg")} style={{ width: "250px" }}>
                          <div className="flex items-center gap-1 sm:gap-2 min-h-[20px] sm:min-h-[24px]">
                            <span className="truncate font-bold leading-tight flex-1">Material</span>
                          </div>
                        </TableHead>
                        <TableHead className={cn("font-bold text-xs sm:text-sm lg:text-sm text-center", "text-slate-700 dark:text-slate-200", "py-3 px-2 sm:py-4 sm:px-3 lg:px-4", "border-r-2 border-slate-300 dark:border-slate-600", "transition-colors hover:bg-slate-100/50 dark:hover:bg-slate-700/50", "bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-800 dark:to-gray-800")} style={{ width: "150px" }}>
                          <div className="flex items-center gap-1 sm:gap-2 min-h-[20px] sm:min-h-[24px] justify-center">
                            <span className="truncate font-bold leading-tight flex-1">Quantity</span>
                            <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-blue-500 flex-shrink-0" />
                          </div>
                        </TableHead>
                        <TableHead className={cn("font-bold text-xs sm:text-sm lg:text-sm text-right", "text-slate-700 dark:text-slate-200", "py-3 px-2 sm:py-4 sm:px-3 lg:px-4", "border-r-2 border-slate-300 dark:border-slate-600", "transition-colors hover:bg-slate-100/50 dark:hover:bg-slate-700/50", "bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-800 dark:to-gray-800")} style={{ width: "120px" }}>
                          <div className="flex items-center gap-1 sm:gap-2 min-h-[20px] sm:min-h-[24px] justify-end">
                            <span className="truncate font-bold leading-tight flex-1">Value</span>
                            <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-blue-500 flex-shrink-0" />
                          </div>
                        </TableHead>
                        <TableHead className={cn("font-bold text-xs sm:text-sm lg:text-sm text-center", "text-slate-700 dark:text-slate-200", "py-3 px-2 sm:py-4 sm:px-3 lg:px-4", "border-r-0", "transition-colors hover:bg-slate-100/50 dark:hover:bg-slate-700/50", "bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-800 dark:to-gray-800", "rounded-tr-lg")} style={{ width: "120px" }}>
                          <div className="flex items-center gap-1 sm:gap-2 min-h-[20px] sm:min-h-[24px] justify-center">
                            <span className="truncate font-bold leading-tight flex-1">Actions</span>
                          </div>
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedSection.assignments.map((assignment, index) => (
                        <AssignmentRow key={assignment.id} assignment={assignment} onRowClick={() => handleAssignmentRowClick(assignment)} onEdit={() => handleEditAssignment(assignment)} onDelete={() => handleDeleteAssignment(assignment.id)} />
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <div className="flex-shrink-0 bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-800 dark:to-gray-800 border-t-2 border-primary/20 px-3 sm:px-4 py-2 sm:py-3 rounded-b-lg">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
              <span className="flex items-center gap-1 font-medium">
                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                <span className="text-xs sm:text-sm">
                  {sectionsWithAssignments.length} {sectionsWithAssignments.length === 1 ? "section" : "sections"}
                </span>
              </span>
              <span className="flex items-center gap-1 font-medium">
                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                <span className="text-xs sm:text-sm">
                  {sectionsWithAssignments.reduce((sum, section) => sum + section.assignments.length, 0)} {sectionsWithAssignments.reduce((sum, section) => sum + section.assignments.length, 0) === 1 ? "assignment" : "assignments"}
                </span>
              </span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-xs">
              <span className="flex items-center gap-1">
                <span className="w-1 h-1 rounded-full bg-blue-500"></span>
                <span>Numeric data</span>
              </span>
              <span className="font-mono text-xs bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded">SECTION INVENTORY</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

SectionsTable.displayName = "SectionsTable";
