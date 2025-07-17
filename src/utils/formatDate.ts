export const formatDate = (value: string | Date | null | undefined): string => {
  if (!value) return "—";
  const date = value instanceof Date ? value : new Date(value);
  return isNaN(date.getTime()) ? "Invalid Date" : date.toLocaleDateString();
};
