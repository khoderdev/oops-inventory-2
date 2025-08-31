import React, { useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { POSItem } from "@/types/inventory";
import { formatPOSPrice } from "@/utils/conversionLogic";
import { cn } from "@/lib/utils";

interface VariantSelectionModalProps {
  isOpen: boolean;
  selectedItem: POSItem | null;
  onClose: () => void;
  onAddToCart: (item: POSItem) => void;
}

export const VariantSelectionModal: React.FC<VariantSelectionModalProps> = ({ isOpen, selectedItem, onClose, onAddToCart }) => {
  if (!selectedItem || !selectedItem.variants) return null;

  // Get unique container types from variants
  const containerTypes = Array.from(
    new Set(
      selectedItem.variants.map(v => {
        // Try to extract container type from name
        const name = v.name.toLowerCase();
        if (name.includes("glass")) return "glass";
        if (name.includes("bottle")) return "bottle";
        if (name.includes("can")) return "can";
        if (name.includes("pint")) return "pint";
        if (name.includes("pitcher")) return "pitcher";
        if (name.includes("mini")) return "mini";
        if (name.includes("standard")) return "standard";
        if (name.includes("magnum")) return "magnum";
        return name; // Default to the variant name if no match
      })
    )
  );

  // Get icon for container type
  const getContainerIcon = (containerType: string) => {
    switch (containerType.toLowerCase()) {
      case "glass":
        return "🥃";
      case "bottle":
        return "🍾";
      case "can":
        return "🥤";
      case "pint":
        return "🍺";
      case "pitcher":
        return "🍺";
      case "mini":
        return "🥃";
      case "standard":
        return "🍾";
      case "magnum":
        return "🍾";
      default:
        return "🥤";
    }
  };

  // Determine grid columns based on number of container types
  const gridColumns = Math.min(containerTypes.length, 3);

  const handleVariantSelect = useCallback(
    (variant: any) => {
      const itemWithVariant = {
        ...selectedItem,
        selectedVariant: variant,
        price: parseFloat(variant.price.toString()) || selectedItem.price,
        displayName: `${selectedItem.name} (${variant.name} - ${variant.volume}${variant.unit})`
      };
      onAddToCart(itemWithVariant);
      onClose();
    },
    [selectedItem, onAddToCart, onClose]
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-xl">Select {selectedItem.name} Variant</DialogTitle>
        </DialogHeader>
        <div className="p-4">
          <div
            className={cn("grid gap-4", {
              "grid-cols-1": gridColumns === 1,
              "grid-cols-2": gridColumns === 2,
              "grid-cols-3": gridColumns === 3
            })}
          >
            {containerTypes.map(containerType => {
              // Find the variant that matches this container type
              const variant = selectedItem.variants?.find(v => v.name.toLowerCase().includes(containerType.toLowerCase()));

              if (!variant) return null;

              return (
                <Button key={containerType} className="h-32 flex flex-col items-center justify-center gap-2 bg-primary/80 hover:bg-primary" onClick={() => handleVariantSelect(variant)}>
                  <div className="text-3xl mb-2">{getContainerIcon(containerType)}</div>
                  <div className="font-semibold">{variant.name}</div>
                  <div className="text-sm opacity-90">
                    {variant.volume}
                    {variant.unit} - {formatPOSPrice(parseFloat(variant.price.toString()) || selectedItem.price)}
                  </div>
                </Button>
              );
            })}
          </div>

          <Button variant="outline" className="w-full mt-4" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
