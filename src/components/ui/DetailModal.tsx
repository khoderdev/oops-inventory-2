import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Material, MaterialWithStock, Section, SectionAssignment, SectionWithAssignments, StockEntry } from "@/types/inventory";
import { formatCurrency, formatNumber } from "@/utils/conversionLogic";
import { getCategoryLabel } from "@/utils/getCategoryLabel";

export const DetailModal = ({ isOpen, onClose, selectedItem, materialsWithSectionAssignments, sectionsWithAssignments }: { isOpen: boolean; onClose: () => void; selectedItem: { type: "material" | "stock" | "section" | "assignment"; data: any } | null; materialsWithSectionAssignments: MaterialWithStock[]; sectionsWithAssignments: SectionWithAssignments[] }) => {
  if (!selectedItem) return null;

  const renderMaterialDetails = (material: MaterialWithStock) => {
    const materialWithAssignments = materialsWithSectionAssignments.find(m => m.id === material.id);
    const sectionAssignments = materialWithAssignments?.sectionAssignments || [];

    return (
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold">{material.name}</h3>
          <p className="text-muted-foreground">{material.description}</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium">Category</h4>
            <p>{getCategoryLabel(material.category)}</p>
          </div>
          <div>
            <h4 className="font-medium">Base Unit</h4>
            <p>{material.baseUnit}</p>
          </div>
          <div>
            <h4 className="font-medium">Unit Type</h4>
            <p>{material.unitType}</p>
          </div>
          <div>
            <h4 className="font-medium">Cost per Unit</h4>
            <p>
              {formatCurrency(material.costPerBaseUnit)}/{material.baseUnit}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <h4 className="font-medium">Total Quantity</h4>
            <p>
              {formatNumber(material.totalQuantityInBaseUnit)} {material.baseUnit}
            </p>
          </div>
          <div>
            <h4 className="font-medium">Available Quantity</h4>
            <p>
              {formatNumber(materialWithAssignments?.availableQuantity || material.totalQuantityInBaseUnit)} {material.baseUnit}
            </p>
          </div>
          <div>
            <h4 className="font-medium">Total Value</h4>
            <p>{formatCurrency(material.totalValue)}</p>
          </div>
        </div>

        {sectionAssignments.length > 0 && (
          <div>
            <h4 className="font-medium">Section Assignments</h4>
            <div className="space-y-2 mt-2">
              {sectionAssignments.map((assignment, index) => (
                <div key={index} className="flex justify-between items-center p-2 bg-muted/50 rounded">
                  <span>{assignment.sectionName}</span>
                  <span>
                    {formatNumber(assignment.assignedQuantity)} {assignment.assignedUnit}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderStockDetails = (stock: StockEntry) => {
    const material = materialsWithSectionAssignments.find(m => m.id === stock.materialId);

    return (
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold">{material?.name || "Unknown Material"}</h3>
          <p className="text-muted-foreground">{material?.description}</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium">Supplier</h4>
            <p>{stock.supplier}</p>
          </div>
          <div>
            <h4 className="font-medium">Purchase Date</h4>
            <p>{stock.purchaseDate.toLocaleDateString()}</p>
          </div>
          <div>
            <h4 className="font-medium">Quantity</h4>
            <p>
              {formatNumber(stock.purchasedQuantity)} {stock.purchasedUnit}
            </p>
          </div>
          <div>
            <h4 className="font-medium">Unit Cost</h4>
            <p>
              {formatCurrency(stock.costPerPurchasedUnit)}/{stock.purchasedUnit}
            </p>
          </div>
          <div>
            <h4 className="font-medium">Total Cost</h4>
            <p>{formatCurrency(stock.totalCost)}</p>
          </div>
          {stock.expiryDate && (
            <div>
              <h4 className="font-medium">Expiry Date</h4>
              <p>{stock.expiryDate.toLocaleDateString()}</p>
            </div>
          )}
          {stock.batchNumber && (
            <div>
              <h4 className="font-medium">Batch Number</h4>
              <p>{stock.batchNumber}</p>
            </div>
          )}
        </div>

        {stock.notes && (
          <div>
            <h4 className="font-medium">Notes</h4>
            <p className="text-muted-foreground">{stock.notes}</p>
          </div>
        )}
      </div>
    );
  };

  const renderSectionDetails = (section: Section) => {
    const sectionWithAssignments = sectionsWithAssignments.find(s => s.id === section.id);

    return (
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold">{section.name}</h3>
          <p className="text-muted-foreground">{section.description}</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium">Total Assignments</h4>
            <p>{sectionWithAssignments?.assignments.length || 0}</p>
          </div>
          <div>
            <h4 className="font-medium">Total Value</h4>
            <p>{formatCurrency(sectionWithAssignments?.totalValue || 0)}</p>
          </div>
        </div>

        {sectionWithAssignments?.assignments && sectionWithAssignments.assignments.length > 0 && (
          <div>
            <h4 className="font-medium">Assigned Items</h4>
            <div className="space-y-2 mt-2">
              {sectionWithAssignments.assignments.map((assignment, index) => (
                <div key={index} className="p-2 bg-muted/50 rounded">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{assignment.material?.name}</span>
                    <span>
                      {formatNumber(assignment.assignedQuantity)} {assignment.assignedUnit}
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground">Value: {formatCurrency(assignment.assignedQuantity * (assignment.stockEntry?.costPerPurchasedUnit || 0))}</div>
                  {assignment.notes && <div className="text-sm text-muted-foreground mt-1">Notes: {assignment.notes}</div>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderAssignmentDetails = (assignment: SectionAssignment & { stockEntry?: StockEntry; material?: Material }) => {
    return (
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold">{assignment.material?.name || "Unknown Material"}</h3>
          <p className="text-muted-foreground">Assigned to: {sections.find(s => s.id === assignment.sectionId)?.name || "Unknown Section"}</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium">Assigned Quantity</h4>
            <p>
              {formatNumber(assignment.assignedQuantity)} {assignment.assignedUnit}
            </p>
          </div>
          <div>
            <h4 className="font-medium">Original Quantity</h4>
            <p>
              {formatNumber(assignment.stockEntry?.purchasedQuantity || 0)} {assignment.stockEntry?.purchasedUnit}
            </p>
          </div>
          <div>
            <h4 className="font-medium">Unit Cost</h4>
            <p>
              {formatCurrency(assignment.stockEntry?.costPerPurchasedUnit || 0)}/{assignment.stockEntry?.purchasedUnit}
            </p>
          </div>
          <div>
            <h4 className="font-medium">Total Value</h4>
            <p>{formatCurrency(assignment.assignedQuantity * (assignment.stockEntry?.costPerPurchasedUnit || 0))}</p>
          </div>
        </div>

        {assignment.notes && (
          <div>
            <h4 className="font-medium">Notes</h4>
            <p className="text-muted-foreground">{assignment.notes}</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {selectedItem.type === "material" && "Material Details"}
            {selectedItem.type === "stock" && "Stock Entry Details"}
            {selectedItem.type === "section" && "Section Details"}
            {selectedItem.type === "assignment" && "Assignment Details"}
          </DialogTitle>
        </DialogHeader>
        <div className="py-4">
          {selectedItem.type === "material" && renderMaterialDetails(selectedItem.data)}
          {selectedItem.type === "stock" && renderStockDetails(selectedItem.data)}
          {selectedItem.type === "section" && renderSectionDetails(selectedItem.data)}
          {selectedItem.type === "assignment" && renderAssignmentDetails(selectedItem.data)}
        </div>
      </DialogContent>
    </Dialog>
  );
};
