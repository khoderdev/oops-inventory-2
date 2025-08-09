import { MaterialTable } from "@/components/materials/MaterialTable";
import { useInventoryStore } from "@/hooks/useInventoryStore";
import { MaterialWithStock } from "@/types/inventory";
import React from "react";

interface MaterialsManagementProps {
  onDeleteMaterial?: (id: string) => void;
}

export const MaterialsManagement: React.FC<MaterialsManagementProps> = ({
  onDeleteMaterial
}) => {
  const {
    filteredMaterials,
    handleEditMaterial,
    handleAddStock,
    handleDeleteMaterial: storeDeleteMaterial
  } = useInventoryStore();

  const handleDeleteMaterialWrapper = (id: string) => {
    if (onDeleteMaterial) {
      onDeleteMaterial(id);
    } else {
      storeDeleteMaterial(id);
    }
  };

  return (
    <div className="space-y-4">
      <MaterialTable 
        filteredMaterials={filteredMaterials} 
        onEditMaterial={handleEditMaterial} 
        onAddStock={handleAddStock} 
        onDeleteMaterial={handleDeleteMaterialWrapper} 
      />
    </div>
  );
};
