import { AssignmentForm } from "@/components/sections/AssignmentForm";
import { SectionForm } from "@/components/sections/SectionForm";
import { SectionsTable } from "@/components/sections/SectionsTable";
import { DetailModal } from "@/components/ui/DetailModal";
import { useInventoryCRUD } from "@/hooks/useInventoryCRUD";
import { CreateSectionAssignmentData, CreateSectionData, Material, MaterialWithSectionAssignments, MenuItem, Section, SectionAssignment, SectionWithAssignments, StockEntry, UpdateSectionAssignmentData, UpdateSectionData } from "@/types/inventory";
import { useMemo, useState } from "react";

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

  // Get CRUD operations from useInventoryCRUD hook for assignments only
  const { createAssignment, updateAssignment, deleteAssignment } = useInventoryCRUD(() => {}); // Empty refetch function for now

  // Calculate sections with assignments
  const sectionsWithAssignments: SectionWithAssignments[] = useMemo(() => {
    return sections.map(section => {
      const assignments = sectionAssignments.filter(assignment => assignment.sectionId === section.id);

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
  }, [sections, sectionAssignments, materials, stockEntries, menuItems]);

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

  const handleCreateSection = (data: CreateSectionData) => {
    if (onCreateSection) {
      onCreateSection(data);
    }
    setShowSectionForm(false);
    setEditingSection(undefined);
  };

  const handleUpdateSection = (data: UpdateSectionData) => {
    if (!editingSection || !onUpdateSection) return;

    // Ensure data has required name property
    const updateData = {
      name: data.name || editingSection.name,
      description: data.description
    };
    onUpdateSection(editingSection.id, updateData);
    setShowSectionForm(false);
    setEditingSection(undefined);
  };

  const handleDeleteSection = (sectionId: string) => {
    if (onDeleteSection) {
      onDeleteSection(sectionId);
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

  const handleSectionSubmit = (data: CreateSectionData | UpdateSectionData) => {
    if (editingSection) {
      handleUpdateSection(data as UpdateSectionData);
    } else {
      handleCreateSection(data as CreateSectionData);
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
      {showSectionForm && (
        <SectionForm
          section={editingSection}
          onSubmit={handleSectionSubmit}
          onCancel={() => {
            setShowSectionForm(false);
            setEditingSection(undefined);
          }}
        />
      )}

      {/* Assignment Form Modal */}
      {showAssignmentForm && (
        <AssignmentForm
          sections={sections}
          stockEntries={stockEntries}
          materials={materials}
          assignment={editingAssignment}
          onSubmit={handleAssignmentSubmit}
          onCancel={() => {
            setShowAssignmentForm(false);
            setEditingAssignment(undefined);
          }}
        />
      )}

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
      />
    </div>
  );
}
