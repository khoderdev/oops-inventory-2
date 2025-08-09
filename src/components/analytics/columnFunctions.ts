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
  const mediumColumns = ["category", "section", "date", "reason"];
  const costColumns = ["cost", "value", "price", "profit", "revenue", "amount"];
  const headerLower = header.toLowerCase();

  // Specific classes for waste report columns
  if (headerLower === "material") {
    return "min-w-[140px] w-auto";
  }
  if (headerLower.includes("waste quantity")) {
    return "min-w-[100px] w-auto";
  }
  if (headerLower === "cost") {
    return "min-w-[110px] w-auto";
  }
  if (headerLower === "waste date") {
    return "min-w-[120px] w-auto";
  }

  if (wideColumns.some(keyword => headerLower.includes(keyword))) {
    return "min-w-[120px] w-auto";
  }
  if (costColumns.some(keyword => headerLower.includes(keyword))) {
    return "min-w-[90px] w-auto";
  }
  if (narrowColumns.some(keyword => headerLower.includes(keyword))) {
    return "min-w-[70px] w-auto";
  }
  if (mediumColumns.some(keyword => headerLower.includes(keyword))) {
    return "min-w-[100px] w-auto";
  }
  return "min-w-[85px] w-auto";
}

export function getInitialWidth(header: string): number {
  const wideColumns = ["material", "supplier", "description", "name", "item"];
  const narrowColumns = ["qty", "unit", "status", "entries", "count"];
  const costColumns = ["cost", "value", "price", "profit", "revenue", "amount"];
  const mediumColumns = ["category", "section", "date", "reason"];
  const headerLower = header.toLowerCase();
  
  // Specific widths for waste report columns
  if (headerLower === "material") {
    return 180; // Wider for material name + category
  }
  if (headerLower.includes("waste quantity")) {
    return 120;
  }
  if (headerLower === "cost") {
    return 130; // Accommodate color-coded pills
  }
  if (headerLower === "waste date") {
    return 140;
  }
  if (headerLower === "reason") {
    return 120;
  }
  if (headerLower === "unit") {
    return 80;
  }
  
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
