// export const formatDate = (value: string | Date | null | undefined): string => {
//   if (!value) return "—";
//   const date = value instanceof Date ? value : new Date(value);
//   return isNaN(date.getTime()) ? "Invalid Date" : date.toLocaleDateString();
// };
import { format, isValid, parse } from "date-fns";

export const formatDate = (value: string | Date | null | undefined, outputFormat: string = "yyyy-MM-dd"): string => {
  if (!value) return "—";

  const date = value instanceof Date ? value : parse(value, "yyyy-MM-dd", new Date());
  if (isValid(date)) {
    return format(date, outputFormat);
  }

  // Fallback to MM/DD/YYYY parsing
  const fallback = parse(value, "MM/dd/yyyy", new Date());
  if (isValid(fallback)) {
    return format(fallback, outputFormat);
  }

  return "Invalid Date";
};
