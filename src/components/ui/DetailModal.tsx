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
      <div className="space-y-6">
        <div>
          <h3 className="text-xl font-bold text-foreground">{material.name}</h3>
          <p className="text-sm text-muted-foreground">{material.description}</p>
        </div>

        <div className="rounded-xl border border-border bg-muted/30 p-4 shadow-sm space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
            <div>
              <h4 className="text-sm font-semibold text-muted-foreground">Category</h4>
              <p className="text-base">{getCategoryLabel(material.category)}</p>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-muted-foreground">Base Unit</h4>
              <p>{material.baseUnit}</p>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-muted-foreground">Unit Type</h4>
              <p>{material.unitType}</p>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-muted-foreground">Cost per Unit</h4>
              <p className="font-medium">
                {formatCurrency(material.costPerBaseUnit)} / {material.baseUnit}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-muted/30 p-4 shadow-sm space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-4">
            <div>
              <h4 className="text-sm font-semibold text-muted-foreground">Total Quantity</h4>
              <p>
                {formatNumber(material.totalQuantityInBaseUnit)} {material.baseUnit}
              </p>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-muted-foreground">Available Quantity</h4>
              <p>
                {formatNumber(materialWithAssignments?.availableQuantity || material.totalQuantityInBaseUnit)} {material.baseUnit}
              </p>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-muted-foreground">Total Value</h4>
              <p className="font-semibold text-foreground">{formatCurrency(material.totalValue)}</p>
            </div>
          </div>
        </div>

        {sectionAssignments.length > 0 && (
          <div className="rounded-xl border border-border bg-muted/30 p-4 shadow-sm space-y-2">
            <h4 className="text-sm font-semibold text-muted-foreground">Section Assignments</h4>
            {sectionAssignments.map((assignment, index) => (
              <div key={index} className="rounded-md bg-accent/30 px-4 py-2 flex items-center justify-between">
                <span className="text-sm font-medium text-primary">{assignment.sectionName}</span>
                <span className="text-sm">
                  {formatNumber(assignment.assignedQuantity)} {assignment.assignedUnit}
                </span>
              </div>
            ))}
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
