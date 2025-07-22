// import { InnerSectionForm } from "@/components/sections/InnerSectionForm";
// import { InnerSectionsTable } from "@/components/sections/InnerSectionsTable";
// import { SectionForm } from "@/components/sections/SectionForm";
// import { SectionsTable } from "@/components/sections/SectionsTable";
// import { TablesForm } from "@/components/sections/TablesForm";
// import { Alert, AlertDescription } from "@/components/ui/alert";
// import { DetailModal } from "@/components/ui/DetailModal";
// import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
// import { useInventoryCRUD } from "@/hooks/useInventoryCRUD";
// import { CreateInnerSectionData, CreateSectionAssignmentData, CreateSectionData, CreateTableData, InnerSection, Material, MenuItem, Section, SectionAssignment, StockEntry, Tables, UpdateInnerSectionData, UpdateSectionData } from "@/types/inventory";
// import { AlertCircle } from "lucide-react";
// import { useCallback, useEffect, useMemo, useState } from "react";
// import { AssignmentForm } from "./AssignmentForm";

// interface SectionsManagementPanelProps {
//   sections?: Section[];
//   sectionAssignments?: SectionAssignment[];
//   innerSections?: InnerSection[];
//   materials?: Material[];
//   stockEntries?: StockEntry[];
//   menuItems?: MenuItem[];
//   tables?: Tables[];
//   onDataRefresh?: () => void;
// }

// export function SectionsManagementPanel({ sections = [], sectionAssignments = [], innerSections = [], materials = [], stockEntries = [], menuItems = [], tables = [], onDataRefresh }: SectionsManagementPanelProps) {
//   const [selectedSectionId, setSelectedSectionId] = useState<string>(sections[0]?.id || "");
//   const [selectedInnerSectionId, setSelectedInnerSectionId] = useState<string>("");
//   const [showSectionForm, setShowSectionForm] = useState(false);
//   const [showInnerSectionForm, setShowInnerSectionForm] = useState(false);
//   const [showTableForm, setShowTableForm] = useState(false);
//   const [showAssignmentForm, setShowAssignmentForm] = useState(false);
//   const [editingSection, setEditingSection] = useState<Section | undefined>();
//   const [editingInnerSection, setEditingInnerSection] = useState<InnerSection | undefined>();
//   const [editingTable, setEditingTable] = useState<Tables | undefined>();
//   const [editingAssignment, setEditingAssignment] = useState<SectionAssignment | undefined>();
//   const [detailModalItem, setDetailModalItem] = useState<{ type: "material" | "section" | "assignment" | "stock" | "innerSection" | "table"; data: Tables | Section | InnerSection | SectionAssignment | Material | StockEntry | MenuItem } | null>(null);
//   const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
//   const [error, setError] = useState<string | null>(null);
//   const [successMessage, setSuccessMessage] = useState<string | null>(null);
//   const [optimisticSections, setOptimisticSections] = useState<Section[]>(sections);
//   const [optimisticInnerSections, setOptimisticInnerSections] = useState<InnerSection[]>(innerSections);
//   const [optimisticTables, setOptimisticTables] = useState<Tables[]>(tables);
//   const [optimisticAssignments, setOptimisticAssignments] = useState<SectionAssignment[]>(sectionAssignments);

//   // Initialize CRUD operations
//   const { createSection, updateSection, deleteSection, createInnerSection, updateInnerSection, deleteInnerSection, createTable, updateTable, deleteTable, createAssignment, updateAssignment, deleteAssignment, getInnerSections } = useInventoryCRUD(onDataRefresh);

//   // Helper functions
//   const showError = useCallback((message: string) => {
//     setError(message);
//     setTimeout(() => setError(null), 5000);
//   }, []);

//   const showSuccess = useCallback((message: string) => {
//     setSuccessMessage(message);
//     setTimeout(() => setSuccessMessage(null), 3000);
//   }, []);

//   const handleCreateSection = async (data: CreateSectionData) => {
//     try {
//       // Optimistic update
//       const tempSection: Section = {
//         id: `temp-${Date.now()}`,
//         ...data,
//         createdAt: new Date(),
//         updatedAt: new Date(),
//         innerSections: []
//       };
//       setOptimisticSections(prev => [...prev, tempSection]);

//       // Actual API call
//       const createdSection = await createSection(data);

//       // Replace temp section with actual data
//       setOptimisticSections(prev => prev.map(s => (s.id === tempSection.id ? createdSection : s)));

//       showSuccess(`Section "${data.name}" created successfully`);
//       setShowSectionForm(false);
//     } catch (error) {
//       // Rollback on error
//       setOptimisticSections(sections);
//       showError("Failed to create section");
//       console.error("Failed to create section:", error);
//     }
//   };

//   const handleUpdateSection = async (data: UpdateSectionData) => {
//     if (!editingSection) return;

//     try {
//       // Optimistic update
//       setOptimisticSections(prev => prev.map(s => (s.id === editingSection.id ? { ...s, ...data, updatedAt: new Date() } : s)));

//       // Actual API call
//       await updateSection(editingSection.id, data);

//       showSuccess(`Section "${data.name}" updated successfully`);
//       setShowSectionForm(false);
//       setEditingSection(undefined);
//     } catch (error) {
//       // Rollback on error
//       setOptimisticSections(sections);
//       showError("Failed to update section");
//       console.error("Failed to update section:", error);
//     }
//   };

//   const handleCreateAssignment = async (data: CreateSectionAssignmentData) => {
//     try {
//       // Optimistic update
//       const tempAssignment: SectionAssignment = {
//         id: `temp-${Date.now()}`,
//         ...data,
//         createdAt: new Date(),
//         updatedAt: new Date()
//       };
//       setOptimisticAssignments(prev => [...prev, tempAssignment]);

//       // Actual API call
//       const createdAssignment = await createAssignment(data);

//       // Replace temp assignment with actual data
//       setOptimisticAssignments(prev => prev.map(a => (a.id === tempAssignment.id ? createdAssignment : a)));

//       showSuccess("Assignment created successfully");
//       setShowAssignmentForm(false);
//     } catch (error) {
//       // Rollback on error
//       setOptimisticAssignments(sectionAssignments);
//       showError("Failed to create assignment");
//       console.error("Failed to create assignment:", error);
//     }
//   };

//   const handleCreateInnerSection = async (data: CreateInnerSectionData) => {
//     try {
//       // Optimistic update
//       const tempInnerSection: InnerSection = {
//         id: `temp-${Date.now()}`,
//         ...data,
//         tables: [],
//         status: "active"
//       };
//       setOptimisticInnerSections(prev => [...prev, tempInnerSection]);

//       // Actual API call
//       const createdInnerSection = await createInnerSection(data);

//       // Replace temp inner section with actual data
//       setOptimisticInnerSections(prev => prev.map(is => (is.id === tempInnerSection.id ? createdInnerSection : is)));

//       // Update parent section's innerSections array
//       setOptimisticSections(prev => prev.map(s => (s.id === data.sectionId ? { ...s, innerSections: [...(s.innerSections || []), createdInnerSection] } : s)));

//       showSuccess(`Inner section "${data.name}" created successfully`);
//       setShowInnerSectionForm(false);
//     } catch (error) {
//       // Rollback on error
//       setOptimisticInnerSections(innerSections);
//       showError("Failed to create inner section");
//       console.error("Failed to create inner section:", error);
//     }
//   };

//   // Memoized callbacks for CRUD operations
//   const handleUpdateInnerSection = async (data: UpdateInnerSectionData) => {
//     if (!editingInnerSection) {
//       console.error("No inner section being edited");
//       return;
//     }

//     console.log("Starting update for:", editingInnerSection.id);

//     try {
//       // Create new reference for the updated section
//       const updatedInnerSection = {
//         ...editingInnerSection,
//         ...data,
//         updatedAt: new Date()
//       };

//       // Optimistic update
//       setOptimisticInnerSections(prev => {
//         const updated = prev.map(is => (is.id === editingInnerSection.id ? { ...updatedInnerSection } : { ...is }));
//         console.log("Optimistic update:", updated);
//         return updated;
//       });

//       // API call
//       await updateInnerSection(editingInnerSection.id, data);

//       // Refresh data
//       const updatedData = await getInnerSections(selectedSectionId);
//       setOptimisticInnerSections(updatedData);

//       showSuccess("Inner section updated successfully");
//     } catch (error) {
//       console.error("Update failed:", error);
//       // Rollback
//       setOptimisticInnerSections(prev => [...innerSections]);
//       showError("Failed to update inner section");
//       throw error; // Re-throw to allow form to handle
//     }
//   };
//   const handleDeleteInnerSection = useCallback(
//     async (innerSectionId: string) => {
//       try {
//         // Optimistic update
//         const innerSectionToDelete = optimisticInnerSections.find(is => is.id === innerSectionId);
//         setOptimisticInnerSections(prev => prev.filter(is => is.id !== innerSectionId));

//         // Update parent section's innerSections array
//         setOptimisticSections(prev =>
//           prev.map(s => ({
//             ...s,
//             innerSections: s.innerSections?.filter(is => is.id !== innerSectionId) || []
//           }))
//         );

//         // Actual API call
//         await deleteInnerSection(innerSectionId);

//         showSuccess(`Inner section "${innerSectionToDelete?.name || "Unknown"}" deleted successfully`);
//       } catch (error) {
//         // Rollback on error
//         setOptimisticInnerSections(innerSections);
//         showError("Failed to delete inner section");
//         console.error("Failed to delete inner section:", error);
//       }
//     },
//     [optimisticInnerSections, deleteInnerSection, innerSections, showSuccess, showError]
//   );

//   const handleCreateTable = useCallback(
//     async (data: CreateTableData) => {
//       try {
//         await createTable(data);
//         setShowTableForm(false);

//         // Optimistically update the inner section's tables
//         setOptimisticInnerSections(prev =>
//           prev.map(section =>
//             section.id === data.innerSectionId
//               ? {
//                   ...section,
//                   tables: [
//                     ...(section.tables || []),
//                     {
//                       id: `temp-${Date.now()}`,
//                       ...data,
//                       isReserved: false
//                     }
//                   ]
//                 }
//               : section
//           )
//         );
//         showSuccess("Table created successfully");
//       } catch (error) {
//         console.error("Failed to create table:", error);
//         showError("Failed to create table");
//         setOptimisticInnerSections(innerSections);
//       }
//     },
//     [createTable, innerSections, showSuccess, showError]
//   );

//   // Memoize the setSelectedItem callback
//   const memoizedSetSelectedItem = useCallback((item: { type: string; data: InnerSection }) => {
//     setDetailModalItem({ type: "innerSection", data: item.data });
//     setIsDetailModalOpen(true);
//   }, []);

//   // Add this useEffect to fetch inner sections when selectedSectionId changes
//   useEffect(() => {
//     const fetchInnerSections = async () => {
//       if (selectedSectionId) {
//         try {
//           const data = await getInnerSections(selectedSectionId);
//           setOptimisticInnerSections(data);
//         } catch (error) {
//           console.error("Failed to fetch inner sections:", error);
//           showError("Failed to load inner sections");
//         }
//       }
//     };

//     fetchInnerSections();
//   }, [selectedSectionId, showError]);

//   // Sync optimistic state with props
//   useEffect(() => {
//     setOptimisticSections(sections);
//     // setOptimisticInnerSections(innerSections);
//     setOptimisticTables(tables);
//     setOptimisticAssignments(sectionAssignments);
//   }, [sections, tables, sectionAssignments]);

//   // Separate effect for setting default selectedSectionId
//   useEffect(() => {
//     if (!selectedSectionId && sections.length > 0) {
//       setSelectedSectionId(sections[0].id);
//     }
//   }, [selectedSectionId, sections]);

//   // Memoized derived data
//   const sectionsWithAssignments = useMemo(() => {
//     return optimisticSections.map(section => {
//       const assignments = optimisticAssignments.filter(a => a.sectionId === section.id);
//       return {
//         ...section,
//         assignments,
//         totalValue: assignments.reduce((sum, a) => sum + (a.assignedQuantity || 0), 0)
//       };
//     });
//   }, [optimisticSections, optimisticAssignments]);

//   const materialsWithSectionAssignments = useMemo(() => {
//     return materials.map(material => {
//       const assignments = optimisticAssignments.filter(a => a.materialId === material.id);
//       return {
//         ...material,
//         sectionAssignments: assignments.map(a => ({
//           sectionId: a.sectionId,
//           assignedQuantity: a.assignedQuantity || 0,
//           assignedUnit: a.assignedUnit || material.baseUnit
//         }))
//       };
//     });
//   }, [materials, optimisticAssignments]);

//   const handleDeleteSection = useCallback(
//     async (sectionId: string) => {
//       try {
//         // Optimistic update
//         const sectionToDelete = optimisticSections.find(s => s.id === sectionId);
//         setOptimisticSections(prev => prev.filter(s => s.id !== sectionId));

//         // Actual API call
//         await deleteSection(sectionId);

//         showSuccess(`Section "${sectionToDelete?.name || "Unknown"}" deleted successfully`);
//       } catch (error) {
//         // Rollback on error
//         setOptimisticSections(sections);
//         showError("Failed to delete section");
//         console.error("Failed to delete section:", error);
//       }
//     },
//     [optimisticSections, deleteSection, sections, showSuccess, showError]
//   );

//   const handleDeleteAssignment = useCallback(
//     async (assignmentId: string) => {
//       try {
//         // Optimistic update
//         setOptimisticAssignments(prev => prev.filter(a => a.id !== assignmentId));

//         // Actual API call
//         await deleteAssignment(assignmentId);

//         showSuccess("Assignment deleted successfully");
//       } catch (error) {
//         // Rollback on error
//         setOptimisticAssignments(sectionAssignments);
//         showError("Failed to delete assignment");
//         console.error("Failed to delete assignment:", error);
//       }
//     },
//     [deleteAssignment, sectionAssignments, showSuccess, showError]
//   );

//   useEffect(() => {
//     console.log("optimisticInnerSections updated:", optimisticInnerSections);
//   }, [optimisticInnerSections]);

//   useEffect(() => {
//     console.log(
//       "Filtered inner sections:",
//       optimisticInnerSections.filter(is => is.sectionId === selectedSectionId)
//     );
//   }, [optimisticInnerSections, selectedSectionId]);

//   // Add these useEffect hooks
//   useEffect(() => {
//     console.log("Current editingInnerSection:", editingInnerSection);
//   }, [editingInnerSection]);

//   useEffect(() => {
//     console.log("Current optimisticInnerSections:", optimisticInnerSections);
//   }, [optimisticInnerSections]);

//   useEffect(() => {
//     console.log("Editing inner section state:", editingInnerSection);
//   }, [editingInnerSection]);

//   // In handleUpdateInnerSection

//   return (
//     <div className="space-y-6">
//       {/* Error and Success Alerts */}
//       {error && (
//         <Alert variant="destructive">
//           <AlertCircle className="h-4 w-4" />
//           <AlertDescription>{error}</AlertDescription>
//         </Alert>
//       )}
//       {successMessage && (
//         <Alert variant="default" className="border-green-500 text-green-700">
//           <AlertDescription>{successMessage}</AlertDescription>
//         </Alert>
//       )}

//       {/* Sections Table */}
//       <SectionsTable
//         sectionsWithAssignments={sectionsWithAssignments}
//         selectedSectionId={selectedSectionId}
//         setSelectedItem={item => {
//           setDetailModalItem({ type: "section", data: item.data });
//           setIsDetailModalOpen(true);
//         }}
//         setIsDetailModalOpen={setIsDetailModalOpen}
//         setEditingSection={setEditingSection}
//         setShowSectionForm={setShowSectionForm}
//         handleDeleteSection={handleDeleteSection}
//         setSelectedSectionId={setSelectedSectionId}
//         setShowAssignmentForm={setShowAssignmentForm}
//         setEditingAssignment={setEditingAssignment}
//         handleDeleteAssignment={handleDeleteAssignment}
//       />

//       {/* Inner Sections Table */}
//       <InnerSectionsTable
//         innerSections={useMemo(() => optimisticInnerSections.filter(is => is.sectionId === selectedSectionId), [optimisticInnerSections, selectedSectionId])}
//         sections={optimisticSections}
//         selectedSectionId={selectedSectionId}
//         selectedInnerSectionId={selectedInnerSectionId}
//         setSelectedItem={memoizedSetSelectedItem}
//         setIsDetailModalOpen={setIsDetailModalOpen}
//         setEditingInnerSection={setEditingInnerSection}
//         setShowInnerSectionForm={setShowInnerSectionForm}
//         onDeleteInnerSection={handleDeleteInnerSection}
//         setSelectedInnerSectionId={setSelectedInnerSectionId}
//         onCreateTable={handleCreateTable}
//       />

//       {/* Section Form Modal */}
//       <Dialog open={showSectionForm} onOpenChange={setShowSectionForm}>
//         <DialogContent>
//           <DialogHeader>
//             <DialogTitle>{editingSection ? "Edit Section" : "Add Section"}</DialogTitle>
//           </DialogHeader>
//           <SectionForm
//             section={editingSection}
//             onSubmit={editingSection ? handleUpdateSection : handleCreateSection}
//             onCancel={() => {
//               setShowSectionForm(false);
//               setEditingSection(undefined);
//             }}
//           />
//         </DialogContent>
//       </Dialog>

//       {/* Inner Section Form Modal */}
//       <Dialog
//         open={showInnerSectionForm}
//         onOpenChange={open => {
//           if (!open) {
//             setShowInnerSectionForm(false);
//             setEditingInnerSection(undefined);
//           }
//         }}
//       >
//         <DialogContent>
//           <DialogHeader>
//             <DialogTitle>{editingInnerSection ? "Edit Inner Section" : "Add Inner Section"}</DialogTitle>
//           </DialogHeader>
//           <InnerSectionForm
//             key={editingInnerSection?.id || "create"} // Force re-render
//             innerSection={editingInnerSection}
//             sections={optimisticSections}
//             preSelectedSectionId={selectedSectionId}
//             setShowInnerSectionForm={setShowInnerSectionForm}
//             onSubmit={async data => {
//               try {
//                 if (editingInnerSection) {
//                   await handleUpdateInnerSection(data);
//                 } else {
//                   await handleCreateInnerSection(data);
//                 }
//               } finally {
//                 setShowInnerSectionForm(false);
//               }
//             }}
//             onCancel={() => {
//               setShowInnerSectionForm(false);
//               setEditingInnerSection(undefined);
//             }}
//           />
//         </DialogContent>
//       </Dialog>

//       {/* Table Form Modal */}
//       <Dialog open={showTableForm} onOpenChange={setShowTableForm}>
//         <DialogContent>
//           <DialogHeader>
//             <DialogTitle>{editingTable ? "Edit Table" : "Add Table"}</DialogTitle>
//           </DialogHeader>
//           <TablesForm
//             table={editingTable}
//             innerSections={optimisticInnerSections}
//             preSelectedInnerSectionId={selectedInnerSectionId}
//             parentSectionId={selectedSectionId}
//             onSubmit={editingTable ? handleUpdateTable : handleCreateTable}
//             onCancel={() => {
//               setShowTableForm(false);
//               setEditingTable(undefined);
//             }}
//           />
//         </DialogContent>
//       </Dialog>

//       {/* Assignment Form Modal */}
//       <Dialog open={showAssignmentForm} onOpenChange={setShowAssignmentForm}>
//         <DialogContent>
//           <DialogHeader>
//             <DialogTitle>{editingAssignment ? "Edit Assignment" : "Add Assignment"}</DialogTitle>
//           </DialogHeader>
//           <AssignmentForm
//             assignment={editingAssignment}
//             sections={optimisticSections}
//             innerSections={optimisticInnerSections}
//             tables={optimisticTables}
//             materials={materials}
//             menuItems={menuItems}
//             stockEntries={stockEntries}
//             selectedSectionId={selectedSectionId}
//             onSubmit={editingAssignment ? handleUpdateAssignment : handleCreateAssignment}
//             onCancel={() => {
//               setShowAssignmentForm(false);
//               setEditingAssignment(undefined);
//             }}
//           />
//         </DialogContent>
//       </Dialog>

//       {/* Detail Modal */}
//       <DetailModal
//         isOpen={isDetailModalOpen}
//         onClose={() => setIsDetailModalOpen(false)}
//         selectedItem={detailModalItem}
//         materialsWithSectionAssignments={materialsWithSectionAssignments}
//         sectionsWithAssignments={sectionsWithAssignments}
//         onShowAssignmentForm={setShowAssignmentForm}
//         onAddAssignment={sectionId => {
//           setSelectedSectionId(sectionId);
//           setShowAssignmentForm(true);
//         }}
//         onEditAssignment={setEditingAssignment}
//         onDeleteAssignment={handleDeleteAssignment}
//       />
//     </div>
//   );
// }

import { InnerSectionForm } from "@/components/sections/InnerSectionForm";
import { InnerSectionsTable } from "@/components/sections/InnerSectionsTable";
import { SectionForm } from "@/components/sections/SectionForm";
import { SectionsTable } from "@/components/sections/SectionsTable";
import { TablesForm } from "@/components/sections/TablesForm";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { DetailModal } from "@/components/ui/DetailModal";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useInventoryCRUD } from "@/hooks/useInventoryCRUD";
import { CreateInnerSectionData, CreateSectionAssignmentData, CreateSectionData, CreateTableData, InnerSection, Material, MenuItem, Section, SectionAssignment, StockEntry, Tables, UpdateSectionData } from "@/types/inventory";
import { AlertCircle } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AssignmentForm } from "./AssignmentForm";

interface SectionsManagementPanelProps {
  sections?: Section[];
  sectionAssignments?: SectionAssignment[];
  innerSections?: InnerSection[];
  materials?: Material[];
  stockEntries?: StockEntry[];
  menuItems?: MenuItem[];
  tables?: Tables[];
  onDataRefresh?: () => void;
}

export function SectionsManagementPanel({ sections = [], sectionAssignments = [], innerSections = [], materials = [], stockEntries = [], menuItems = [], tables = [], onDataRefresh }: SectionsManagementPanelProps) {
  const [selectedSectionId, setSelectedSectionId] = useState<string>(sections[0]?.id || "");
  const [selectedInnerSectionId, setSelectedInnerSectionId] = useState<string>("");
  const [showSectionForm, setShowSectionForm] = useState(false);
  const [showInnerSectionForm, setShowInnerSectionForm] = useState(false);
  const [showTableForm, setShowTableForm] = useState(false);
  const [showAssignmentForm, setShowAssignmentForm] = useState(false);
  const [editingSection, setEditingSection] = useState<Section | undefined>();
  const [editingInnerSection, setEditingInnerSection] = useState<InnerSection | undefined>();
  const [editingTable, setEditingTable] = useState<Tables | undefined>();
  const [editingAssignment, setEditingAssignment] = useState<SectionAssignment | undefined>();
  const [detailModalItem, setDetailModalItem] = useState<{ type: "material" | "section" | "assignment" | "stock" | "innerSection" | "table"; data: any } | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [optimisticSections, setOptimisticSections] = useState<Section[]>(sections);
  const [optimisticInnerSections, setOptimisticInnerSections] = useState<InnerSection[]>(innerSections);
  const [optimisticTables, setOptimisticTables] = useState<Tables[]>(tables);
  const [optimisticAssignments, setOptimisticAssignments] = useState<SectionAssignment[]>(sectionAssignments);

  // Initialize CRUD operations
  const { createSection, updateSection, deleteSection, createInnerSection, updateInnerSection, deleteInnerSection, createTable, updateTable, deleteTable, createAssignment, updateAssignment, deleteAssignment, getInnerSections } = useInventoryCRUD(onDataRefresh);

  // Helper functions
  const showError = useCallback((message: string) => {
    setError(message);
    setTimeout(() => setError(null), 5000);
  }, []);

  const showSuccess = useCallback((message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), 3000);
  }, []);

  // CRUD operations
  const handleCreateSection = useCallback(
    async (data: CreateSectionData) => {
      try {
        const tempSection: Section = {
          id: `temp-${Date.now()}`,
          ...data,
          createdAt: new Date(),
          updatedAt: new Date(),
          innerSections: []
        };
        setOptimisticSections(prev => [...prev, tempSection]);

        const createdSection = await createSection(data);
        setOptimisticSections(prev => prev.map(s => (s.id === tempSection.id ? createdSection : s)));
        showSuccess(`Section "${data.name}" created successfully`);
        setShowSectionForm(false);
      } catch (error) {
        setOptimisticSections(sections);
        showError("Failed to create section");
        console.error("Failed to create section:", error);
      }
    },
    [createSection, sections, showSuccess, showError]
  );

  const handleUpdateSection = useCallback(
    async (data: UpdateSectionData) => {
      if (!editingSection) return;

      try {
        setOptimisticSections(prev => prev.map(s => (s.id === editingSection.id ? { ...s, ...data, updatedAt: new Date() } : s)));
        await updateSection(editingSection.id, data);
        showSuccess(`Section "${data.name}" updated successfully`);
        setShowSectionForm(false);
        setEditingSection(undefined);
      } catch (error) {
        setOptimisticSections(sections);
        showError("Failed to update section");
        console.error("Failed to update section:", error);
      }
    },
    [editingSection, sections, updateSection, showSuccess, showError]
  );

  const handleCreateAssignment = useCallback(
    async (data: CreateSectionAssignmentData) => {
      try {
        const tempAssignment: SectionAssignment = {
          id: `temp-${Date.now()}`,
          ...data,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        setOptimisticAssignments(prev => [...prev, tempAssignment]);

        const createdAssignment = await createAssignment(data);
        setOptimisticAssignments(prev => prev.map(a => (a.id === tempAssignment.id ? createdAssignment : a)));
        showSuccess("Assignment created successfully");
        setShowAssignmentForm(false);
      } catch (error) {
        setOptimisticAssignments(sectionAssignments);
        showError("Failed to create assignment");
        console.error("Failed to create assignment:", error);
      }
    },
    [createAssignment, sectionAssignments, showSuccess, showError]
  );

  // const handleCreateInnerSection = useCallback(
  //   async (data: CreateInnerSectionData) => {
  //     try {
  //       const tempInnerSection: InnerSection = {
  //         id: `temp-${Date.now()}`,
  //         ...data,
  //         tables: [],
  //         status: "active"
  //       };
  //       setOptimisticInnerSections(prev => [...prev, tempInnerSection]);

  //       const createdInnerSection = await createInnerSection(data);
  //       setOptimisticInnerSections(prev => prev.map(is => (is.id === tempInnerSection.id ? createdInnerSection : is)));
  //       setOptimisticSections(prev => prev.map(s => (s.id === data.sectionId ? { ...s, innerSections: [...(s.innerSections || []), createdInnerSection] } : s)));

  //       showSuccess(`Inner section "${data.name}" created successfully`);
  //       setShowInnerSectionForm(false);
  //     } catch (error) {
  //       setOptimisticInnerSections(innerSections);
  //       showError("Failed to create inner section");
  //       console.error("Failed to create inner section:", error);
  //     }
  //   },
  //   [createInnerSection, innerSections, showSuccess, showError]
  // );

  // const handleUpdateInnerSection = useCallback(
  //   async (data: UpdateInnerSectionData) => {
  //     if (!editingInnerSection) return;

  //     try {
  //       const updatedInnerSection = {
  //         ...editingInnerSection,
  //         ...data,
  //         updatedAt: new Date()
  //       };

  //       setOptimisticInnerSections(prev => prev.map(is => (is.id === editingInnerSection.id ? updatedInnerSection : is)));
  //       await updateInnerSection(editingInnerSection.id, data);
  //       showSuccess("Inner section updated successfully");
  //     } catch (error) {
  //       setOptimisticInnerSections(innerSections);
  //       showError("Failed to update inner section");
  //       console.error("Failed to update inner section:", error);
  //     }
  //   },
  //   [editingInnerSection, innerSections, updateInnerSection, showSuccess, showError]
  // );
  // For creation
  const handleCreateInnerSection = useCallback(
    async (data: CreateInnerSectionData) => {
      try {
        // Optimistic update
        const tempInnerSection: InnerSection = {
          id: `temp-${Date.now()}`,
          ...data,
          tables: [],
          status: "active",
          createdAt: new Date(),
          updatedAt: new Date()
        };
        setOptimisticInnerSections(prev => [...prev, tempInnerSection]);

        // API call
        const createdInnerSection = await createInnerSection(data);

        // Replace temp with actual data
        setOptimisticInnerSections(prev => prev.map(is => (is.id === tempInnerSection.id ? createdInnerSection : is)));

        showSuccess("Inner section created successfully");
        setShowInnerSectionForm(false);
      } catch (error) {
        setOptimisticInnerSections(innerSections);
        showError("Failed to create inner section");
      }
    },
    [createInnerSection, innerSections, showSuccess, showError]
  );

  // For deletion
  const handleDeleteInnerSection = useCallback(
    async (innerSectionId: string) => {
      try {
        // Optimistic update
        setOptimisticInnerSections(prev => prev.filter(is => is.id !== innerSectionId));

        await deleteInnerSection(innerSectionId);
        showSuccess("Inner section deleted successfully");
      } catch (error) {
        setOptimisticInnerSections(innerSections);
        showError("Failed to delete inner section");
      }
    },
    [deleteInnerSection, innerSections, showSuccess, showError]
  );

  // const handleDeleteInnerSection = useCallback(
  //   async (innerSectionId: string) => {
  //     try {
  //       const innerSectionToDelete = optimisticInnerSections.find(is => is.id === innerSectionId);
  //       setOptimisticInnerSections(prev => prev.filter(is => is.id !== innerSectionId));
  //       setOptimisticSections(prev =>
  //         prev.map(s => ({
  //           ...s,
  //           innerSections: s.innerSections?.filter(is => is.id !== innerSectionId) || []
  //         }))
  //       );

  //       await deleteInnerSection(innerSectionId);
  //       showSuccess(`Inner section "${innerSectionToDelete?.name || "Unknown"}" deleted successfully`);
  //     } catch (error) {
  //       setOptimisticInnerSections(innerSections);
  //       showError("Failed to delete inner section");
  //       console.error("Failed to delete inner section:", error);
  //     }
  //   },
  //   [optimisticInnerSections, deleteInnerSection, innerSections, showSuccess, showError]
  // );

  const handleCreateTable = useCallback(
    async (data: CreateTableData) => {
      try {
        await createTable(data);
        setShowTableForm(false);

        setOptimisticInnerSections(prev =>
          prev.map(section =>
            section.id === data.innerSectionId
              ? {
                  ...section,
                  tables: [
                    ...(section.tables || []),
                    {
                      id: `temp-${Date.now()}`,
                      ...data,
                      isReserved: false
                    }
                  ]
                }
              : section
          )
        );
        showSuccess("Table created successfully");
      } catch (error) {
        console.error("Failed to create table:", error);
        showError("Failed to create table");
        setOptimisticInnerSections(innerSections);
      }
    },
    [createTable, innerSections, showSuccess, showError]
  );

  const handleDeleteSection = useCallback(
    async (sectionId: string) => {
      try {
        const sectionToDelete = optimisticSections.find(s => s.id === sectionId);
        setOptimisticSections(prev => prev.filter(s => s.id !== sectionId));
        await deleteSection(sectionId);
        showSuccess(`Section "${sectionToDelete?.name || "Unknown"}" deleted successfully`);
      } catch (error) {
        setOptimisticSections(sections);
        showError("Failed to delete section");
        console.error("Failed to delete section:", error);
      }
    },
    [optimisticSections, deleteSection, sections, showSuccess, showError]
  );

  const handleDeleteAssignment = useCallback(
    async (assignmentId: string) => {
      try {
        setOptimisticAssignments(prev => prev.filter(a => a.id !== assignmentId));
        await deleteAssignment(assignmentId);
        showSuccess("Assignment deleted successfully");
      } catch (error) {
        setOptimisticAssignments(sectionAssignments);
        showError("Failed to delete assignment");
        console.error("Failed to delete assignment:", error);
      }
    },
    [deleteAssignment, sectionAssignments, showSuccess, showError]
  );

  // Memoized derived data
  const sectionsWithAssignments = useMemo(() => {
    return optimisticSections.map(section => ({
      ...section,
      assignments: optimisticAssignments.filter(a => a.sectionId === section.id),
      totalValue: optimisticAssignments.filter(a => a.sectionId === section.id).reduce((sum, a) => sum + (a.assignedQuantity || 0), 0)
    }));
  }, [optimisticSections, optimisticAssignments]);

  const filteredInnerSections = useMemo(() => optimisticInnerSections.filter(is => is.sectionId === selectedSectionId), [optimisticInnerSections, selectedSectionId]);

  // Effects
  useEffect(() => {
    const fetchInnerSections = async () => {
      if (selectedSectionId) {
        try {
          const data = await getInnerSections(selectedSectionId);
          setOptimisticInnerSections(data);
        } catch (error) {
          console.error("Failed to fetch inner sections:", error);
          showError("Failed to load inner sections");
        }
      }
    };
    fetchInnerSections();
  }, [selectedSectionId, showError]);

  useEffect(() => {
    setOptimisticSections(sections);
    setOptimisticTables(tables);
    setOptimisticAssignments(sectionAssignments);
  }, [sections, tables, sectionAssignments]);

  useEffect(() => {
    if (!selectedSectionId && sections.length > 0) {
      setSelectedSectionId(sections[0].id);
    }
  }, [selectedSectionId, sections]);

  // Add this state updater function
  const updateInnerSectionsState = useCallback((updatedInnerSection: InnerSection) => {
    setOptimisticInnerSections(prev => prev.map(is => (is.id === updatedInnerSection.id ? updatedInnerSection : is)));
  }, []);

  const handleUpdateInnerSection = useCallback(
    async (updatedInnerSection: InnerSection) => {
      try {
        // Optimistic update
        setOptimisticInnerSections(prev => prev.map(is => (is.id === updatedInnerSection.id ? updatedInnerSection : is)));

        // API call with just the changed fields
        await updateInnerSection(updatedInnerSection.id, {
          sectionId: updatedInnerSection.sectionId,
          name: updatedInnerSection.name,
          type: updatedInnerSection.type
        });

        showSuccess("Inner section updated successfully");
        setShowInnerSectionForm(false);
        setEditingInnerSection(undefined);
      } catch (error) {
        // Rollback
        setOptimisticInnerSections(innerSections);
        showError("Failed to update inner section");
      }
    },
    [innerSections, updateInnerSection, showSuccess, showError]
  );

  return (
    <div className="space-y-6">
      {/* Error and Success Alerts */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {successMessage && (
        <Alert variant="default" className="border-green-500 text-green-700">
          <AlertDescription>{successMessage}</AlertDescription>
        </Alert>
      )}

      {/* Sections Table */}
      <SectionsTable
        sectionsWithAssignments={sectionsWithAssignments}
        selectedSectionId={selectedSectionId}
        sections={optimisticSections}
        setSelectedItem={item => {
          setDetailModalItem({ type: item.type as any, data: item.data });
          setIsDetailModalOpen(true);
        }}
        setIsDetailModalOpen={setIsDetailModalOpen}
        setEditingSection={setEditingSection}
        setShowSectionForm={setShowSectionForm}
        handleDeleteSection={handleDeleteSection}
        setSelectedSectionId={setSelectedSectionId}
        setShowAssignmentForm={setShowAssignmentForm}
        setEditingAssignment={setEditingAssignment}
        handleDeleteAssignment={handleDeleteAssignment}
      />

      {/* Inner Sections Table */}
      {selectedSectionId && (
        <InnerSectionsTable
          innerSections={filteredInnerSections}
          sections={optimisticSections}
          selectedSectionId={selectedSectionId}
          selectedInnerSectionId={selectedInnerSectionId}
          setSelectedItem={item => {
            setDetailModalItem({ type: "innerSection", data: item.data });
            setIsDetailModalOpen(true);
          }}
          setIsDetailModalOpen={setIsDetailModalOpen}
          setEditingInnerSection={setEditingInnerSection}
          setShowInnerSectionForm={setShowInnerSectionForm}
          onDeleteInnerSection={handleDeleteInnerSection}
          setSelectedInnerSectionId={setSelectedInnerSectionId}
          onCreateTable={handleCreateTable}
          onInnerSectionUpdated={updateInnerSectionsState}
        />
      )}

      {/* Forms */}
      <Dialog open={showSectionForm} onOpenChange={setShowSectionForm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingSection ? "Edit Section" : "Add New Section"}</DialogTitle>
          </DialogHeader>
          <SectionForm
            sections={optimisticSections}
            editingSection={editingSection}
            onSubmit={editingSection ? handleUpdateSection : handleCreateSection}
            onCancel={() => {
              setShowSectionForm(false);
              setEditingSection(undefined);
            }}
          />
        </DialogContent>
      </Dialog>

      <Dialog
        open={showInnerSectionForm}
        onOpenChange={open => {
          if (!open) {
            setShowInnerSectionForm(false);
            setEditingInnerSection(undefined);
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingInnerSection ? "Edit Inner Section" : "Add New Inner Section"}</DialogTitle>
          </DialogHeader>
          <InnerSectionForm
            innerSection={editingInnerSection}
            sections={optimisticSections}
            onSubmit={editingInnerSection ? handleUpdateInnerSection : handleCreateInnerSection}
            onCancel={() => {
              setShowInnerSectionForm(false);
              setEditingInnerSection(undefined);
            }}
            existingInnerSectionNames={optimisticInnerSections.filter(is => is.sectionId === (editingInnerSection?.sectionId || selectedSectionId)).map(is => is.name)}
            preSelectedSectionId={selectedSectionId}
            setShowInnerSectionForm={setShowInnerSectionForm}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={showTableForm} onOpenChange={setShowTableForm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Table</DialogTitle>
          </DialogHeader>
          {selectedInnerSectionId && <TablesForm innerSections={filteredInnerSections} preSelectedInnerSectionId={selectedInnerSectionId} parentSectionId={selectedSectionId} existingTableNumbers={optimisticInnerSections.find(is => is.id === selectedInnerSectionId)?.tables?.map(t => t.tableNumber) || []} onSubmit={handleCreateTable} onCancel={() => setShowTableForm(false)} />}
        </DialogContent>
      </Dialog>

      <Dialog open={showAssignmentForm} onOpenChange={setShowAssignmentForm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingAssignment ? "Edit Assignment" : "Add New Assignment"}</DialogTitle>
          </DialogHeader>
          <AssignmentForm
            sections={optimisticSections}
            materials={materials}
            stockEntries={stockEntries}
            editingAssignment={editingAssignment}
            onSubmit={handleCreateAssignment}
            onCancel={() => {
              setShowAssignmentForm(false);
              setEditingAssignment(undefined);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Detail Modal */}
      <DetailModal isOpen={isDetailModalOpen} onClose={() => setIsDetailModalOpen(false)} item={detailModalItem} />
    </div>
  );
}
