import { AssignmentForm } from "@/components/sections/AssignmentForm";
import { SectionForm } from "@/components/sections/SectionForm";
import { SectionsTable } from "@/components/sections/SectionsTable";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { DetailModal } from "@/components/ui/DetailModal";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useInventoryCRUD } from "@/hooks/useInventoryCRUD";
import { CreateSectionAssignmentData, CreateSectionData, Material, MaterialWithSectionAssignments, MenuItem, Section, SectionAssignment, SectionWithAssignments, StockEntry, UpdateSectionAssignmentData, UpdateSectionData } from "@/types/inventory";
import { AlertCircle } from "lucide-react";
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
  onDataRefresh?: () => void;
}

export function SectionsManagementPanel({ sections, sectionAssignments, materials, stockEntries, menuItems, onCreateSection, onUpdateSection, onDeleteSection, onDataRefresh }: SectionsManagementPanelProps) {
  const [selectedSectionId, setSelectedSectionId] = useState<string>("");
  const [showSectionForm, setShowSectionForm] = useState(false);
  const [showAssignmentForm, setShowAssignmentForm] = useState(false);
  const [editingSection, setEditingSection] = useState<Section | undefined>();
  const [editingAssignment, setEditingAssignment] = useState<SectionAssignment | undefined>();
  const [, setSelectedItem] = useState<{ type: string; data: SectionWithAssignments } | null>(null);
  const [detailModalItem, setDetailModalItem] = useState<{ type: "material" | "section" | "assignment" | "stock"; data: StockEntry | Section | SectionAssignment | MaterialWithSectionAssignments } | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const setSelectedSectionIdWithLogging = useCallback((newValue: string) => {
    setSelectedSectionId(newValue);
  }, []);

  const [optimisticSections, setOptimisticSections] = useState<Section[]>(sections);
  const [optimisticAssignments, setOptimisticAssignments] = useState<SectionAssignment[]>(sectionAssignments);
  const [error, setError] = useState<string | null>(null);
  const [, setSuccessMessage] = useState<string | null>(null);
  const errorTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const successTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

  useEffect(() => {
    setOptimisticSections(sections);
    setOptimisticAssignments(sectionAssignments);
  }, [sections, sectionAssignments]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setOptimisticSections(sections);
      setOptimisticAssignments(sectionAssignments);
    }, 50);

    return () => clearTimeout(timeoutId);
  }, [sections, sectionAssignments]);

  useEffect(() => {
    return () => {
      if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
      if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current);
    };
  }, []);
  const { createAssignment, updateAssignment, deleteAssignment } = useInventoryCRUD(() => {
    setOptimisticSections(sections);
    setOptimisticAssignments(sectionAssignments);
  });

  const sectionsWithAssignments: SectionWithAssignments[] = useMemo(() => {
    return optimisticSections.map(section => {
      const assignments = optimisticAssignments.filter(assignment => assignment.sectionId === section.id);
      const enrichedAssignments = assignments.map(assignment => {
        const material = materials.find(m => m.id === assignment.materialId) || ({} as Material);
        const stockEntry = stockEntries.find(s => s.id === assignment.stockEntryId) || ({} as StockEntry);
        const menuItem = menuItems.find(m => m.id === assignment.menuItemId) || ({} as MenuItem);
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

      const totalValue = enrichedAssignments.reduce((sum, assignment) => {
        if (assignment.itemType === "stockEntry" && assignment.stockEntry && assignment.assignedQuantity) {
          return sum + assignment.stockEntry.costPerPurchasedUnit * assignment.assignedQuantity;
        } else if (assignment.itemType === "menuItem" && assignment.menuItem) {
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

  const materialsWithSectionAssignments: MaterialWithSectionAssignments[] = useMemo(() => {
    return materials.map(material => {
      const materialAssignments = optimisticAssignments.filter(assignment => assignment.materialId === material.id);
      const sectionAssignments_mapped = materialAssignments.map(assignment => {
        const section = optimisticSections.find(s => s.id === assignment.sectionId);
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
        availableQuantity: 0,
        stockEntries: [],
        totalQuantityInBaseUnit: 0,
        totalValue: 0,
        averageCostPerBaseUnit: 0
      };
    });
  }, [materials, optimisticAssignments, optimisticSections]);

  const handleCreateSection = async (data: CreateSectionData) => {
    try {
      const tempSection: Section = {
        id: `temp-${Date.now()}`,
        name: data.name,
        description: data.description || "",
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
      setOptimisticSections(sections);
      showError("Failed to create section");
      console.error("Failed to create section:", error);
    }
  };

  const handleUpdateSection = async (data: UpdateSectionData) => {
    if (!editingSection || !onUpdateSection) return;
    try {
      const updateData = {
        name: data.name || editingSection.name,
        description: data.description
      };
      setOptimisticSections(prev => prev.map(section => (section.id === editingSection.id ? { ...section, ...updateData, updatedAt: new Date() } : section)));
      await onUpdateSection(editingSection.id, updateData);
      showSuccess(`Section "${updateData.name}" updated successfully`);
      setShowSectionForm(false);
      setEditingSection(undefined);
    } catch (error) {
      setOptimisticSections(sections);
      showError("Failed to update section");
      console.error("Failed to update section:", error);
    }
  };

  const handleDeleteSection = async (sectionId: string) => {
    try {
      const sectionToDelete = optimisticSections.find(s => s.id === sectionId);
      setOptimisticSections(prev => prev.filter(section => section.id !== sectionId));
      if (onDeleteSection) {
        await onDeleteSection(sectionId);
        showSuccess(`Section "${sectionToDelete?.name || "Unknown"}" deleted successfully`);
      }
    } catch (error) {
      setOptimisticSections(sections);
      showError("Failed to delete section");
      console.error("Failed to delete section:", error);
    }
  };

  const handleCreateAssignment = async (data: CreateSectionAssignmentData) => {
    try {
      const createdAssignment = await createAssignment(data);
      const newAssignment: SectionAssignment = {
        ...createdAssignment,
        id: createdAssignment.id.toString()
      };
      setOptimisticAssignments(prev => [...prev, newAssignment]);
      showSuccess("Assignment created successfully");
      if (onDataRefresh) {
        await onDataRefresh();
      }
      await new Promise(resolve => {
        setTimeout(() => {
          setOptimisticSections(sections);
          setOptimisticAssignments(sectionAssignments);
          resolve(void 0);
        }, 150);
      });
    } catch (error) {
      setOptimisticAssignments(sectionAssignments);
      showError("Failed to create assignment");
      console.error("Failed to create assignment:", error);
      throw error;
    }
  };

  const handleUpdateAssignment = async (data: UpdateSectionAssignmentData) => {
    if (!editingAssignment) return;
    try {
      const updatedAssignment = await updateAssignment(editingAssignment.id, data);

      setOptimisticAssignments(prev => prev.map(assignment => (assignment.id === editingAssignment.id ? { ...updatedAssignment, id: updatedAssignment.id.toString() } : assignment)));
      showSuccess("Assignment updated successfully");
      if (onDataRefresh) {
        await onDataRefresh();
      }

      // Force sync optimistic state with fresh props data and wait a bit longer
      await new Promise(resolve => {
        setTimeout(() => {
          setOptimisticSections(sections);
          setOptimisticAssignments(sectionAssignments);
          resolve(void 0);
        }, 150);
      });
    } catch (error) {
      // Revert to current server state on error
      setOptimisticAssignments(sectionAssignments);
      showError("Failed to update assignment");
      console.error("Failed to update assignment:", error);
      throw error; // Re-throw to handle in submission handler
    }
  };

  const handleDeleteAssignment = async (assignmentId: string) => {
    try {
      // Make API call first
      await deleteAssignment(assignmentId);

      // Update optimistic state after successful API call
      setOptimisticAssignments(prev => prev.filter(assignment => assignment.id !== assignmentId));
      showSuccess(`Assignment deleted successfully`);

      // Refresh main store data to ensure full sync
      if (onDataRefresh) {
        await onDataRefresh();
      }

      // Force sync optimistic state with fresh props data and wait a bit longer
      await new Promise(resolve => {
        setTimeout(() => {
          setOptimisticSections(sections);
          setOptimisticAssignments(sectionAssignments);
          resolve(void 0);
        }, 150);
      });
    } catch (error) {
      // Revert to current server state on error
      setOptimisticAssignments(sectionAssignments);
      showError("Failed to delete assignment");
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

  const handleAssignmentSubmit = async (data: CreateSectionAssignmentData | UpdateSectionAssignmentData) => {
    try {
      if (editingAssignment) {
        await handleUpdateAssignment(data as UpdateSectionAssignmentData);
      } else {
        await handleCreateAssignment(data as CreateSectionAssignmentData);
      }
      await new Promise(resolve => setTimeout(resolve, 100));
      setShowAssignmentForm(false);
      setEditingAssignment(undefined);
      setSelectedSectionIdWithLogging("");
      setTimeout(() => {
        setEditingAssignment(undefined);
      }, 50);
    } catch (error) {
      console.error("Assignment submission failed:", error);
    }
  };

  const handleAssignAll = async (sectionId: string, itemType: "stockEntry" | "menuItem", items: StockEntry[] | MenuItem[]) => {
    try {
      const assignmentPromises = items.map(async item => {
        const assignmentData: CreateSectionAssignmentData = {
          sectionId,
          itemType
        };

        if (itemType === "stockEntry") {
          const stockEntry = item as StockEntry;
          const material = materials.find(m => m.id === stockEntry.materialId);
          assignmentData.materialId = stockEntry.materialId;
          assignmentData.stockEntryId = stockEntry.id;
          // Assign the full available quantity
          assignmentData.assignedQuantity = stockEntry.purchasedQuantity;
          assignmentData.assignedUnit = stockEntry.purchasedUnit;
        } else if (itemType === "menuItem") {
          const menuItem = item as MenuItem;
          assignmentData.menuItemId = menuItem.id;
        }

        return createAssignment(assignmentData);
      });

      // Execute all assignments in parallel
      await Promise.all(assignmentPromises);

      // Update optimistic state
      if (onDataRefresh) {
        await onDataRefresh();
      }

      // Show success message
      showSuccess(`Successfully assigned ${items.length} ${itemType === "stockEntry" ? "stock entries" : "menu items"} to section`);

      // Close the form
      setShowAssignmentForm(false);
      setSelectedSectionIdWithLogging("");
    } catch (error) {
      console.error("Failed to assign all items:", error);
      showError(`Failed to assign all items: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  };

  const handleAddAssignmentFromModal = useCallback(
    (sectionId: string) => {
      setSelectedSectionIdWithLogging(sectionId);
      setShowAssignmentForm(true);
    },
    [setSelectedSectionIdWithLogging, setShowAssignmentForm]
  );

  return (
    <div className="">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <SectionsTable
        sectionsWithAssignments={sectionsWithAssignments}
        selectedSectionId={selectedSectionId}
        sections={sections}
        setSelectedItem={item => {
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
        setSelectedSectionId={setSelectedSectionIdWithLogging}
        setShowAssignmentForm={setShowAssignmentForm}
        setEditingAssignment={setEditingAssignment}
        handleDeleteAssignment={handleDeleteAssignment}
      />

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
            setSelectedSectionIdWithLogging("");
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
            existingAssignments={optimisticAssignments}
            selectedSectionId={selectedSectionId}
            onSubmit={handleAssignmentSubmit}
            onAssignAll={handleAssignAll}
            onCancel={() => {
              setShowAssignmentForm(false);
              setEditingAssignment(undefined);
              setSelectedSectionIdWithLogging("");
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
        onAddAssignment={handleAddAssignmentFromModal}
        onEditAssignment={setEditingAssignment}
        onDeleteAssignment={handleDeleteAssignment}
      />
    </div>
  );
}
