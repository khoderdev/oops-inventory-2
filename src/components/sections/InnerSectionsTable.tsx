import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { selectedPOSPanelTableAtom, showPOSPanelAtom } from "@/store/inventoryAtoms";
import { CreateTableData, InnerSection, Section, Tables } from "@/types/inventory";
import { useAtom } from "jotai";
import { AlertTriangle, ChevronDown, ChevronUp, Edit, Package, Plus, Trash2 } from "lucide-react";
import { memo, useCallback, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { TablesForm } from "./TablesForm";

interface InnerSectionsTableProps {
  innerSections: InnerSection[];
  sections: Section[];
  selectedInnerSectionId: string;
  selectedSectionId: string;
  setSelectedItem: (item: { type: string; data: InnerSection | Tables }) => void;
  setIsDetailModalOpen: (open: boolean) => void;
  setEditingInnerSection: (innerSection: InnerSection | undefined) => void;
  setShowInnerSectionForm: (show: boolean) => void;
  onDeleteInnerSection: (innerSectionId: string) => Promise<void>;
  setSelectedInnerSectionId: (innerSectionId: string) => void;
  onCreateTable: (data: CreateTableData) => Promise<void>;
  isLoading?: boolean;
  onInnerSectionUpdated?: (updatedInnerSection: InnerSection) => void;
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
        aria-label={`Add table to ${itemName}`}
      >
        <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
      </Button>
    )}
  </div>
));

ActionButtons.displayName = "ActionButtons";

export const InnerSectionsTable = memo(({ onInnerSectionUpdated, innerSections, sections, selectedInnerSectionId, selectedSectionId, setSelectedItem, setIsDetailModalOpen, setEditingInnerSection, setShowInnerSectionForm, onDeleteInnerSection, setSelectedInnerSectionId, onCreateTable, isLoading = false }: InnerSectionsTableProps) => {
  const [showTableForm, setShowTableForm] = useState(false);
  const [selectedInnerSectionForTable, setSelectedInnerSectionForTable] = useState<InnerSection | null>(null);
  const [expandedInnerSections, setExpandedInnerSections] = useState<string[]>([]);
  const [, setShowPOSPanel] = useAtom(showPOSPanelAtom);
  const [, setSelectedPOSPanelTable] = useAtom(selectedPOSPanelTableAtom);
  const existingTableNumbers = selectedInnerSectionForTable?.tables?.map(t => t.tableNumber) || [];

  // Normalize innerSections to ensure tables is always an array
  const normalizedInnerSections = useMemo(() => {
    return innerSections.map(is => ({
      ...is,
      tables: is.tables || [],
      createdAt: is.createdAt ? new Date(is.createdAt) : new Date(),
      updatedAt: is.updatedAt ? new Date(is.updatedAt) : new Date()
    }));
  }, [innerSections]);

  // Safe parent section lookup
  const getParentSection = useCallback(
    (innerSection: InnerSection) => {
      const parent = sections.find(s => s.id.toString() === innerSection.sectionId.toString());
      return parent;
    },
    [sections]
  );

  // Toggle inner section expansion
  const toggleInnerSection = useCallback((innerSectionId: string) => {
    setExpandedInnerSections(prev => (prev.includes(innerSectionId) ? prev.filter(id => id !== innerSectionId) : [...prev, innerSectionId]));
  }, []);

  // Handle table click to open POSPanel
  const handleTableClick = useCallback(
    (table: Tables) => {
      console.log("Table clicked:", table); // Debug log
      setSelectedItem({ type: "table", data: table });
      setSelectedPOSPanelTable(table);
      setShowPOSPanel(true);
      setTimeout(() => {
        setIsDetailModalOpen(true);
      }, 0);
    },
    [setSelectedItem, setSelectedPOSPanelTable, setShowPOSPanel, setIsDetailModalOpen]
  );

  const handleSelectInnerSection = useCallback(
    (innerSection: InnerSection) => {
      setSelectedInnerSectionId(innerSection.id);
      setSelectedItem({ type: "innerSection", data: innerSection });
      setTimeout(() => {
        setIsDetailModalOpen(true);
      }, 0);
    },
    [setSelectedInnerSectionId, setSelectedItem, setIsDetailModalOpen]
  );

  const handleEditInnerSection = useCallback(
    (innerSection: InnerSection) => {
      setEditingInnerSection({
        ...innerSection,
        createdAt: innerSection.createdAt ? new Date(innerSection.createdAt) : new Date(),
        updatedAt: new Date()
      });
      setShowInnerSectionForm(true);

      if (onInnerSectionUpdated) {
        onInnerSectionUpdated(innerSection);
      }
    },
    [setEditingInnerSection, setShowInnerSectionForm, onInnerSectionUpdated]
  );

  const handleAddTable = useCallback(
    (innerSection: InnerSection) => {
      setSelectedInnerSectionForTable(innerSection);
      setSelectedInnerSectionId(innerSection.id);
      setShowTableForm(true);
    },
    [setSelectedInnerSectionId]
  );

  const handleCreateTable = useCallback(
    async (data: CreateTableData) => {
      try {
        await onCreateTable(data);
        setShowTableForm(false);
        setSelectedInnerSectionForTable(null);
      } catch (error) {
        console.error("InnerSectionsTable: Failed to create table:", error);
      }
    },
    [onCreateTable]
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
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Inner Sections</CardTitle>
            </div>
            <Button
              size="sm"
              onClick={() => {
                setEditingInnerSection(undefined);
                setShowInnerSectionForm(true);
              }}
              className="w-fit"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Inner Section
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {normalizedInnerSections.length === 0 ? (
            <div className="text-center py-12 px-4">
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No inner sections found</h3>
              <p className="text-muted-foreground mb-4">Create your first inner section to start organizing your tables.</p>
              <Button
                onClick={() => {
                  setEditingInnerSection(undefined);
                  setShowInnerSectionForm(true);
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Inner Section
              </Button>
            </div>
          ) : (
            <ScrollArea className="h-[400px]">
              <Table>
                <TableHeader className="sticky top-0 bg-background">
                  <TableRow>
                    <TableHead className="w-[200px] sm:w-[250px]">Name</TableHead>
                    <TableHead className="w-[150px]">Type</TableHead>
                    <TableHead className="hidden md:table-cell">Parent Section</TableHead>
                    <TableHead className="w-[100px] text-center">Tables</TableHead>
                    <TableHead className="w-[120px] text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {normalizedInnerSections.map(innerSection => {
                    if (!innerSection) return null;
                    const parentSection = getParentSection(innerSection);
                    const isExpanded = expandedInnerSections.includes(innerSection.id);

                    return (
                      <>
                        <TableRow
                          key={innerSection.id}
                          onClick={e => {
                            e.stopPropagation();
                            handleSelectInnerSection(innerSection);
                          }}
                          className={`cursor-pointer hover:bg-muted/50 transition-colors ${selectedInnerSectionId === innerSection.id ? "bg-blue-50" : ""}`}
                          role="button"
                          tabIndex={0}
                          onKeyDown={e => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              handleSelectInnerSection(innerSection);
                            }
                          }}
                        >
                          <TableCell className="min-w-0">
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={e => {
                                  e.stopPropagation();
                                  toggleInnerSection(innerSection.id);
                                }}
                                className="p-0 h-6 w-6"
                              >
                                {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                              </Button>
                              <div className="font-medium truncate">{innerSection.name}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={innerSection.type === "indoor" ? "default" : "secondary"}>{innerSection.type === "indoor" ? "Indoor" : "Outdoor"}</Badge>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">{parentSection?.name || "Unknown"}</TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline" className="font-mono">
                              {(innerSection.tables || []).length}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <ActionButtons onEdit={() => handleEditInnerSection(innerSection)} onDelete={() => onDeleteInnerSection(innerSection.id)} onAdd={() => handleAddTable(innerSection)} deleteTitle="Delete Inner Section" deleteDescription={`This will permanently delete the "${innerSection.name}" inner section and all its tables.`} itemName={innerSection.name} />
                          </TableCell>
                        </TableRow>
                        {isExpanded && (
                          <TableRow>
                            <TableCell colSpan={5} className="bg-muted/20 p-4">
                              <div className="ml-8 space-y-2">
                                <h4 className="text-sm font-medium">Tables</h4>
                                {innerSection.tables && innerSection.tables.length > 0 ? (
                                  <div className="space-y-2">
                                    {innerSection.tables.map(table => (
                                      <div
                                        key={table.id}
                                        className="flex justify-between items-center p-2 bg-gray-100 rounded cursor-pointer hover:bg-gray-200"
                                        onClick={() => handleTableClick(table)}
                                        role="button"
                                        tabIndex={0}
                                        onKeyDown={e => {
                                          if (e.key === "Enter" || e.key === " ") {
                                            e.preventDefault();
                                            handleTableClick(table);
                                          }
                                        }}
                                      >
                                        <div className="flex items-center gap-2">
                                          <span className="text-sm font-medium text-primary">Table {table.tableNumber}</span>
                                          <Badge variant={table.isReserved ? "destructive" : "success"} className="text-xs">
                                            {table.isReserved ? "Reserved" : "Available"}
                                          </Badge>
                                        </div>
                                        <span className="text-sm">Capacity: {table.capacity}</span>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-sm text-gray-500">No tables assigned</p>
                                )}
                                <Button variant="outline" size="sm" className="mt-2" onClick={() => handleAddTable(innerSection)}>
                                  <Plus className="h-4 w-4 mr-2" />
                                  Add Table
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </>
                    );
                  })}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={showTableForm}
        onOpenChange={open => {
          if (!open) {
            setShowTableForm(false);
            setSelectedInnerSectionForTable(null);
          }
        }}
      >
        <DialogContent className="w-[95vw] max-w-[500px] max-h-[90vh] overflow-y-auto p-6">
          <DialogHeader className="pb-4">
            <DialogTitle className="text-lg font-semibold">Add New Table</DialogTitle>
          </DialogHeader>
          {selectedInnerSectionForTable && <TablesForm innerSections={normalizedInnerSections} preSelectedInnerSectionId={selectedInnerSectionForTable.id} parentSectionId={selectedInnerSectionForTable.sectionId} existingTableNumbers={existingTableNumbers} onSubmit={handleCreateTable} onCancel={() => setShowTableForm(false)} />}
        </DialogContent>
      </Dialog>
    </div>
  );
});

InnerSectionsTable.displayName = "InnerSectionsTable";
