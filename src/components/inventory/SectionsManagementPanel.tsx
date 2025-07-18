import { AssignmentForm } from "@/components/sections/AssignmentForm";
import { SectionForm } from "@/components/sections/SectionForm";
import { SectionsTable } from "@/components/sections/SectionsTable";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { DetailModal } from "@/components/ui/DetailModal";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useInventoryCRUD } from "@/hooks/useInventoryCRUD";
import { CreateSectionAssignmentData, CreateSectionData, Material, MaterialWithSectionAssignments, MenuItem, Section, SectionAssignment, SectionWithAssignments, StockEntry, UpdateSectionAssignmentData, UpdateSectionData } from "@/types/inventory";
import { AlertCircle, Check, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

interface SectionsManagementPanelProps {
  sections: Section[];
  sectionAssignments: SectionAssignment[];
  materials: Material[];
  stockEntries: StockEntry[];
  menuItems: MenuItem[];
  onCreateSection?: (data: { name: string; description?: string }) => void;
  onUpdateSection?: (id: string, data: { name: string; description?: string }) => void;
  onDeleteSection?: (id: string) => void;
  onEditSection?: (section: Section) => void;
}

export function SectionsManagementPanel({ sections, sectionAssignments, materials, stockEntries, menuItems, onCreateSection, onUpdateSection, onDeleteSection, onEditSection }: SectionsManagementPanelProps) {
  const [selectedSectionId, setSelectedSectionId] = useState<string>("");
  const [showSectionForm, setShowSectionForm] = useState(false);
  const [showAssignmentForm, setShowAssignmentForm] = useState(false);
  const [editingSection, setEditingSection] = useState<Section | undefined>();
  const [editingAssignment, setEditingAssignment] = useState<SectionAssignment | undefined>();
  const [selectedItem, setSelectedItem] = useState<{ type: string; data: SectionWithAssignments } | null>(null);
  const [detailModalItem, setDetailModalItem] = useState<{ type: "material" | "section" | "assignment" | "stock"; data: StockEntry | Section | SectionAssignment | MaterialWithSectionAssignments } | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  
  // Optimistic state management
  const [optimisticSections, setOptimisticSections] = useState<Section[]>(sections);
  const [optimisticAssignments, setOptimisticAssignments] = useState<SectionAssignment[]>(sectionAssignments);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const errorTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const successTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Enhanced message handling with auto-clear
  const showError = useCallback((message: string) => {
    setError(message);
    if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
    errorTimeoutRef.current = setTimeout(() => setError(null), 5000);
  }, []);

  const showSuccess = useCallback((message: string) => {
    setSuccessMessage(message);
    if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current);
    successTimeoutRef.current = setTimeout(() => setSuccessMessage(null), 3000);
  }, []);

  // Update optimistic state when props change
  useEffect(() => {
    setOptimisticSections(sections);
    setOptimisticAssignments(sectionAssignments);
  }, [sections, sectionAssignments]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
      if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current);
    };
  }, []);

  // Get CRUD operations from useInventoryCRUD hook for assignments only
  const { createAssignment, updateAssignment, deleteAssignment } = useInventoryCRUD(() => {}); // Empty refetch function for now

  // Refresh data function
  const refreshData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      // Reset optimistic state to actual props
      setOptimisticSections(sections);
      setOptimisticAssignments(sectionAssignments);
      showSuccess("Data refreshed successfully");
    } catch (error) {
      console.error("Failed to refresh data:", error);
      showError("Failed to refresh data");
    } finally {
      setIsRefreshing(false);
    }
  }, [sections, sectionAssignments, showError, showSuccess]);

  // Calculate sections with assignments using optimistic state
  const sectionsWithAssignments: SectionWithAssignments[] = useMemo(() => {
    return optimisticSections.map(section => {
      const assignments = optimisticAssignments.filter(assignment => assignment.sectionId === section.id);

      // Enrich assignments with related data
      const enrichedAssignments = assignments.map(assignment => {
        const material = materials.find(m => m.id === assignment.materialId) || ({} as Material);
        const stockEntry = stockEntries.find(s => s.id === assignment.stockEntryId) || ({} as StockEntry);
        const menuItem = menuItems.find(m => m.id === assignment.menuItemId) || ({} as MenuItem);

        // Determine itemType if it's not set
        let itemType = assignment.itemType;
        if (!itemType) {
          if (assignment.menuItemId && menuItem.id) {
            itemType = "menuItem";
          } else if (assignment.materialId && (material.id || stockEntry.id)) {
            itemType = "stockEntry";
          }
        }

        return {
          ...assignment,
          itemType,
          material,
          stockEntry,
          menuItem
        };
      });

      // Calculate total value for this section
      const totalValue = enrichedAssignments.reduce((sum, assignment) => {
        if (assignment.itemType === "stockEntry" && assignment.stockEntry && assignment.assignedQuantity) {
          return sum + assignment.stockEntry.costPerPurchasedUnit * assignment.assignedQuantity;
        } else if (assignment.itemType === "menuItem" && assignment.menuItem) {
          // Menu items are typically assigned as single items, so use price directly
          return sum + assignment.menuItem.price;
        }
        return sum;
      }, 0);

      return {
        ...section,
        assignments: enrichedAssignments,
        totalValue,
        stockEntry: {} as StockEntry,
        material: {} as Material,
        menuItem: {} as MenuItem
      };
    });
  }, [optimisticSections, optimisticAssignments, materials, stockEntries, menuItems]);

  // Calculate materials with section assignments for detail modal
  const materialsWithSectionAssignments: MaterialWithSectionAssignments[] = useMemo(() => {
    return materials.map(material => {
      const materialAssignments = sectionAssignments.filter(assignment => assignment.materialId === material.id);
      const sectionAssignments_mapped = materialAssignments.map(assignment => {
        const section = sections.find(s => s.id === assignment.sectionId);
        return {
          sectionId: assignment.sectionId,
          sectionName: section?.name || "Unknown",
          assignedQuantity: assignment.assignedQuantity || 0,
          assignedUnit: assignment.assignedUnit || material.baseUnit
        };
      });

      return {
        ...material,
        sectionAssignments: sectionAssignments_mapped,
        availableQuantity: 0, // Will be calculated elsewhere
        stockEntries: [],
        totalQuantityInBaseUnit: 0,
        totalValue: 0,
        averageCostPerBaseUnit: 0
      };
    });
  }, [materials, sectionAssignments, sections]);

  const handleCreateSection = async (data: CreateSectionData) => {
    try {
      // Optimistic update - add temporary section
      const tempSection: Section = {
        id: `temp-${Date.now()}`,
        name: data.name,
        description: data.description || '',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      setOptimisticSections(prev => [...prev, tempSection]);
      
      if (onCreateSection) {
        await onCreateSection(data);
        showSuccess(`Section "${data.name}" created successfully`);
      }
      setShowSectionForm(false);
      setEditingSection(undefined);
    } catch (error) {
      // Revert optimistic update on error
      setOptimisticSections(sections);
      showError('Failed to create section');
      console.error('Failed to create section:', error);
    }
  };

  const handleUpdateSection = async (data: UpdateSectionData) => {
    if (!editingSection || !onUpdateSection) return;

    try {
      // Optimistic update
      const updateData = {
        name: data.name || editingSection.name,
        description: data.description
      };
      
      setOptimisticSections(prev => 
        prev.map(section => 
          section.id === editingSection.id 
            ? { ...section, ...updateData, updatedAt: new Date() }
            : section
        )
      );
      
      await onUpdateSection(editingSection.id, updateData);
      showSuccess(`Section "${updateData.name}" updated successfully`);
      setShowSectionForm(false);
      setEditingSection(undefined);
    } catch (error) {
      // Revert optimistic update on error
      setOptimisticSections(sections);
      showError('Failed to update section');
      console.error('Failed to update section:', error);
    }
  };

  const handleDeleteSection = async (sectionId: string) => {
    try {
      const sectionToDelete = optimisticSections.find(s => s.id === sectionId);
      
      // Optimistic update - remove section
      setOptimisticSections(prev => prev.filter(section => section.id !== sectionId));
      
      if (onDeleteSection) {
        await onDeleteSection(sectionId);
        showSuccess(`Section "${sectionToDelete?.name || 'Unknown'}" deleted successfully`);
      }
    } catch (error) {
      // Revert optimistic update on error
      setOptimisticSections(sections);
      showError('Failed to delete section');
      console.error('Failed to delete section:', error);
    }
  };

  const handleEditSection = (section: Section) => {
    if (onEditSection) {
      onEditSection(section);
    } else {
      // Fallback to local editing
      setEditingSection(section);
      setShowSectionForm(true);
    }
  };

  const handleCreateAssignment = async (data: CreateSectionAssignmentData) => {
    try {
      await createAssignment(data);
      setShowAssignmentForm(false);
      setEditingAssignment(undefined);
    } catch (error) {
      console.error("Failed to create assignment:", error);
    }
  };

  const handleUpdateAssignment = async (data: UpdateSectionAssignmentData) => {
    if (!editingAssignment) return;

    try {
      await updateAssignment(editingAssignment.id, data);
      setShowAssignmentForm(false);
      setEditingAssignment(undefined);
    } catch (error) {
      console.error("Failed to update assignment:", error);
    }
  };

  const handleDeleteAssignment = async (assignmentId: string) => {
    try {
      await deleteAssignment(assignmentId);
    } catch (error) {
      console.error("Failed to delete assignment:", error);
    }
  };

  const handleSectionSubmit = async (data: CreateSectionData | UpdateSectionData) => {
    if (editingSection) {
      await handleUpdateSection(data as UpdateSectionData);
    } else {
      await handleCreateSection(data as CreateSectionData);
    }
  };

  const handleAssignmentSubmit = (data: CreateSectionAssignmentData | UpdateSectionAssignmentData) => {
    if (editingAssignment) {
      handleUpdateAssignment(data as UpdateSectionAssignmentData);
    } else {
      handleCreateAssignment(data as CreateSectionAssignmentData);
    }
  };

  return (
    <div className="p-4 space-y-6">
      {/* Messages */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {successMessage && (
        <Alert className="border-green-200 bg-green-50 text-green-800">
          <Check className="h-4 w-4" />
          <AlertDescription>{successMessage}</AlertDescription>
        </Alert>
      )}

      {/* Header with Refresh Button */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Sections Management</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={refreshData}
          disabled={isRefreshing}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
          {isRefreshing ? "Refreshing..." : "Refresh"}
        </Button>
      </div>
      <SectionsTable
        sectionsWithAssignments={sectionsWithAssignments}
        selectedSectionId={selectedSectionId}
        sections={sections}
        setSelectedItem={item => {
          // Only set if item.data is SectionWithAssignments
          if (item.type === "section" && "assignments" in item.data) {
            setSelectedItem(item as { type: string; data: SectionWithAssignments });
            setDetailModalItem({ type: "section", data: item.data as Section });
            setIsDetailModalOpen(true);
          }
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

      {/* Section Form Modal */}
      <Dialog
        open={showSectionForm}
        onOpenChange={open => {
          if (!open) {
            setShowSectionForm(false);
            setEditingSection(undefined);
          }
        }}
      >
        <DialogContent className="w-[95vw] max-w-[500px] max-h-[90vh] overflow-y-auto p-6">
          <DialogHeader className="pb-4">
            <DialogTitle className="text-lg font-semibold">{editingSection ? "Edit Section" : "Add New Section"}</DialogTitle>
          </DialogHeader>
          <SectionForm
            section={editingSection}
            onSubmit={handleSectionSubmit}
            onCancel={() => {
              setShowSectionForm(false);
              setEditingSection(undefined);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Assignment Form Modal */}
      <Dialog
        open={showAssignmentForm}
        onOpenChange={open => {
          if (!open) {
            setShowAssignmentForm(false);
            setEditingAssignment(undefined);
          }
        }}
      >
        <DialogContent className="w-[95vw] max-w-[700px] max-h-[90vh] overflow-y-auto p-6 pt-10">
          <AssignmentForm
            sections={sections}
            stockEntries={stockEntries}
            materials={materials}
            menuItems={menuItems}
            assignment={editingAssignment}
            onSubmit={handleAssignmentSubmit}
            onCancel={() => {
              setShowAssignmentForm(false);
              setEditingAssignment(undefined);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Detail Modal */}
      <DetailModal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setDetailModalItem(null);
        }}
        selectedItem={detailModalItem}
        materialsWithSectionAssignments={materialsWithSectionAssignments}
        sectionsWithAssignments={sectionsWithAssignments}
        onShowAssignmentForm={setShowAssignmentForm}
        onEditAssignment={setEditingAssignment}
        onDeleteAssignment={handleDeleteAssignment}
      />
    </div>
  );
}
