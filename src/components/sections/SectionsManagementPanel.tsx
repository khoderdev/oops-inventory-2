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

export function SectionsManagementPanel({ sections = [], sectionAssignments = [], innerSections = [], materials = [], stockEntries = [], tables = [], onDataRefresh }: SectionsManagementPanelProps) {
  const [selectedSectionId, setSelectedSectionId] = useState<string>(sections[0]?.id || "");
  const [selectedInnerSectionId, setSelectedInnerSectionId] = useState<string>("");
  const [showSectionForm, setShowSectionForm] = useState(false);
  const [showInnerSectionForm, setShowInnerSectionForm] = useState(false);
  const [showTableForm, setShowTableForm] = useState(false);
  const [showAssignmentForm, setShowAssignmentForm] = useState(false);
  const [editingSection, setEditingSection] = useState<Section | undefined>();
  const [editingInnerSection, setEditingInnerSection] = useState<InnerSection | undefined>();
  const [editingAssignment, setEditingAssignment] = useState<SectionAssignment | undefined>();
  const [detailModalItem, setDetailModalItem] = useState<{ type: "material" | "section" | "assignment" | "stock" | "innerSection" | "table"; data: any } | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [optimisticSections, setOptimisticSections] = useState<Section[]>(sections);
  const [optimisticInnerSections, setOptimisticInnerSections] = useState<InnerSection[]>(innerSections);
  const [, setOptimisticTables] = useState<Tables[]>(tables);
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

  // Handle setting selected item with delay for modal opening
  const handleSetSelectedItem = useCallback((item: { type: "material" | "section" | "assignment" | "stock" | "innerSection" | "table"; data: any }) => {
    setDetailModalItem(item);
    // Ensure modal opens after state is set
    setTimeout(() => {
      setIsDetailModalOpen(true);
    }, 0);
  }, []);

  // Handle modal close
  const handleCloseModal = useCallback(() => {
    setIsDetailModalOpen(false);
    // Delay resetting detailModalItem to avoid race conditions
    setTimeout(() => {
      setDetailModalItem(null);
    }, 100);
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

  const handleCreateInnerSection = useCallback(
    async (data: CreateInnerSectionData) => {
      try {
        const tempInnerSection: InnerSection = {
          id: `temp-${Date.now()}`,
          ...data,
          tables: [],
          status: "active",
          createdAt: new Date(),
          updatedAt: new Date()
        };
        setOptimisticInnerSections(prev => [...prev, tempInnerSection]);

        const createdInnerSection = await createInnerSection(data);
        setOptimisticInnerSections(prev => prev.map(is => (is.id === tempInnerSection.id ? createdInnerSection : is)));
        showSuccess(`Inner section "${data.name}" created successfully`);
        setShowInnerSectionForm(false);
      } catch (error) {
        setOptimisticInnerSections(innerSections);
        showError("Failed to create inner section");
        console.error("Failed to create inner section:", error);
      }
    },
    [createInnerSection, innerSections, showSuccess, showError]
  );

  const handleUpdateInnerSection = useCallback(
    async (updatedInnerSection: InnerSection) => {
      try {
        setOptimisticInnerSections(prev => prev.map(is => (is.id === updatedInnerSection.id ? updatedInnerSection : is)));
        await updateInnerSection(updatedInnerSection.id, {
          sectionId: updatedInnerSection.sectionId,
          name: updatedInnerSection.name,
          type: updatedInnerSection.type
        });
        showSuccess("Inner section updated successfully");
        setShowInnerSectionForm(false);
        setEditingInnerSection(undefined);
      } catch (error) {
        setOptimisticInnerSections(innerSections);
        showError("Failed to update inner section");
        console.error("Failed to update inner section:", error);
      }
    },
    [innerSections, updateInnerSection, showSuccess, showError]
  );

  const handleDeleteInnerSection = useCallback(
    async (innerSectionId: string) => {
      try {
        setOptimisticInnerSections(prev => prev.filter(is => is.id !== innerSectionId));
        await deleteInnerSection(innerSectionId);
        showSuccess("Inner section deleted successfully");
      } catch (error) {
        setOptimisticInnerSections(innerSections);
        showError("Failed to delete inner section");
        console.error("Failed to delete inner section:", error);
      }
    },
    [deleteInnerSection, innerSections, showSuccess, showError]
  );

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

  // Update inner sections state
  const updateInnerSectionsState = useCallback((updatedInnerSection: InnerSection) => {
    setOptimisticInnerSections(prev => prev.map(is => (is.id === updatedInnerSection.id ? updatedInnerSection : is)));
  }, []);

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
        setSelectedItem={handleSetSelectedItem}
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
        <div>
          <InnerSectionsTable
            innerSections={filteredInnerSections}
            sections={optimisticSections}
            selectedSectionId={selectedSectionId}
            selectedInnerSectionId={selectedInnerSectionId}
            setSelectedItem={handleSetSelectedItem}
            setIsDetailModalOpen={setIsDetailModalOpen}
            setEditingInnerSection={setEditingInnerSection}
            setShowInnerSectionForm={setShowInnerSectionForm}
            onDeleteInnerSection={handleDeleteInnerSection}
            setSelectedInnerSectionId={setSelectedInnerSectionId}
            onCreateTable={handleCreateTable}
            onInnerSectionUpdated={updateInnerSectionsState}
          />
          <DetailModal isOpen={isDetailModalOpen} onClose={handleCloseModal} selectedItem={detailModalItem} materialsWithSectionAssignments={[]} sectionsWithAssignments={sectionsWithAssignments} />
        </div>
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
    </div>
  );
}
