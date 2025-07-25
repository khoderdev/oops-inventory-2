import { ReportType } from "@/components/analytics/configs";

// Get table headers based on report type
export function getTableHeaders(reportType: ReportType): string[] {
  const headerMap: Record<ReportType, string[]> = {
    "inventory-summary": ["Material", "Category", "Available Qty", "Unit", "Avg Cost", "Total Value", "Stock Entries", "Last Purchase", "Status"],
    "stock-purchases": ["Date", "Material", "Supplier", "Quantity", "Unit", "Cost per Unit", "Total Cost", "Batch"],
    "sales-performance": ["Date", "Section", "Total Sales", "Items Sold", "Revenue", "Top Item", "Performance"],
    "cost-analysis": ["Material", "Current Cost", "Previous Cost", "Trend", "Variance %", "Entries", "Recommendation"],
    "supplier-performance": ["Supplier", "Total Orders", "Total Value", "Materials Count", "Avg Order Value", "Last Purchase", "Rating"],
    "expiry-alerts": ["Material", "Supplier", "Expiry Date", "Days Until Expiry", "Quantity", "Unit", "Value", "Urgency"],
    "category-analysis": ["Category", "Materials Count", "Total Value", "Avg Value", "Percentage", "Purchase Volume", "Sales Volume"],
    "menu-profitability": ["Menu Item", "Category", "Price", "Cost", "Profit", "Profit Margin %", "Sales Count", "Total Profit"],
    "section-performance": ["Section", "Assignments", "Total Value", "Sales Volume", "Revenue", "Utilization %", "Performance"],
    "waste-report": ["Material", "Category", "Waste Quantity", "Unit", "Reason", "Total Cost", "Waste Date", "Entries Affected"]
  };

  return headerMap[reportType] || [];
}
