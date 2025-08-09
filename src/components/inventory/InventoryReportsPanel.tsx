import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Material, MenuItem, SectionAssignment, StockEntry } from "@/types/inventory";
import { formatCurrency, formatNumber } from "@/utils/conversionLogic";
import { CostAnalysis, ExpiryAlert, reportGenerator } from "@/utils/inventoryReports";
import { AlertTriangle, BarChart3, Calendar, Clock, DollarSign, Download, Package, TrendingDown, TrendingUp } from "lucide-react";
import React, { useMemo, useState } from "react";

interface InventoryReportsPanelProps {
  materials: Material[];
  stockEntries: StockEntry[];
  menuItems?: MenuItem[];
  sectionAssignments?: SectionAssignment[];
}

export const InventoryReportsPanel: React.FC<InventoryReportsPanelProps> = ({ materials, stockEntries, menuItems = [], sectionAssignments = [] }) => {
  const [selectedTimeRange] = useState<"7d" | "30d" | "90d" | "1y">("30d");

  // Generate comprehensive inventory report
  const inventoryReport = useMemo(() => {
    return reportGenerator.generateInventoryReport(materials, stockEntries, menuItems, sectionAssignments);
  }, [materials, stockEntries, menuItems, sectionAssignments]);

  // Generate cost analysis
  const costAnalysis = useMemo(() => {
    return reportGenerator.generateCostAnalysis(materials, stockEntries);
  }, [materials, stockEntries]);

  // Filter stock entries by time range
  const filteredStockEntries = useMemo(() => {
    const now = new Date();
    const daysBack = {
      "7d": 7,
      "30d": 30,
      "90d": 90,
      "1y": 365
    }[selectedTimeRange];

    const cutoffDate = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);
    return stockEntries.filter(entry => entry.purchaseDate >= cutoffDate);
  }, [stockEntries, selectedTimeRange]);

  const handleExportReport = () => {
    const reportString = reportGenerator.exportReportToString(inventoryReport);
    const blob = new Blob([reportString], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `inventory-report-${new Date().toISOString().split("T")[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getUrgencyColor = (urgency: ExpiryAlert["urgency"]) => {
    switch (urgency) {
      case "critical":
        return "destructive";
      case "warning":
        return "default";
      case "info":
        return "secondary";
      default:
        return "secondary";
    }
  };

  const getTrendIcon = (trend: CostAnalysis["costTrend"]) => {
    switch (trend) {
      case "increasing":
        return <TrendingUp className="h-4 w-4 text-red-500" />;
      case "decreasing":
        return <TrendingDown className="h-4 w-4 text-green-500" />;
      default:
        return <BarChart3 className="h-4 w-4 text-blue-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Export */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Inventory Reports</h2>
          <p className="text-muted-foreground">Generated on {inventoryReport.generatedAt.toLocaleDateString()}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportReport}>
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Inventory Value</p>
                <p className="text-2xl font-bold">{formatCurrency(inventoryReport.totalInventoryValue)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Materials</p>
                <p className="text-2xl font-bold">{inventoryReport.totalMaterials}</p>
              </div>
              <Package className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Stock Entries</p>
                <p className="text-2xl font-bold">{inventoryReport.totalStockEntries}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Low Stock Items</p>
                <p className="text-2xl font-bold text-red-500">{inventoryReport.lowStockCount}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Reports Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="suppliers">Suppliers</TabsTrigger>
          <TabsTrigger value="expiry">Expiry Alerts</TabsTrigger>
          <TabsTrigger value="cost-analysis">Cost Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Materials by Value */}
            <Card>
              <CardHeader>
                <CardTitle>Top Materials by Value</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {inventoryReport.topMaterialsByValue.slice(0, 10).map((material, index) => (
                    <div key={material.materialId} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline">{index + 1}</Badge>
                        <div>
                          <p className="font-medium">{material.materialName}</p>
                          <p className="text-sm text-muted-foreground">{material.category}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(material.totalValue)}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatNumber(material.availableQuantity)} {material.baseUnit}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Stock Entries</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {filteredStockEntries
                    .sort((a, b) => b.purchaseDate.getTime() - a.purchaseDate.getTime())
                    .slice(0, 8)
                    .map(entry => {
                      const material = materials.find(m => m.id === entry.materialId);
                      return (
                        <div key={entry.id} className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{material?.name || "Unknown"}</p>
                            <p className="text-sm text-muted-foreground">
                              {entry.supplier} • {entry.purchaseDate.toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">{formatCurrency(entry.totalCost)}</p>
                            <p className="text-sm text-muted-foreground">
                              {formatNumber(entry.purchasedQuantity)} {entry.purchasedUnit}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Inventory Value by Category</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {inventoryReport.categoryBreakdown.map(category => (
                  <div key={category.category} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">{category.category}</p>
                        <p className="text-sm text-muted-foreground">{category.materialCount} materials</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(category.totalValue)}</p>
                        <p className="text-sm text-muted-foreground">{category.percentage.toFixed(1)}%</p>
                      </div>
                    </div>
                    <Progress value={category.percentage} className="h-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="suppliers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Supplier Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {inventoryReport.supplierAnalysis.map(supplier => (
                  <div key={supplier.supplier} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-medium">{supplier.supplier}</h3>
                        <p className="text-sm text-muted-foreground">
                          {supplier.materialCount} materials • {supplier.totalPurchases} orders
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(supplier.totalValue)}</p>
                        <p className="text-sm text-muted-foreground">Avg: {formatCurrency(supplier.averageOrderValue)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      Last purchase: {supplier.lastPurchaseDate.toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expiry" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Expiry Alerts</CardTitle>
            </CardHeader>
            <CardContent>
              {inventoryReport.expiryAlerts.length === 0 ? (
                <Alert>
                  <AlertDescription>No items are expiring within the next 30 days.</AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-3">
                  {inventoryReport.expiryAlerts.map(alert => (
                    <div key={alert.stockEntryId} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium">{alert.materialName}</h3>
                            <Badge variant={getUrgencyColor(alert.urgency)}>{alert.urgency}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{alert.supplier}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{formatCurrency(alert.value)}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatNumber(alert.quantity)} {alert.unit}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4" />
                        <span className={`font-medium ${alert.daysUntilExpiry <= 3 ? "text-red-500" : alert.daysUntilExpiry <= 7 ? "text-orange-500" : "text-blue-500"}`}>{alert.daysUntilExpiry} days until expiry</span>
                        <span className="text-muted-foreground">(expires {alert.expiryDate.toLocaleDateString()})</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cost-analysis" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cost Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {costAnalysis
                  .filter(analysis => analysis.historicalCosts.length > 0)
                  .sort((a, b) => b.currentAverageCost - a.currentAverageCost)
                  .slice(0, 15)
                  .map(analysis => (
                    <div key={analysis.materialId} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium">{analysis.materialName}</h3>
                            {getTrendIcon(analysis.costTrend)}
                          </div>
                          <p className="text-sm text-muted-foreground">{analysis.historicalCosts.length} price points</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">
                            {formatCurrency(analysis.currentAverageCost)}/{analysis.baseUnit}
                          </p>
                          <Badge variant={analysis.costTrend === "increasing" ? "destructive" : analysis.costTrend === "decreasing" ? "default" : "secondary"}>{analysis.costTrend}</Badge>
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        <p>Cost variance: {analysis.costVariance.toFixed(4)}</p>
                        <p>
                          Recommended reorder point: {formatNumber(analysis.recommendedReorderPoint)} {analysis.baseUnit}
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default InventoryReportsPanel;
