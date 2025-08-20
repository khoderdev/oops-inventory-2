import { StockEntryWithMaterial } from "@/types/inventory";
import { formatNumber } from "@/utils/conversionLogic";
import { AlertTriangle } from "lucide-react";
import { Badge } from "../ui/badge";

export const hasNegativeStock = (entry: StockEntryWithMaterial) => {
  return (entry.purchasedIndividualQuantity && entry.purchasedIndividualQuantity < 0) || (entry.purchasedQuantity && entry.purchasedQuantity < 0);
};

export const renderQuantityDisplay = (entry: StockEntryWithMaterial) => {
  const { material } = entry;
  const isNegative = hasNegativeStock(entry);

  return (
    <div className="space-y-1">
      {(() => {
        if (material?.unitType === "mass" && entry.purchasedIndividualQuantity !== undefined && entry.purchasedIndividualUnit) {
          return (
            <>
              <Badge variant="default" className={`w-fit bg-primary/25 font-bold text-teal-700 hover:bg-primary/25 flex items-center justify-center gap-1 ${isNegative ? "text-red-600" : ""}`}>
                {isNegative && <AlertTriangle className="h-3 w-3 flex-shrink-0" />}
                <span>
                  {formatNumber(entry.purchasedIndividualQuantity)} {entry.purchasedIndividualUnit}
                </span>
              </Badge>
              {/* <div className="text-xs text-muted-foreground text-center">
                (from {formatNumber(entry.purchasedQuantity)} {entry.purchasedUnit})
              </div> */}
            </>
          );
        } else if (material?.unitType === "volume" && entry.purchasedIndividualQuantity !== undefined && entry.purchasedIndividualUnit) {
          return (
            <>
              <Badge variant="default" className={`w-fit font-bold bg-primary/25 text-teal-700 hover:bg-primary/25 flex items-center justify-center gap-1 ${isNegative ? "text-red-600" : ""}`}>
                {isNegative && <AlertTriangle className="h-3 w-3 flex-shrink-0" />}
                <span>
                  {formatNumber(entry.purchasedIndividualQuantity)} {entry.purchasedIndividualUnit}
                </span>
              </Badge>
              {/* <div className="text-xs text-muted-foreground text-center">
                (from {formatNumber(entry.purchasedQuantity)} {entry.purchasedUnit})
              </div> */}
            </>
          );
        } else if (material?.unitType === "package" && entry.purchasedIndividualQuantity !== undefined && entry.purchasedIndividualUnit) {
          return (
            <>
              <Badge variant="default" className={`w-fit font-bold bg-primary/25 text-teal-700 hover:bg-primary/25 flex items-center justify-center gap-1 ${isNegative ? "text-red-600" : ""}`}>
                {isNegative && <AlertTriangle className="h-3 w-3 flex-shrink-0" />}
                <span>
                  {formatNumber(entry.purchasedIndividualQuantity)} {entry.purchasedIndividualUnit}
                </span>
              </Badge>
              {/* Only show "(from X pack)" if individual quantity is positive */}
              {/* {entry.purchasedIndividualQuantity > 0 && material?.packageQuantity && (
                <div className="text-xs text-muted-foreground text-center">
                  (from {formatNumber(Math.ceil(entry.purchasedIndividualQuantity / material.packageQuantity))} {entry.purchasedUnit})
                </div>
              )} */}
            </>
          );
        } else {
          return (
            <Badge variant="default" className={`w-fit font-bold bg-primary/25 text-teal-700 hover:bg-primary/25 flex items-center justify-center gap-1 ${isNegative ? "text-red-600" : ""}`}>
              {isNegative && <AlertTriangle className="h-3 w-3 flex-shrink-0" />}
              <span>
                {formatNumber(entry.purchasedQuantity)} {entry.purchasedUnit}
              </span>
            </Badge>
          );
        }
      })()}
    </div>
  );
};

export const renderUnitDisplay = (entry: StockEntryWithMaterial) => {
  const { material } = entry;
  const formatUnit = (unit: string) => {
    if (unit === "piece") return "pc";
    if (unit === "pieces") return "pcs";
    return unit;
  };
  return (
    <div className="flex items-center gap-1">
      <div className="space-y-1 text-center">
        <div className="font-medium">{formatUnit(entry.purchasedUnit.toUpperCase())}</div>
        {(() => {
          if (material?.unitType === "package" && entry.purchasedIndividualUnit) {
            // return <div className="text-xs text-muted-foreground">{formatUnit(entry.purchasedIndividualUnit)}</div>;
          } else if (entry.purchasedConvertedUnit && entry.purchasedConvertedUnit !== entry.purchasedUnit) {
            // return <div className="text-xs text-muted-foreground">{formatUnit(entry.purchasedConvertedUnit)}</div>;
          } else if (material?.baseUnit && material.baseUnit !== entry.purchasedUnit) {
            // return <div className="text-xs text-muted-foreground">{formatUnit(material.baseUnit)}</div>;
          }
          return null;
        })()}
      </div>
    </div>
  );
};
