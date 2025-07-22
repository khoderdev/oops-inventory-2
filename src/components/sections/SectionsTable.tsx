import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CreateSectionAssignmentData, Section, SectionAssignment, SectionWithAssignments } from "@/types/inventory";
import { formatCurrency } from "@/utils/conversionLogic";
import { AlertTriangle, Edit, Package, Plus, Trash2 } from "lucide-react";
import { memo, useCallback } from "react";
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
  handleCreateAssignment: (data: CreateSectionAssignmentData) => Promise<void>;
  setEditingAssignment: (assignment: SectionAssignment | undefined) => void;
  handleDeleteAssignment: (assignmentId: string) => void;
  isLoading?: boolean;
  createAssignment: (data: CreateSectionAssignmentData) => Promise<SectionAssignment>;
  sectionAssignments: SectionAssignment[];
}

// Memoized action buttons component for better performance
const ActionButtons = memo(({ onEdit, onDelete, onAdd, deleteTitle, deleteDescription, itemName }: { onEdit: (e?: React.MouseEvent) => void; onDelete: () => void; onAdd?: (e?: React.MouseEvent) => void; deleteTitle: string; deleteDescription: string; itemName: string }) => (
  <div className="flex items-center gap-1 sm:gap-2">
    <Button
      size="sm"
      variant="ghost"
      onClick={e => {
        e.stopPropagation();
        onEdit(e);
      }}
      className="h-8 w-8 p-0 hover:bg-muted"
      aria-label={`Edit ${itemName}`}
    >
      <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
    </Button>

    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button size="sm" variant="ghost" className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive" aria-label={`Delete ${itemName}`} onClick={e => e.stopPropagation()}>
          <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            {deleteTitle}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-left">{deleteDescription}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col-reverse sm:flex-row">
          <AlertDialogCancel className="mt-2 sm:mt-0">Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
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
        className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary"
        aria-label={`Add assignment to ${itemName}`}
      >
        <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
      </Button>
    )}
  </div>
));

ActionButtons.displayName = "ActionButtons";

export const SectionsTable = memo(({ sectionsWithAssignments, selectedSectionId, sections, setSelectedItem, setIsDetailModalOpen, setEditingSection, setShowSectionForm, handleDeleteSection, setSelectedSectionId, setShowAssignmentForm, setEditingAssignment, handleDeleteAssignment, isLoading = false }: SectionsTableProps) => {
  // Memoized callbacks for better performance
  const handleSectionRowClick = useCallback(
    (section: SectionWithAssignments) => {
      setSelectedItem({
        type: "section",
        data: section
      });
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

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-muted rounded w-1/4"></div>
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-12 bg-muted rounded"></div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      {/* Main Sections Table */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Section Inventory</CardTitle>
            </div>
            <Button size="sm" onClick={() => setShowSectionForm(true)} className="w-fit">
              <Plus className="h-4 w-4 mr-2" />
              Add Sectionsss
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {sectionsWithAssignments.length === 0 ? (
            <div className="text-center py-12 px-4">
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No sections found</h3>
              <p className="text-muted-foreground mb-4">Create your first section to start organizing your inventory.</p>
              <Button onClick={() => setShowSectionForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Sectionss
              </Button>
            </div>
          ) : (
            <ScrollArea className="h-[400px]">
              <Table>
                <TableHeader className="sticky top-0 bg-background">
                  <TableRow>
                    <TableHead className="w-[200px] sm:w-[250px]">Section</TableHead>
                    <TableHead className="hidden md:table-cell">Description</TableHead>
                    <TableHead className="w-[100px] text-center">Items</TableHead>
                    <TableHead className="w-[120px] text-right">Total Value</TableHead>
                    <TableHead className="w-[120px] text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sectionsWithAssignments.map(section => (
                    <TableRow
                      key={section.id}
                      onClick={() => handleSectionRowClick(section)}
                      className="cursor-pointer hover:bg-muted/50 transition-colors"
                      role="button"
                      tabIndex={0}
                      onKeyDown={e => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          handleSectionRowClick(section);
                        }
                      }}
                    >
                      <TableCell className="min-w-0">
                        <div className="font-medium truncate">{section.name}</div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell"></TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="font-mono">
                          {section.assignments.length}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono font-medium">{formatCurrency(section.totalValue)}</TableCell>
                      <TableCell>
                        <ActionButtons onEdit={() => handleEditSection(section)} onDelete={() => handleDeleteSection(section.id)} onAdd={() => handleAddAssignment(section.id)} deleteTitle="Delete Section" deleteDescription={`This will permanently delete the "${section.name}" section and all its assignments.`} itemName={section.name} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </>
  );
});

SectionsTable.displayName = "SectionsTable";
