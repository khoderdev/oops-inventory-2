import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Material, Section, SectionAssignment, SectionWithAssignments, StockEntry } from "@/types/inventory";
import { formatCurrency, formatNumber } from "@/utils/conversionLogic";
import { getConversionFactor } from "@/utils/getConversionFactor";
import { Edit, Plus, Trash2 } from "lucide-react";

interface SectionsTableProps {
  sectionsWithAssignments: SectionWithAssignments[];
  selectedSectionId: string;
  sections: Section[];
  setSelectedItem: (item: { type: "material" | "stock" | "section" | "assignment"; data: Material | StockEntry | Section | SectionAssignment }) => void;
  setIsDetailModalOpen: (open: boolean) => void;
  setEditingSection: (section: Section | undefined) => void;
  setShowSectionForm: (show: boolean) => void;
  handleDeleteSection: (sectionId: string) => void;
  setSelectedSectionId: (id: string) => void;
  setShowAssignmentForm: (show: boolean) => void;
  setEditingAssignment: (assignment: SectionAssignment | undefined) => void;
  handleDeleteAssignment: (assignmentId: string) => void;
}

export function SectionsTable({ sectionsWithAssignments, selectedSectionId, sections, setSelectedItem, setIsDetailModalOpen, setEditingSection, setShowSectionForm, handleDeleteSection, setSelectedSectionId, setShowAssignmentForm, setEditingAssignment, handleDeleteAssignment }: SectionsTableProps) {
  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Section Inventory</CardTitle>
            <Button size="sm" onClick={() => setShowSectionForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Section
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Section</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Assigned Items</TableHead>
                  <TableHead>Total Value</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sectionsWithAssignments.map(section => (
                  <TableRow
                    key={section.id}
                    onClick={() => {
                      setSelectedItem({
                        type: "section",
                        data: section
                      });
                      setIsDetailModalOpen(true);
                    }}
                    className="cursor-pointer hover:bg-muted/50"
                  >
                    <TableCell className="font-medium">{section.name}</TableCell>
                    <TableCell>{section.description}</TableCell>
                    <TableCell>{section.assignments.length}</TableCell>
                    <TableCell>{formatCurrency(section.totalValue)}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={e => {
                            e.stopPropagation();
                            setEditingSection(section);
                            setShowSectionForm(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="outline">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Section</AlertDialogTitle>
                              <AlertDialogDescription>This will permanently delete the "{section.name}" section and all its assignments.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteSection(section.id)}>Delete</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={e => {
                            e.stopPropagation();
                            setSelectedSectionId(section.id);
                            setShowAssignmentForm(true);
                          }}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {selectedSectionId && (
        <Card>
          <CardHeader>
            <CardTitle>{sections.find(s => s.id === selectedSectionId)?.name} Inventory</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Assigned Quantity</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sectionsWithAssignments
                  .find(s => s.id === selectedSectionId)
                  ?.assignments.map(assignment => {
                    // Detect assignment type based on populated properties
                    const isMenuItem = assignment.menuItem != null;
                    const isMaterialAssignment = assignment.material != null && assignment.stockEntry != null;

                    let name = "Unknown";
                    let quantity = assignment.assignedQuantity || 0;
                    let unit = assignment.assignedUnit || "N/A";
                    let value = 0;

                    if (isMaterialAssignment) {
                      const costPerUnit = assignment.stockEntry?.costPerPurchasedUnit || 0;
                      const fromUnit = assignment.assignedUnit || "unit";
                      const toUnit = assignment.stockEntry?.purchasedUnit || fromUnit;
                      const unitType = assignment.material?.unitType || "piece";
                      const conversionFactor = getConversionFactor(fromUnit, toUnit, unitType);
                      value = quantity * costPerUnit * conversionFactor;
                      name = assignment.material?.name || "Unknown";
                    }

                    if (isMenuItem) {
                      name = assignment.menuItem?.name || "Unknown";
                      value = assignment.menuItem?.price || 0;
                      quantity = 1; // Menu items are typically counted as 1 item
                      unit = "item";
                    }

                    return (
                      <TableRow
                        key={assignment.id}
                        onClick={() => {
                          setSelectedItem({
                            type: "assignment",
                            data: assignment
                          });
                          setIsDetailModalOpen(true);
                        }}
                        className="cursor-pointer hover:bg-muted/50"
                      >
                        <TableCell>
                          <div className="font-medium">{name}</div>
                        </TableCell>
                        <TableCell>{formatNumber(quantity)}</TableCell>
                        <TableCell>{unit}</TableCell>
                        <TableCell>{formatCurrency(value)}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={e => {
                                e.stopPropagation();
                                setEditingAssignment(assignment);
                                setShowAssignmentForm(true);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button size="sm" variant="outline">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Remove Assignment</AlertDialogTitle>
                                  <AlertDialogDescription>This will remove this item from the section but won't delete the stock entry or menu item.</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDeleteAssignment(assignment.id)}>Remove</AlertDialogAction>
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
          </CardContent>
        </Card>
      )}
    </>
  );
}
