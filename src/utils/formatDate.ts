import { format, isValid, parse, parseISO } from "date-fns";

export const formatDate = (value: string | Date | null | undefined, outputFormat: string = "yyyy-MM-dd"): string => {
  if (!value) return "—";

  // If it's already a Date object
  if (value instanceof Date) {
    return isValid(value) ? format(value, outputFormat) : "—";
  }
  
  try {
    // Try to parse as ISO string (most common format from APIs)
    const isoDate = parseISO(value.toString());
    if (isValid(isoDate)) {
      return format(isoDate, outputFormat);
    }

    // Try yyyy-MM-dd format
    const ymdDate = parse(value.toString(), "yyyy-MM-dd", new Date());
    if (isValid(ymdDate)) {
      return format(ymdDate, outputFormat);
    }

    // Try MM/dd/yyyy format
    const mdyDate = parse(value.toString(), "MM/dd/yyyy", new Date());
    if (isValid(mdyDate)) {
      return format(mdyDate, outputFormat);
    }
    
    // Try timestamp (number)
    const timestamp = Number(value);
    if (!isNaN(timestamp)) {
      const dateFromTimestamp = new Date(timestamp);
      if (isValid(dateFromTimestamp)) {
        return format(dateFromTimestamp, outputFormat);
      }
    }
    
    // If all parsing attempts fail
    return "—";
  } catch (error) {
    console.error("Error formatting date:", error);
    return "—";
  }
};
