// import { Button } from "@/components/ui/button";
// import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
// import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
// import { CreateTableData, InnerSection, Section } from "@/types/inventory";
// import { Pencil, Plus, Trash2 } from "lucide-react";
// import { memo, useEffect, useState } from "react";
// import { TablesForm } from "./TablesForm";

// interface InnerSectionsTableProps {
//   innerSections: InnerSection[];
//   sections: Section[];
//   selectedInnerSectionId: string;
//   selectedSectionId: string;
//   setSelectedItem: (item: { type: string; data: InnerSection }) => void;
//   setIsDetailModalOpen: (open: boolean) => void;
//   setEditingInnerSection: (innerSection: InnerSection | undefined) => void;
//   setShowInnerSectionForm: (show: boolean) => void;
//   onDeleteInnerSection: (innerSectionId: string) => Promise<void>;
//   setSelectedInnerSectionId: (innerSectionId: string) => void;
//   onCreateTable: (data: CreateTableData) => Promise<void>;
//   onInnerSectionsUpdated: (updatedInnerSections: InnerSection[]) => void;
//   onInnerSectionCreated: (newInnerSection: InnerSection) => void;
// }

// const InnerSectionsTable = memo(
//   ({
//     innerSections, // This should be the filtered list from parent
//     sections,
//     selectedInnerSectionId,
//     setSelectedItem,
//     setIsDetailModalOpen,
//     setEditingInnerSection,
//     setShowInnerSectionForm,
//     onDeleteInnerSection,
//     setSelectedInnerSectionId,
//     onCreateTable,
//     onInnerSectionsUpdated
//   }: InnerSectionsTableProps) => {
//     useEffect(() => {
//       console.log("InnerSectionsTable received new innerSections:", innerSections);
//     }, [innerSections]);

//     const [showTableForm, setShowTableForm] = useState(false);
//     const [selectedInnerSectionForTable, setSelectedInnerSectionForTable] = useState<InnerSection | null>(null);
//     const existingTableNumbers = selectedInnerSectionForTable?.tables?.map(t => t.tableNumber) || [];
//     // Safe parent section lookup
//     const getParentSection = (innerSection: InnerSection) => {
//       return sections.find(s => s.id.toString() === innerSection.sectionId.toString());
//     };

//     const handleEditInnerSection = (innerSection: InnerSection) => {
//       console.log("Setting editing inner section:", innerSection);
//       setEditingInnerSection({
//         ...innerSection,
//         // Ensure dates are properly initialized
//         createdAt: innerSection.createdAt ? new Date(innerSection.createdAt) : new Date(),
//         updatedAt: new Date()
//       });
//       setShowInnerSectionForm(true);
//     };

//     const handleSelectInnerSection = (innerSection: InnerSection) => {
//       setSelectedInnerSectionId(innerSection.id);
//       setSelectedItem({ type: "innerSection", data: innerSection });
//       setIsDetailModalOpen(true);
//     };

//     const handleAddTable = (innerSection: InnerSection) => {
//       setSelectedInnerSectionForTable(innerSection);
//       setSelectedInnerSectionId(innerSection.id);
//       setShowTableForm(true);
//     };

//     const handleCreateTable = async (data: CreateTableData) => {
//       console.log("Creating table with data:", data);
//       try {
//         await onCreateTable(data);
//         setShowTableForm(false);
//         setSelectedInnerSectionForTable(null);
//         console.log("Optimistically updating tables...");
//         // Optimistically update the table count
//         const updatedInnerSections = innerSections.map(section => {
//           if (section.id === data.innerSectionId) {
//             return {
//               ...section,
//               tables: [...(section.tables || []), { id: "temp", ...data, isReserved: false }]
//             };
//           }
//           return section;
//         });
//         console.log("Updated inner sections:", updatedInnerSections);

//         onInnerSectionsUpdated(updatedInnerSections);
//       } catch (error) {
//         console.error("Failed to create table:", error);
//         // Rollback optimistic updates
//         onInnerSectionsUpdated(innerSections);
//       }
//     };

//     return (
//       <div className="space-y-4">
//         <div className="flex justify-between items-center">
//           <h2 className="text-xl font-semibold">Inner Sections</h2>
//           <Button
//             onClick={() => {
//               setEditingInnerSection(undefined);
//               setShowInnerSectionForm(true);
//             }}
//             className="bg-blue-600 hover:bg-blue-700"
//           >
//             Add Inner Section
//           </Button>
//         </div>
//         <Table>
//           <TableHeader>
//             <TableRow>
//               <TableHead>Name</TableHead>
//               <TableHead>Type</TableHead>
//               <TableHead>Parent Section</TableHead>
//               <TableHead>Tables</TableHead>
//               <TableHead>Actions</TableHead>
//             </TableRow>
//           </TableHeader>
//           <TableBody>
//             {innerSections.map(innerSection => {
//               if (!innerSection) return null; // <-- Safeguard

//               const parentSection = getParentSection(innerSection);

//               return (
//                 <TableRow key={innerSection.id} className={selectedInnerSectionId === innerSection.id ? "bg-blue-100" : ""} onClick={() => handleSelectInnerSection(innerSection)}>
//                   <TableCell>{innerSection.name}</TableCell>
//                   <TableCell>{innerSection.type === "indoor" ? "Indoor" : "Outdoor"}</TableCell>
//                   <TableCell>{parentSection?.name || "Unknown"}</TableCell>
//                   <TableCell>{(innerSection.tables || []).length}</TableCell>
//                   <TableCell>
//                     <div className="flex space-x-2">
//                       <Button
//                         variant="outline"
//                         size="sm"
//                         onClick={e => {
//                           e.stopPropagation();
//                           handleEditInnerSection(innerSection);
//                         }}
//                         title="Edit Inner Section"
//                       >
//                         <Pencil className="h-4 w-4" />
//                       </Button>
//                       <Button
//                         variant="outline"
//                         size="sm"
//                         onClick={e => {
//                           e.stopPropagation();
//                           handleAddTable(innerSection);
//                         }}
//                         title="Add Table"
//                       >
//                         <Plus className="h-4 w-4" />
//                       </Button>
//                       <Button
//                         variant="destructive"
//                         size="sm"
//                         onClick={async e => {
//                           e.stopPropagation();
//                           await onDeleteInnerSection(innerSection.id);
//                         }}
//                         title="Delete Inner Section"
//                       >
//                         <Trash2 className="h-4 w-4" />
//                       </Button>
//                     </div>
//                   </TableCell>
//                 </TableRow>
//               );
//             })}
//           </TableBody>
//         </Table>

//         {/* Table Form Dialog */}
//         <Dialog
//           open={showTableForm}
//           onOpenChange={open => {
//             if (!open) {
//               setShowTableForm(false);
//               setSelectedInnerSectionForTable(null);
//             }
//           }}
//         >
//           <DialogContent className="w-[95vw] max-w-[500px] max-h-[90vh] overflow-y-auto p-6">
//             <DialogHeader className="pb-4">
//               <DialogTitle className="text-lg font-semibold">Add New Table</DialogTitle>
//             </DialogHeader>
//             {selectedInnerSectionForTable && <TablesForm innerSections={innerSections} preSelectedInnerSectionId={selectedInnerSectionForTable.id} parentSectionId={selectedInnerSectionForTable.sectionId} existingTableNumbers={existingTableNumbers} onSubmit={handleCreateTable} onCancel={() => setShowTableForm(false)} />}
//           </DialogContent>
//         </Dialog>
//       </div>
//     );
//   }
// );

// // Add display name for better debugging
// InnerSectionsTable.displayName = "InnerSectionsTable";

// export { InnerSectionsTable };

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CreateTableData, InnerSection, Section } from "@/types/inventory";
import { AlertTriangle, Edit, Package, Plus, Trash2 } from "lucide-react";
import { memo, useCallback, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { TablesForm } from "./TablesForm";

interface InnerSectionsTableProps {
  innerSections: InnerSection[];
  sections: Section[];
  selectedInnerSectionId: string;
  selectedSectionId: string;
  setSelectedItem: (item: { type: string; data: InnerSection }) => void;
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

export const InnerSectionsTable = memo(({ onInnerSectionUpdated, innerSections, sections, selectedInnerSectionId, setSelectedItem, setIsDetailModalOpen, setEditingInnerSection, setShowInnerSectionForm, onDeleteInnerSection, setSelectedInnerSectionId, onCreateTable, isLoading = false }: InnerSectionsTableProps) => {
  const [showTableForm, setShowTableForm] = useState(false);
  const [selectedInnerSectionForTable, setSelectedInnerSectionForTable] = useState<InnerSection | null>(null);
  const existingTableNumbers = selectedInnerSectionForTable?.tables?.map(t => t.tableNumber) || [];

  // Safe parent section lookup
  const getParentSection = useCallback(
    (innerSection: InnerSection) => {
      return sections.find(s => s.id.toString() === innerSection.sectionId.toString());
    },
    [sections]
  );

  const handleSelectInnerSection = useCallback(
    (innerSection: InnerSection) => {
      setSelectedInnerSectionId(innerSection.id);
      setSelectedItem({ type: "innerSection", data: innerSection });
      setIsDetailModalOpen(true);
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

      // If you need to update the table immediately
      if (onInnerSectionUpdated) {
        onInnerSectionUpdated(innerSection);
      }
    },
    [onInnerSectionUpdated]
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
        console.error("Failed to create table:", error);
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
      {/* Main Inner Sections Table */}
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
          {innerSections.length === 0 ? (
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
                  {innerSections.map(innerSection => {
                    if (!innerSection) return null;
                    const parentSection = getParentSection(innerSection);

                    return (
                      <TableRow
                        key={innerSection.id}
                        onClick={() => handleSelectInnerSection(innerSection)}
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
                          <div className="font-medium truncate">{innerSection.name}</div>
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
                    );
                  })}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Table Form Dialog */}
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
          {selectedInnerSectionForTable && <TablesForm innerSections={innerSections} preSelectedInnerSectionId={selectedInnerSectionForTable.id} parentSectionId={selectedInnerSectionForTable.sectionId} existingTableNumbers={existingTableNumbers} onSubmit={handleCreateTable} onCancel={() => setShowTableForm(false)} />}
        </DialogContent>
      </Dialog>
    </div>
  );
});

InnerSectionsTable.displayName = "InnerSectionsTable";
