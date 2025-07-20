export function getColumnAlignment(header: string): string {
  const rightAlignedHeaders = ["qty", "quantity", "cost", "value", "price", "profit", "revenue", "amount", "total", "avg", "average", "count", "entries", "threshold", "percentage", "margin", "volume", "utilization", "days"];
  const centerAlignedHeaders = ["status", "urgency", "trend", "rating", "performance"];
  const headerLower = header.toLowerCase();
  if (rightAlignedHeaders.some(keyword => headerLower.includes(keyword)) || headerLower.includes("%")) {
    return "text-right";
  }
  if (centerAlignedHeaders.some(keyword => headerLower.includes(keyword))) {
    return "text-center";
  }
  return "text-left";
}

export function getResponsiveColumnClasses(header: string): string {
  const wideColumns = ["material", "supplier", "description", "name", "item"];
  const narrowColumns = ["qty", "unit", "status", "entries", "count"];
  const mediumColumns = ["category", "section", "date"];
  const costColumns = ["cost", "value", "price", "profit", "revenue", "amount"];
  const headerLower = header.toLowerCase();
  if (wideColumns.some(keyword => headerLower.includes(keyword))) {
    return "min-w-[120px]";
  }
  if (costColumns.some(keyword => headerLower.includes(keyword))) {
    return "min-w-[90px]";
  }
  if (narrowColumns.some(keyword => headerLower.includes(keyword))) {
    return "min-w-[70px]";
  }
  if (mediumColumns.some(keyword => headerLower.includes(keyword))) {
    return "min-w-[100px]";
  }
  return "min-w-[85px]";
}

export function getInitialWidth(header: string): number {
  const wideColumns = ["material", "supplier", "description", "name", "item"];
  const narrowColumns = ["qty", "unit", "status", "entries", "count"];
  const costColumns = ["cost", "value", "price", "profit", "revenue", "amount"];
  const mediumColumns = ["category", "section", "date"];
  const headerLower = header.toLowerCase();
  if (wideColumns.some(keyword => headerLower.includes(keyword))) {
    return 200;
  }
  if (costColumns.some(keyword => headerLower.includes(keyword))) {
    return 120;
  }
  if (narrowColumns.some(keyword => headerLower.includes(keyword))) {
    return 90;
  }
  if (mediumColumns.some(keyword => headerLower.includes(keyword))) {
    return 140;
  }
  return 130;
}
