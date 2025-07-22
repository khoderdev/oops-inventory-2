// import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
// import { Badge } from "@/components/ui/badge";
// import { Button } from "@/components/ui/button";
// import { ScrollArea } from "@/components/ui/scroll-area";
// import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
// import { InnerSection, Section, SectionAssignment, SectionWithAssignments, Tables } from "@/types/inventory";
// import { convertMass, convertVolume, formatCurrency, formatNumber, isMassUnit, isVolumeUnit } from "@/utils/conversionLogic";
// import { AlertTriangle, Building2, Edit, Package, Plus, Table2, Trash2 } from "lucide-react";
// import { memo, useCallback, useMemo } from "react";
// import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

// interface SectionsTablesProps {
//   sectionsWithAssignments: SectionWithAssignments[];
//   tables: Tables[];
//   innerSections: InnerSection[];
//   selectedSectionId: string;
//   selectedInnerSectionId: string;
//   sections: Section[];
//   setSelectedItem: (item: { type: string; data: SectionWithAssignments | SectionAssignment | InnerSection | Tables }) => void;
//   setIsDetailModalOpen: (open: boolean) => void;
//   setEditingSection: (section: Section | undefined) => void;
//   setEditingInnerSection: (innerSection: InnerSection | undefined) => void;
//   setEditingTable: (table: Tables | undefined) => void;
//   setShowSectionForm: (show: boolean) => void;
//   setShowInnerSectionForm: (show: boolean) => void;
//   setShowTableForm: (show: boolean) => void;
//   handleDeleteSection: (sectionId: string) => void;
//   handleDeleteInnerSection: (innerSectionId: string) => void;
//   handleDeleteTable: (tableId: string) => void;
//   setSelectedSectionId: (id: string) => void;
//   setSelectedInnerSectionId: (id: string) => void;
//   setShowAssignmentForm: (show: boolean) => void;
//   setEditingAssignment: (assignment: SectionAssignment | undefined) => void;
//   handleDeleteAssignment: (assignmentId: string) => void;
//   isLoading?: boolean;
// }

// // Memoized action buttons component for better performance
// const ActionButtons = memo(({ onEdit, onDelete, onAdd, deleteTitle, deleteDescription, itemName }: { onEdit: (e?: React.MouseEvent) => void; onDelete: () => void; onAdd?: (e?: React.MouseEvent) => void; deleteTitle: string; deleteDescription: string; itemName: string }) => (
//   <div className="flex items-center gap-1 sm:gap-2">
//     <Button
//       size="sm"
//       variant="ghost"
//       onClick={e => {
//         e.stopPropagation();
//         onEdit(e);
//       }}
//       className="h-8 w-8 p-0 hover:bg-muted"
//       aria-label={`Edit ${itemName}`}
//     >
//       <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
//     </Button>

//     <AlertDialog>
//       <AlertDialogTrigger asChild>
//         <Button size="sm" variant="ghost" className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive" aria-label={`Delete ${itemName}`} onClick={e => e.stopPropagation()}>
//           <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
//         </Button>
//       </AlertDialogTrigger>
//       <AlertDialogContent className="sm:max-w-md">
//         <AlertDialogHeader>
//           <AlertDialogTitle className="flex items-center gap-2">
//             <AlertTriangle className="h-5 w-5 text-destructive" />
//             {deleteTitle}
//           </AlertDialogTitle>
//           <AlertDialogDescription className="text-left">{deleteDescription}</AlertDialogDescription>
//         </AlertDialogHeader>
//         <AlertDialogFooter className="flex-col-reverse sm:flex-row">
//           <AlertDialogCancel className="mt-2 sm:mt-0">Cancel</AlertDialogCancel>
//           <AlertDialogAction onClick={onDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
//             Delete
//           </AlertDialogAction>
//         </AlertDialogFooter>
//       </AlertDialogContent>
//     </AlertDialog>

//     {onAdd && (
//       <Button
//         size="sm"
//         variant="ghost"
//         onClick={e => {
//           e.stopPropagation();
//           onAdd(e);
//         }}
//         className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary"
//         aria-label={`Add to ${itemName}`}
//       >
//         <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
//       </Button>
//     )}
//   </div>
// ));

// ActionButtons.displayName = "ActionButtons";

// // Memoized assignment row component
// const AssignmentRow = memo(({ assignment, onRowClick, onEdit, onDelete }: { assignment: SectionAssignment; onRowClick: () => void; onEdit: () => void; onDelete: () => void }) => {
//   const calculatedValue = useMemo(() => {
//     if (!assignment.stockEntry || !assignment.assignedQuantity) return 0;

//     const costPerUnit = assignment.stockEntry.costPerPurchasedUnit || 0;
//     const assignedUnit = assignment.assignedUnit || "";
//     const purchasedUnit = assignment.stockEntry.purchasedUnit || "";
//     const assignedQuantity = assignment.assignedQuantity || 0;

//     if (assignedUnit === purchasedUnit) {
//       return assignedQuantity * costPerUnit;
//     }

//     let convertedQuantity = assignedQuantity;

//     if (isMassUnit(assignedUnit) && isMassUnit(purchasedUnit)) {
//       convertedQuantity = convertMass(assignedQuantity, assignedUnit, purchasedUnit);
//     } else if (isVolumeUnit(assignedUnit) && isVolumeUnit(purchasedUnit)) {
//       convertedQuantity = convertVolume(assignedQuantity, assignedUnit, purchasedUnit);
//     } else if (assignment.material?.unitType === "package" && assignment.material.packageQuantity) {
//       if (assignedUnit === assignment.material.baseUnit && purchasedUnit === assignment.material.inputUnit) {
//         convertedQuantity = assignedQuantity / assignment.material.packageQuantity;
//       } else if (assignedUnit === assignment.material.inputUnit && purchasedUnit === assignment.material.baseUnit) {
//         convertedQuantity = assignedQuantity * assignment.material.packageQuantity;
//       }
//     }

//     return convertedQuantity * costPerUnit;
//   }, [assignment]);

//   const isPackageUnit = assignment.material?.unitType === "package";
//   const displayQuantity = useMemo(() => {
//     const assignedQty = assignment.assignedQuantity || 0;
//     const assignedUnit = assignment.assignedUnit || "";

//     if (isPackageUnit && assignment.assignedIndividualQuantity) {
//       const individualQty = assignment.assignedIndividualQuantity || 0;
//       const baseUnit = assignment.material?.baseUnit || "";
//       return `${formatNumber(assignedQty)} ${assignedUnit} (${formatNumber(individualQty)} ${baseUnit})`;
//     }
//     return `${formatNumber(assignedQty)} ${assignedUnit}`;
//   }, [assignment, isPackageUnit]);

//   return (
//     <TableRow
//       onClick={onRowClick}
//       className="cursor-pointer hover:bg-muted/50 transition-colors"
//       role="button"
//       tabIndex={0}
//       onKeyDown={e => {
//         if (e.key === "Enter" || e.key === " ") {
//           e.preventDefault();
//           onRowClick();
//         }
//       }}
//     >
//       <TableCell className="min-w-0">
//         <div className="flex items-center gap-2">
//           <div className="min-w-0 flex-1">
//             <div className="font-medium truncate">{assignment.material?.name || "Unknown Material"}</div>
//             {assignment.notes && <div className="text-sm text-muted-foreground truncate mt-1">{assignment.notes}</div>}
//           </div>
//           {isPackageUnit && (
//             <Badge variant="secondary" className="shrink-0">
//               <Package className="h-3 w-3 mr-1" />
//               Package
//             </Badge>
//           )}
//         </div>
//       </TableCell>
//       <TableCell className="font-mono text-sm">{displayQuantity}</TableCell>
//       <TableCell className="font-medium">{formatCurrency(calculatedValue)}</TableCell>
//       <TableCell className="w-24">
//         <ActionButtons onEdit={() => onEdit()} onDelete={onDelete} deleteTitle="Remove Assignment" deleteDescription="This will remove this item from the section but won't delete the stock entry." itemName={assignment.material?.name || "assignment"} />
//       </TableCell>
//     </TableRow>
//   );
// });

// AssignmentRow.displayName = "AssignmentRow";

// // Memoized inner section row component
// const InnerSectionRow = memo(({ innerSection, onRowClick, onEdit, onDelete, onAddTable }: { innerSection: InnerSection; onRowClick: () => void; onEdit: () => void; onDelete: () => void; onAddTable: () => void }) => (
//   <TableRow
//     onClick={onRowClick}
//     className="cursor-pointer hover:bg-muted/50 transition-colors"
//     role="button"
//     tabIndex={0}
//     onKeyDown={e => {
//       if (e.key === "Enter" || e.key === " ") {
//         e.preventDefault();
//         onRowClick();
//       }
//     }}
//   >
//     <TableCell className="min-w-0">
//       <div className="font-medium truncate">{innerSection.name}</div>
//       <div className="text-sm text-muted-foreground">{innerSection.type}</div>
//     </TableCell>
//     <TableCell className="text-center">
//       <Badge variant="outline" className="font-mono">
//         {innerSection.tables?.length || 0}
//       </Badge>
//     </TableCell>
//     <TableCell className="w-24">
//       <ActionButtons onEdit={() => onEdit()} onDelete={onDelete} onAdd={() => onAddTable()} deleteTitle="Delete Inner Section" deleteDescription={`This will permanently delete the "${innerSection.name}" inner section and all its tables.`} itemName={innerSection.name} />
//     </TableCell>
//   </TableRow>
// ));

// InnerSectionRow.displayName = "InnerSectionRow";

// // Memoized table row component
// const TableRowComponent = memo(({ table, onRowClick, onEdit, onDelete }: { table: Tables; onRowClick: () => void; onEdit: () => void; onDelete: () => void }) => (
//   <TableRow
//     onClick={onRowClick}
//     className="cursor-pointer hover:bg-muted/50 transition-colors"
//     role="button"
//     tabIndex={0}
//     onKeyDown={e => {
//       if (e.key === "Enter" || e.key === " ") {
//         e.preventDefault();
//         onRowClick();
//       }
//     }}
//   >
//     <TableCell className="min-w-0">
//       <div className="font-medium truncate">{table.tableNumber}</div>
//     </TableCell>
//     <TableCell className="text-center">{table.capacity}</TableCell>
//     <TableCell className="text-center">
//       <Badge variant={table.isReserved ? "destructive" : "secondary"}>{table.isReserved ? "Reserved" : "Available"}</Badge>
//     </TableCell>
//     <TableCell className="w-24">
//       <ActionButtons onEdit={() => onEdit()} onDelete={onDelete} deleteTitle="Delete Table" deleteDescription={`This will permanently delete the table "${table.tableNumber}".`} itemName={table.tableNumber} />
//     </TableCell>
//   </TableRow>
// ));

// TableRowComponent.displayName = "TableRow";

// export const SectionsTables = memo(
//   ({ sectionsWithAssignments, innerSections, selectedSectionId, selectedInnerSectionId, sections, setSelectedItem, setIsDetailModalOpen, setEditingSection, setEditingInnerSection, setEditingTable, setShowSectionForm, setShowInnerSectionForm, setShowTableForm, handleDeleteSection, handleDeleteInnerSection, handleDeleteTable, setSelectedSectionId, setSelectedInnerSectionId, setShowAssignmentForm, setEditingAssignment, handleDeleteAssignment, isLoading = false }: SectionsTablesProps) => {
//     const handleSectionRowClick = useCallback(
//       (section: SectionWithAssignments) => {
//         setSelectedItem({
//           type: "section",
//           data: section
//         });
//         setIsDetailModalOpen(true);
//       },
//       [setSelectedItem, setIsDetailModalOpen]
//     );

//     const handleInnerSectionRowClick = useCallback(
//       (innerSection: InnerSection) => {
//         setSelectedItem({
//           type: "innerSection",
//           data: innerSection
//         });
//         setIsDetailModalOpen(true);
//       },
//       [setSelectedItem, setIsDetailModalOpen]
//     );

//     const handleTableRowClick = useCallback(
//       (table: Tables) => {
//         setSelectedItem({
//           type: "table",
//           data: table
//         });
//         setIsDetailModalOpen(true);
//       },
//       [setSelectedItem, setIsDetailModalOpen]
//     );

//     const handleAssignmentRowClick = useCallback(
//       (assignment: SectionAssignment) => {
//         setSelectedItem({
//           type: "assignment",
//           data: assignment
//         });
//         setIsDetailModalOpen(true);
//       },
//       [setSelectedItem, setIsDetailModalOpen]
//     );

//     const handleEditSection = useCallback(
//       (section: Section) => {
//         setEditingSection(section);
//         setShowSectionForm(true);
//       },
//       [setEditingSection, setShowSectionForm]
//     );

//     const handleEditInnerSection = useCallback(
//       (innerSection: InnerSection) => {
//         setEditingInnerSection(innerSection);
//         setShowInnerSectionForm(true);
//       },
//       [setEditingInnerSection, setShowInnerSectionForm]
//     );

//     const handleEditTable = useCallback(
//       (table: Tables) => {
//         setEditingTable(table);
//         setShowTableForm(true);
//       },
//       [setEditingTable, setShowTableForm]
//     );

//     const handleAddAssignment = useCallback(
//       (sectionId: string) => {
//         setSelectedSectionId(sectionId);
//         setShowAssignmentForm(true);
//       },
//       [setSelectedSectionId, setShowAssignmentForm]
//     );

//     const handleAddInnerSection = useCallback(
//       (sectionId: string) => {
//         setSelectedSectionId(sectionId);
//         setShowInnerSectionForm(true);
//       },
//       [setSelectedSectionId, setShowInnerSectionForm]
//     );

//     const handleAddTable = useCallback(
//       (innerSectionId: string) => {
//         setSelectedInnerSectionId(innerSectionId);
//         setShowTableForm(true);
//       },
//       [setSelectedInnerSectionId, setShowTableForm]
//     );

//     const handleEditAssignment = useCallback(
//       (assignment: SectionAssignment) => {
//         setEditingAssignment(assignment);
//         setShowAssignmentForm(true);
//       },
//       [setEditingAssignment, setShowAssignmentForm]
//     );

//     const selectedSection = useMemo(() => {
//       return selectedSectionId ? sectionsWithAssignments.find(s => s.id === selectedSectionId) : null;
//     }, [selectedSectionId, sectionsWithAssignments]);

//     const selectedInnerSection = useMemo(() => {
//       return selectedInnerSectionId ? innerSections.find(is => is.id === selectedInnerSectionId) : null;
//     }, [selectedInnerSectionId, innerSections]);

//     const selectedSectionName = useMemo(() => {
//       return sections.find(s => s.id === selectedSectionId)?.name || "Unknown Section";
//     }, [sections, selectedSectionId]);

//     const selectedInnerSectionName = useMemo(() => {
//       return innerSections.find(is => is.id === selectedInnerSectionId)?.name || "Unknown Inner Section";
//     }, [innerSections, selectedInnerSectionId]);

//     if (isLoading) {
//       return (
//         <div className="space-y-6">
//           <Card>
//             <CardContent className="p-6">
//               <div className="animate-pulse space-y-4">
//                 <div className="h-4 bg-muted rounded w-1/4"></div>
//                 <div className="space-y-2">
//                   {[...Array(3)].map((_, i) => (
//                     <div key={i} className="h-12 bg-muted rounded"></div>
//                   ))}
//                 </div>
//               </div>
//             </CardContent>
//           </Card>
//         </div>
//       );
//     }

//     return (
//       <>
//         {/* Main Sections Table */}
//         <Card>
//           <CardHeader className="pb-4">
//             <div className="flex items-center justify-between">
//               <div>
//                 <CardTitle>Section Inventory</CardTitle>
//               </div>
//               <Button size="sm" onClick={() => setShowSectionForm(true)} className="w-fit">
//                 <Plus className="h-4 w-4 mr-2" />
//                 Add Sectionsss
//               </Button>
//             </div>
//           </CardHeader>
//           <CardContent className="p-0">
//             {sectionsWithAssignments.length === 0 ? (
//               <div className="text-center py-12 px-4">
//                 <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
//                 <h3 className="text-lg font-medium mb-2">No sections found</h3>
//                 <p className="text-muted-foreground mb-4">Create your first section to start organizing your inventory.</p>
//                 <Button onClick={() => setShowSectionForm(true)}>
//                   <Plus className="h-4 w-4 mr-2" />
//                   Add Sectionsss
//                 </Button>
//               </div>
//             ) : (
//               <ScrollArea className="h-[400px]">
//                 <Table>
//                   <TableHeader className="sticky top-0 bg-background">
//                     <TableRow>
//                       <TableHead className="w-[200px] sm:w-[250px]">Section</TableHead>
//                       <TableHead className="hidden md:table-cell">Description</TableHead>
//                       <TableHead className="w-[100px] text-center">Items</TableHead>
//                       <TableHead className="w-[100px] text-center">Inner Sections</TableHead>
//                       <TableHead className="w-[120px] text-right">Total Value</TableHead>
//                       <TableHead className="w-[120px] text-center">Actions</TableHead>
//                     </TableRow>
//                   </TableHeader>
//                   <TableBody>
//                     {sectionsWithAssignments.map(section => (
//                       <TableRow
//                         key={section.id}
//                         onClick={() => handleSectionRowClick(section)}
//                         className="cursor-pointer hover:bg-muted/50 transition-colors"
//                         role="button"
//                         tabIndex={0}
//                         onKeyDown={e => {
//                           if (e.key === "Enter" || e.key === " ") {
//                             e.preventDefault();
//                             handleSectionRowClick(section);
//                           }
//                         }}
//                       >
//                         <TableCell className="min-w-0">
//                           <div className="font-medium truncate">{section.name}</div>
//                           <div className="text-sm text-muted-foreground truncate md:hidden">{section.description}</div>
//                         </TableCell>
//                         <TableCell className="hidden md:table-cell">
//                           <div className="text-sm text-muted-foreground max-w-[200px] truncate">{section.description || "No description"}</div>
//                         </TableCell>
//                         <TableCell className="text-center">
//                           <Badge variant="outline" className="font-mono">
//                             {section.assignments.length}
//                           </Badge>
//                         </TableCell>
//                         <TableCell className="text-center">
//                           <Badge variant="outline" className="font-mono">
//                             {innerSections.filter(is => is.sectionId === section.id).length}
//                           </Badge>
//                         </TableCell>
//                         <TableCell className="text-right font-mono font-medium">{formatCurrency(section.totalValue)}</TableCell>
//                         <TableCell>
//                           <ActionButtons onEdit={() => handleEditSection(section)} onDelete={() => handleDeleteSection(section.id)} onAdd={() => handleAddInnerSection(section.id)} deleteTitle="Delete Section" deleteDescription={`This will permanently delete the "${section.name}" section, its inner sections, and all its assignments.`} itemName={section.name} />
//                         </TableCell>
//                       </TableRow>
//                     ))}
//                   </TableBody>
//                 </Table>
//               </ScrollArea>
//             )}
//           </CardContent>
//         </Card>

//         {/* Selected Section Details - Inner Sections */}
//         {selectedSection && (
//           <Card>
//             <CardHeader className="pb-4">
//               <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
//                 <div>
//                   <CardTitle className="text-lg sm:text-xl">{selectedSectionName} - Inner Sections</CardTitle>
//                   <p className="text-sm text-muted-foreground mt-1">{innerSections.filter(is => is.sectionId === selectedSectionId).length} inner sections</p>
//                 </div>
//                 <Button size="sm" onClick={() => handleAddInnerSection(selectedSectionId)} className="shrink-0">
//                   <Plus className="h-4 w-4 mr-2" />
//                   Add Inner Section
//                 </Button>
//               </div>
//             </CardHeader>
//             <CardContent className="p-0">
//               {innerSections.filter(is => is.sectionId === selectedSectionId).length === 0 ? (
//                 <div className="text-center py-12 px-4">
//                   <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
//                   <h3 className="text-lg font-medium mb-2">No inner sections found</h3>
//                   <p className="text-muted-foreground mb-4">Create an inner section to organize tables within this section.</p>
//                   <Button onClick={() => handleAddInnerSection(selectedSectionId)}>
//                     <Plus className="h-4 w-4 mr-2" />
//                     Add Inner Section
//                   </Button>
//                 </div>
//               ) : (
//                 <ScrollArea className="h-[300px]">
//                   <Table>
//                     <TableHeader className="sticky top-0 bg-background">
//                       <TableRow>
//                         <TableHead className="w-[200px] sm:w-[250px]">Inner Section</TableHead>
//                         <TableHead className="w-[100px] text-center">Tables</TableHead>
//                         <TableHead className="w-[100px] text-center">Actions</TableHead>
//                       </TableRow>
//                     </TableHeader>
//                     <TableBody>
//                       {innerSections
//                         .filter(is => is.sectionId === selectedSectionId)
//                         .map(innerSection => (
//                           <InnerSectionRow key={innerSection.id} innerSection={innerSection} onRowClick={() => handleInnerSectionRowClick(innerSection)} onEdit={() => handleEditInnerSection(innerSection)} onDelete={() => handleDeleteInnerSection(innerSection.id)} onAddTable={() => handleAddTable(innerSection.id)} />
//                         ))}
//                     </TableBody>
//                   </Table>
//                 </ScrollArea>
//               )}
//             </CardContent>
//           </Card>
//         )}

//         {/* Selected Inner Section Details - Tables */}
//         {selectedInnerSection && (
//           <Card>
//             <CardHeader className="pb-4">
//               <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
//                 <div>
//                   <CardTitle className="text-lg sm:text-xl">{selectedInnerSectionName} - Tables</CardTitle>
//                   <p className="text-sm text-muted-foreground mt-1">{selectedInnerSection.tables?.length || 0} tables</p>
//                 </div>
//                 <Button size="sm" onClick={() => handleAddTable(selectedInnerSectionId)} className="shrink-0">
//                   <Plus className="h-4 w-4 mr-2" />
//                   Add Table
//                 </Button>
//               </div>
//             </CardHeader>
//             <CardContent className="p-0">
//               {selectedInnerSection.tables?.length === 0 ? (
//                 <div className="text-center py-12 px-4">
//                   <Table2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
//                   <h3 className="text-lg font-medium mb-2">No tables found</h3>
//                   <p className="text-muted-foreground mb-4">Create a table to start managing orders in this inner section.</p>
//                   <Button onClick={() => handleAddTable(selectedInnerSectionId)}>
//                     <Plus className="h-4 w-4 mr-2" />
//                     Add Table
//                   </Button>
//                 </div>
//               ) : (
//                 <ScrollArea className="h-[300px]">
//                   <Table>
//                     <TableHeader className="sticky top-0 bg-background">
//                       <TableRow>
//                         <TableHead className="w-[200px] sm:w-[250px]">Table Number</TableHead>
//                         <TableHead className="w-[100px] text-center">Capacity</TableHead>
//                         <TableHead className="w-[100px] text-center">Status</TableHead>
//                         <TableHead className="w-[100px] text-center">Actions</TableHead>
//                       </TableRow>
//                     </TableHeader>
//                     <TableBody>
//                       {selectedInnerSection.tables?.map(table => (
//                         <TableRowComponent key={table.id} table={table} onRowClick={() => handleTableRowClick(table)} onEdit={() => handleEditTable(table)} onDelete={() => handleDeleteTable(table.id)} />
//                       ))}
//                     </TableBody>
//                   </Table>
//                 </ScrollArea>
//               )}
//             </CardContent>
//           </Card>
//         )}

//         {/* Selected Section Details - Items */}
//         {selectedSection && (
//           <Card>
//             <CardHeader className="pb-4">
//               <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
//                 <div>
//                   <CardTitle className="text-lg sm:text-xl">{selectedSectionName} - Items</CardTitle>
//                   <p className="text-sm text-muted-foreground mt-1">
//                     {selectedSection.assignments.length} items • Total value: {formatCurrency(selectedSection.totalValue)}
//                   </p>
//                 </div>
//                 <Button size="sm" onClick={() => handleAddAssignment(selectedSectionId)} className="shrink-0">
//                   <Plus className="h-4 w-4 mr-2" />
//                   Add Item
//                 </Button>
//               </div>
//             </CardHeader>
//             <CardContent className="p-0">
//               {selectedSection.assignments.length === 0 ? (
//                 <div className="text-center py-12 px-4">
//                   <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
//                   <h3 className="text-lg font-medium mb-2">No items assigned</h3>
//                   <p className="text-muted-foreground mb-4">Add items to this section to start organizing your inventory.</p>
//                   <Button onClick={() => handleAddAssignment(selectedSectionId)}>
//                     <Plus className="h-4 w-4 mr-2" />
//                     Add Item
//                   </Button>
//                 </div>
//               ) : (
//                 <ScrollArea className="h-[300px]">
//                   <Table>
//                     <TableHeader className="sticky top-0 bg-background">
//                       <TableRow>
//                         <TableHead className="w-[200px] sm:w-[250px]">Material</TableHead>
//                         <TableHead className="w-[150px] text-center">Quantity</TableHead>
//                         <TableHead className="w-[120px] text-right">Value</TableHead>
//                         <TableHead className="w-[100px] text-center">Actions</TableHead>
//                       </TableRow>
//                     </TableHeader>
//                     <TableBody>
//                       {selectedSection.assignments.map(assignment => (
//                         <AssignmentRow key={assignment.id} assignment={assignment} onRowClick={() => handleAssignmentRowClick(assignment)} onEdit={() => handleEditAssignment(assignment)} onDelete={() => handleDeleteAssignment(assignment.id)} />
//                       ))}
//                     </TableBody>
//                   </Table>
//                 </ScrollArea>
//               )}
//             </CardContent>
//           </Card>
//         )}
//       </>
//     );
//   }
// );

// SectionsTables.displayName = "SectionsTables";
