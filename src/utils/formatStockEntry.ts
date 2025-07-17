import { formatNumber } from "./conversionLogic";

export const formatStockEntryValue = (value: number | string | undefined, unit?: string): string => {
  if (value === undefined) return "0";
  const num = typeof value === "string" ? parseFloat(value) : value;
  return isNaN(num) ? "0" : formatNumber(num, unit);
};
