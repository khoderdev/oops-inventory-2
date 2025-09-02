import { StockEntryWithMaterial } from "@/types/inventory";
import { formatNumber } from "@/utils/conversionLogic";
import { AlertTriangle } from "lucide-react";

export const hasNegativeStock = (entry: StockEntryWithMaterial) => {
  return (entry.purchasedIndividualQuantity && entry.purchasedIndividualQuantity < 0) || (entry.purchasedQuantity && entry.purchasedQuantity < 0);
};

export const renderQuantityDisplay = (entry: StockEntryWithMaterial) => {
  const isNegative = hasNegativeStock(entry);
  
  // Use backend calculated values directly - no frontend calculations
  if (entry.totalVolume && entry.volumeUnit) {
    return (
      <div className={`w-[150px] rounded-full font-bold text-primary flex items-center justify-center gap-1 p-1 px-2 ${isNegative ? "text-red-600" : ""}`}>
        {isNegative && <AlertTriangle className="h-3 w-3 flex-shrink-0" />}
        <div className="text-center">
          <div>{formatNumber(entry.totalVolume)} {entry.volumeUnit}</div>
          {/* <div className="text-[0.55rem] opacity-75">(from {entry.purchasedIndividualQuantity || entry.purchasedQuantity} {entry.purchasedIndividualUnit || entry.purchasedUnit}{(entry.purchasedIndividualQuantity || entry.purchasedQuantity) !== 1 ? 's' : ''})</div> */}
        </div>
      </div>
    );
  }
  
  // Use backend calculated mass values
  if (entry.totalMass && entry.massUnit) {
    return (
      <div className={`w-[150px] rounded-full font-bold text-primary flex items-center justify-center gap-1 px-2 ${isNegative ? "text-red-600" : ""}`}>
        {isNegative && <AlertTriangle className="h-3 w-3 flex-shrink-0" />}
        <span>
          {formatNumber(entry.totalMass)} {entry.massUnit}
        </span>
      </div>
    );
  }
  
  // Use backend calculated piece values
  if (entry.totalPieces) {
    const unit = entry.unitDescription || 'pieces';
    return (
      <div className={`w-[150px] rounded-full font-bold text-primary flex items-center justify-center gap-1 px-2 ${isNegative ? "text-red-600" : ""}`}>
        {isNegative && <AlertTriangle className="h-3 w-3 flex-shrink-0" />}
        <span>
          {formatNumber(entry.totalPieces)} {unit}
        </span>
      </div>
    );
  }
  
  // Fallback to raw purchase data if no calculated values available
  const currentQty = entry.purchasedIndividualQuantity || entry.purchasedQuantity || 0;
  const unit = entry.purchasedIndividualUnit || entry.material?.baseUnit || entry.purchasedUnit || 'pc';

  return (
    <div className={`w-[150px] rounded-full font-bold text-primary flex items-center justify-center gap-1 px-2 ${isNegative ? "text-red-600" : ""}`}>
      {isNegative && <AlertTriangle className="h-3 w-3 flex-shrink-0" />}
      <span>
        {formatNumber(currentQty)} {unit}
      </span>
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
