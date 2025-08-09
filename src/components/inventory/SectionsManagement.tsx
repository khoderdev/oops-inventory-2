import { SectionsManagementPanel } from "@/components/sections/SectionsManagementPanel";
import { useInventoryStore } from "@/hooks/useInventoryStore";
import React from "react";

interface SectionsManagementProps {
  onCreateSection?: (data: { name: string; description?: string }) => void;
  onUpdateSection?: (id: string, data: { name: string; description?: string }) => void;
  onDeleteSection?: (id: string) => void;
}

export const SectionsManagement: React.FC<SectionsManagementProps> = ({
  onCreateSection,
  onUpdateSection,
  onDeleteSection
}) => {
  const {
    sections,
    sectionAssignments,
    materialsWithStock,
    stockEntries,
    menuItems,
    fetchTabData
  } = useInventoryStore();

  const handleDataRefresh = async () => {
    try {
      await fetchTabData("sections");
    } catch (error) {
      console.error("Failed to refresh data:", error);
    }
  };

  return (
    <div className="space-y-4">
      <SectionsManagementPanel 
        sections={sections} 
        sectionAssignments={sectionAssignments} 
        materials={materialsWithStock} 
        stockEntries={stockEntries} 
        menuItems={menuItems} 
        onCreateSection={onCreateSection} 
        onUpdateSection={onUpdateSection} 
        onDeleteSection={onDeleteSection} 
        onDataRefresh={handleDataRefresh} 
      />
    </div>
  );
};
