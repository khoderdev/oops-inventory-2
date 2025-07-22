import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useInventoryStore } from "@/hooks/useInventoryStore";
import { selectedPOSPanelTableAtom, showPOSPanelAtom } from "@/store/inventoryAtoms";
import { CreateTableData, InnerSection, Section, Tables } from "@/types/inventory";
import { useAtom } from "jotai";
import { AlertTriangle, ChevronDown, ChevronUp, Edit, Package, Plus, Trash2 } from "lucide-react";
import { memo, useCallback, useState } from "react";

// Props for TablesManagementPanel
interface TablesManagementPanelProps {
  sections: Section[];
  innerSections: InnerSection[];
  setSelectedItem: (item: { type: string; data: InnerSection | Tables }) => void;
  setIsDetailModalOpen: (open: boolean) => void;
}

// TablesForm component for creating/editing tables
interface TablesFormProps {
  innerSections: InnerSection[];
  preSelectedInnerSectionId?: string;
  parentSectionId?: string;
  existingTableNumbers: string[];
  table?: Tables;
  onSubmit: (data: CreateTableData) => Promise<void>;
  onCancel: () => void;
}

const TablesForm = ({ innerSections, preSelectedInnerSectionId, parentSectionId, existingTableNumbers, table, onSubmit, onCancel }: TablesFormProps) => {
  const [tableNumber, setTableNumber] = useState(table?.tableNumber || "");
  const [capacity, setCapacity] = useState(table?.capacity.toString() || "4");
  const [isReserved, setIsReserved] = useState(table?.isReserved || false);
  const [innerSectionId, setInnerSectionId] = useState(preSelectedInnerSectionId || "");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!tableNumber || !capacity || !innerSectionId) {
      setError("All fields are required");
      return;
    }

    if (!table && existingTableNumbers.includes(tableNumber)) {
      setError("Table number already exists in this inner section");
      return;
    }

    try {
      await onSubmit({
        tableNumber,
        capacity: parseInt(capacity),
        isReserved,
        innerSectionId
      });
    } catch (err) {
      setError("Failed to save table");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <div className="text-red-600 text-sm">{error}</div>}
      <div>
        <label className="block text-sm font-medium mb-1">Table Number</label>
        <Input value={tableNumber} onChange={e => setTableNumber(e.target.value)} placeholder="Enter table number" required />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Capacity (Seats)</label>
        <Input type="number" value={capacity} onChange={e => setCapacity(e.target.value)} placeholder="Enter capacity" min="1" required />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Inner Section</label>
        <Select value={innerSectionId} onValueChange={setInnerSectionId} disabled={!!preSelectedInnerSectionId}>
          <SelectTrigger>
            <SelectValue placeholder="Select inner section" />
          </SelectTrigger>
          <SelectContent>
            {innerSections.map(is => (
              <SelectItem key={is.id} value={is.id}>
                {is.name} (Section: {is.sectionId})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center gap-2">
        <input type="checkbox" checked={isReserved} onChange={e => setIsReserved(e.target.checked)} id="isReserved" />
        <label htmlFor="isReserved" className="text-sm">
          Reserved
        </label>
      </div>
      <div className="flex gap-2">
        <Button type="submit" className="flex-1">
          Save
        </Button>
        <Button type="button" variant="outline" className="flex-1" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
};

// Memoized ActionButtons component
const ActionButtons = memo(({ onEdit, onDelete, deleteTitle, deleteDescription, itemName }: { onEdit: () => void; onDelete: () => void; deleteTitle: string; deleteDescription: string; itemName: string }) => (
  <div className="flex items-center gap-1 sm:gap-2">
    <Button
      size="sm"
      variant="ghost"
      onClick={e => {
        e.stopPropagation();
        onEdit();
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
          <AlertDialogDescription>{deleteDescription}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col-reverse sm:flex-row">
          <AlertDialogCancel className="mt-2 sm:mt-0">Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
));

ActionButtons.displayName = "ActionButtons";

// Main TablesManagementPanel component
export const TablesManagementPanel = memo(({ sections, innerSections, setSelectedItem, setIsDetailModalOpen }: TablesManagementPanelProps) => {
  const { createTable, updateTable, deleteTable } = useInventoryStore();
  const [showTableForm, setShowTableForm] = useState(false);
  const [editingTable, setEditingTable] = useState<Tables | undefined>(undefined);
  const [expandedSections, setExpandedSections] = useState<string[]>([]);
  const [expandedInnerSections, setExpandedInnerSections] = useState<string[]>([]);
  const [, setShowPOSPanel] = useAtom(showPOSPanelAtom);
  const [, setSelectedPOSPanelTable] = useAtom(selectedPOSPanelTableAtom);

  // Toggle section expansion
  const toggleSection = useCallback((sectionId: string) => {
    setExpandedSections(prev => (prev.includes(sectionId) ? prev.filter(id => id !== sectionId) : [...prev, sectionId]));
  }, []);

  // Toggle inner section expansion
  const toggleInnerSection = useCallback((innerSectionId: string) => {
    setExpandedInnerSections(prev => (prev.includes(innerSectionId) ? prev.filter(id => id !== innerSectionId) : [...prev, innerSectionId]));
  }, []);

  // Handle table click to open POSPanel
  const handleTableClick = useCallback(
    (table: Tables) => {
      setSelectedItem({ type: "table", data: table });
      setSelectedPOSPanelTable(table);
      setShowPOSPanel(true);
      setTimeout(() => {
        setIsDetailModalOpen(true);
      }, 0);
    },
    [setSelectedItem, setSelectedPOSPanelTable, setShowPOSPanel, setIsDetailModalOpen]
  );

  // Handle create/edit table
  const handleCreateOrUpdateTable = useCallback(
    async (data: CreateTableData) => {
      try {
        if (editingTable) {
          await updateTable(editingTable.id, data);
        } else {
          await createTable(data);
        }
        setShowTableForm(false);
        setEditingTable(undefined);
      } catch (error) {
        console.error("Failed to save table:", error);
      }
    },
    [createTable, updateTable, editingTable]
  );

  // Handle delete table
  const handleDeleteTable = useCallback(
    async (tableId: string) => {
      try {
        await deleteTable(tableId);
      } catch (error) {
        console.error("Failed to delete table:", error);
      }
    },
    [deleteTable]
  );

  // Filter inner sections by section
  const getInnerSectionsBySection = useCallback(
    (sectionId: string) => {
      return innerSections.filter(is => is.sectionId === sectionId);
    },
    [innerSections]
  );

  // Get tables by inner section
  const getTablesByInnerSection = useCallback(
    (innerSectionId: string) => {
      const innerSection = innerSections.find(is => is.id === innerSectionId);
      return innerSection?.tables || [];
    },
    [innerSections]
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle>Tables Management</CardTitle>
            <Button
              size="sm"
              onClick={() => {
                setEditingTable(undefined);
                setShowTableForm(true);
              }}
              className="w-fit"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Table
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {sections.length === 0 ? (
            <div className="text-center py-12 px-4">
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No sections found</h3>
              <p className="text-muted-foreground mb-4">Create sections and inner sections to organize your tables.</p>
            </div>
          ) : (
            <ScrollArea className="h-[400px]">
              <Table>
                <TableHeader className="sticky top-0 bg-background">
                  <TableRow>
                    <TableHead className="w-[200px] sm:w-[250px]">Section</TableHead>
                    <TableHead className="w-[150px] text-center">Inner Sections</TableHead>
                    <TableHead className="w-[100px] text-center">Tables</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sections.map(section => {
                    const sectionInnerSections = getInnerSectionsBySection(section.id);
                    const isSectionExpanded = expandedSections.includes(section.id);

                    return (
                      <>
                        <TableRow key={section.id} className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => toggleSection(section.id)}>
                          <TableCell className="min-w-0">
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={e => {
                                  e.stopPropagation();
                                  toggleSection(section.id);
                                }}
                                className="p-0 h-6 w-6"
                              >
                                {isSectionExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                              </Button>
                              <div className="font-medium truncate">{section.name}</div>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline" className="font-mono">
                              {sectionInnerSections.length}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline" className="font-mono">
                              {sectionInnerSections.reduce((total, is) => total + (is.tables?.length || 0), 0)}
                            </Badge>
                          </TableCell>
                        </TableRow>
                        {isSectionExpanded &&
                          sectionInnerSections.map(innerSection => {
                            const tables = getTablesByInnerSection(innerSection.id);
                            const isInnerSectionExpanded = expandedInnerSections.includes(innerSection.id);

                            return (
                              <>
                                <TableRow key={innerSection.id} className="bg-muted/20 cursor-pointer hover:bg-muted/30 transition-colors" onClick={() => toggleInnerSection(innerSection.id)}>
                                  <TableCell className="min-w-0 pl-8">
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
                                        {isInnerSectionExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                      </Button>
                                      <div className="font-medium truncate">{innerSection.name}</div>
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-center">
                                    <Badge variant={innerSection.type === "indoor" ? "default" : "secondary"}>{innerSection.type === "indoor" ? "Indoor" : "Outdoor"}</Badge>
                                  </TableCell>
                                  <TableCell className="text-center">
                                    <Badge variant="outline" className="font-mono">
                                      {tables.length}
                                    </Badge>
                                  </TableCell>
                                </TableRow>
                                {isInnerSectionExpanded && (
                                  <TableRow>
                                    <TableCell colSpan={3} className="bg-muted/10 p-4">
                                      <div className="ml-12 space-y-2">
                                        <h4 className="text-sm font-medium">Tables</h4>
                                        {tables.length > 0 ? (
                                          <div className="space-y-2">
                                            {tables.map(table => (
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
                                                <div className="flex items-center gap-4">
                                                  <span className="text-sm">Capacity: {table.capacity}</span>
                                                  <ActionButtons
                                                    onEdit={() => {
                                                      setEditingTable(table);
                                                      setShowTableForm(true);
                                                    }}
                                                    onDelete={() => handleDeleteTable(table.id)}
                                                    deleteTitle="Delete Table"
                                                    deleteDescription={`This will permanently delete Table ${table.tableNumber}.`}
                                                    itemName={`Table ${table.tableNumber}`}
                                                  />
                                                </div>
                                              </div>
                                            ))}
                                          </div>
                                        ) : (
                                          <p className="text-sm text-gray-500">No tables assigned</p>
                                        )}
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          className="mt-2"
                                          onClick={() => {
                                            setEditingTable(undefined);
                                            setShowTableForm(true);
                                          }}
                                        >
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
            setEditingTable(undefined);
          }
        }}
      >
        <DialogContent className="w-[95vw] max-w-[500px] max-h-[90vh] overflow-y-auto p-6">
          <DialogHeader className="pb-4">
            <DialogTitle className="text-lg font-semibold">{editingTable ? "Edit Table" : "Add New Table"}</DialogTitle>
          </DialogHeader>
          <TablesForm
            innerSections={innerSections}
            preSelectedInnerSectionId={editingTable?.innerSectionId}
            existingTableNumbers={innerSections.find(is => is.id === (editingTable?.innerSectionId || ""))?.tables?.map(t => t.tableNumber) || []}
            table={editingTable}
            onSubmit={handleCreateOrUpdateTable}
            onCancel={() => {
              setShowTableForm(false);
              setEditingTable(undefined);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
});

TablesManagementPanel.displayName = "TablesManagementPanel";
