import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../ui/dialog";
import { Button } from "../../ui/button";
import { BeverageItemForm } from "./BeverageItemForm";
import { formatCurrency, formatVolume } from "@/utils/conversionLogic";
import { BeverageDetailsDialogProps, BeverageItemFormDialogProps } from "@/types/menuItems";

export const BeverageItemFormDialog: React.FC<BeverageItemFormDialogProps> = ({ open, onOpenChange, editingBeverageItem, categories, materials, stockEntries, onSubmit, onCancel }) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange} modal={true}>
      <DialogContent className="max-w-[95vw] sm:max-w-6xl max-h-[95vh] overflow-y-auto" onPointerDownOutside={e => e.preventDefault()} onInteractOutside={e => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">{editingBeverageItem ? "Edit Beverage Item" : "Create New Beverage Item"}</DialogTitle>
        </DialogHeader>
        <BeverageItemForm menuItem={editingBeverageItem} categories={categories} materials={materials} stockEntries={stockEntries} onSubmit={onSubmit} onCancel={onCancel} enableVariants={true} />
      </DialogContent>
    </Dialog>
  );
};

export const BeverageDetailsDialog: React.FC<BeverageDetailsDialogProps> = ({ open, onOpenChange, selectedBeverageDetails, onClose, onEdit }) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-3xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">{selectedBeverageDetails?.name || "Beverage Details"}</DialogTitle>
        </DialogHeader>
        {selectedBeverageDetails && (
          <div className="grid gap-6 py-4">
            <div className="flex items-start gap-6">
              {selectedBeverageDetails.image ? (
                <img src={selectedBeverageDetails.image} alt={selectedBeverageDetails.name} className="w-32 h-32 object-cover rounded-md border" />
              ) : (
                <div className="w-32 h-32 bg-gray-100 rounded-md border flex items-center justify-center">
                  <span className="text-gray-400">No Image</span>
                </div>
              )}
              <div className="flex-1">
                <h3 className="text-xl font-semibold">{selectedBeverageDetails.name}</h3>
                <div className="mt-2 grid grid-cols-2 gap-x-6 gap-y-2">
                  <div>
                    <span className="text-sm text-gray-500">Category</span>
                    <p className="font-medium">{typeof selectedBeverageDetails.category === "object" && selectedBeverageDetails.category?.name ? selectedBeverageDetails.category.name : typeof selectedBeverageDetails.category === "string" ? selectedBeverageDetails.category : "Uncategorized"}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Price</span>
                    <p className="font-medium">{formatCurrency(selectedBeverageDetails.price)}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">POS Status</span>
                    <p className="font-medium flex items-center gap-1">
                      {selectedBeverageDetails.isPOSItem ? (
                        <>
                          <span className="inline-block w-2 h-2 rounded-full bg-green-500"></span>
                          Visible in POS
                        </>
                      ) : (
                        <>
                          <span className="inline-block w-2 h-2 rounded-full bg-gray-300"></span>
                          Hidden from POS
                        </>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {selectedBeverageDetails.description && (
              <div>
                <h4 className="font-medium mb-1">Description</h4>
                <p className="text-gray-700">{selectedBeverageDetails.description}</p>
              </div>
            )}

            {selectedBeverageDetails.variants && Array.isArray(selectedBeverageDetails.variants) && selectedBeverageDetails.variants.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Variants</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {selectedBeverageDetails.variants.map(variant => (
                    <div key={variant.id} className="border rounded-md p-3">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{variant.name}</span>
                        <span className="text-sm font-semibold">{formatCurrency(Number(variant.price))}</span>
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        {formatVolume(variant.volume)} {variant.unit}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedBeverageDetails.beverageStockId && (
              <div>
                <h4 className="font-medium mb-1">Inventory Information</h4>
                <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                  <div>
                    <span className="text-sm text-gray-500">Stock ID</span>
                    <p className="font-medium">{selectedBeverageDetails.beverageStockId}</p>
                  </div>
                  {selectedBeverageDetails.availableQuantity !== undefined && (
                    <div>
                      <span className="text-sm text-gray-500">Available Quantity</span>
                      <p className="font-medium">
                        {selectedBeverageDetails.availableQuantity} {selectedBeverageDetails.unit || "units"}
                      </p>
                    </div>
                  )}
                  {selectedBeverageDetails.costPerUnit !== undefined && (
                    <div>
                      <span className="text-sm text-gray-500">Cost Per Unit</span>
                      <p className="font-medium">{formatCurrency(selectedBeverageDetails.costPerUnit)}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 mt-4">
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
              <Button
                onClick={() => {
                  onClose();
                  onEdit(selectedBeverageDetails);
                }}
              >
                Edit
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
