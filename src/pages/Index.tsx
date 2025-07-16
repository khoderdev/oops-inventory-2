import { InventoryDashboard } from "@/components/InventoryDashboard";
import { PackageCalculator } from "@/components/PackageCalculator";
import { POSScreen } from "@/components/POSScreen";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UnitConverter } from "@/components/UnitConverter";
import { mockAssignments, mockMaterials, mockSections, mockStockEntries, SaleRecord, SectionAssignment, SoldItem } from "@/types/inventory";
import { Calculator, Info, Package, Warehouse } from "lucide-react";
import { useState } from "react";

const Index = () => {
  const [salesHistory, setSalesHistory] = useState<SaleRecord[]>([]);
  const [assignments, setAssignments] = useState<SectionAssignment[]>(mockAssignments);
  const [sections, setSections] = useState(mockSections);
  const [materials, setMaterials] = useState(mockMaterials);
  const [stockEntries, setStockEntries] = useState(mockStockEntries);

  const handleUpdateAssignment = (assignmentId: string, newQuantity: number) => {
    setAssignments(prevAssignments => prevAssignments.map(assignment => (assignment.id === assignmentId ? { ...assignment, assignedQuantity: newQuantity } : assignment)));
  };

  const handleCompleteSale = (soldItems: SoldItem[]) => {
    const newSale: SaleRecord = {
      id: Date.now().toString(),
      date: new Date(),
      items: soldItems,
      totalAmount: soldItems.reduce((sum, item) => sum + item.totalPrice, 0),
      sectionId: soldItems[0]?.sectionId || "",
      customerName: "",
      notes: ""
    };
    setSalesHistory([...salesHistory, newSale]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-accent/20">
      <div className="container mx-auto px-4 py-8">
        {/* Main Content */}
        <Tabs defaultValue="inventory" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="pos" className="flex items-center gap-2">
              <Calculator className="h-4 w-4" />
              POS
            </TabsTrigger>
            <TabsTrigger value="converter" className="flex items-center gap-2">
              <Calculator className="h-4 w-4" />
              Unit Converter
            </TabsTrigger>
            <TabsTrigger value="packages" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Package Calculator
            </TabsTrigger>
            <TabsTrigger value="inventory" className="flex items-center gap-2">
              <Warehouse className="h-4 w-4" />
              Inventory Manager
            </TabsTrigger>
            {/* <TabsTrigger value="info" className="flex items-center gap-2">
              <Info className="h-4 w-4" />
              Conversion Guide
            </TabsTrigger> */}
          </TabsList>

          <TabsContent value="pos" className="space-y-6">
            <POSScreen
              sections={sections}
              assignments={assignments}
              materials={materials}
              stockEntries={stockEntries}
              onUpdateAssignment={handleUpdateAssignment}
              onCompleteSale={({ individualItems, menuItems, customerName, notes }) => {
                // Handle the sale data here
                console.log("Individual items sold:", individualItems);
                console.log("Menu items sold:", menuItems);
                console.log("Customer name:", customerName);
                console.log("Notes:", notes);
              }}
            />
          </TabsContent>

          <TabsContent value="converter" className="space-y-6">
            <UnitConverter />
          </TabsContent>

          <TabsContent value="packages" className="space-y-6">
            <PackageCalculator />
          </TabsContent>

          <TabsContent value="inventory" className="space-y-6">
            <InventoryDashboard />
          </TabsContent>

          <TabsContent value="info" className="space-y-6">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="h-5 w-5" />
                  Conversion Reference Guide
                </CardTitle>
                <CardDescription>Quick reference for unit conversions and cost calculation formulas</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Mass Conversions */}
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-primary">Mass Units</h3>
                  <div className="bg-accent/30 rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <h4 className="font-medium mb-2">Base Conversions:</h4>
                        <ul className="text-sm space-y-1 text-muted-foreground">
                          <li>• 1 KG = 1,000 Grams</li>
                          <li>• 1 KG = 2.20462 Pounds</li>
                          <li>• 1 Pound = 453.592 Grams</li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-medium mb-2">Cost Examples:</h4>
                        <ul className="text-sm space-y-1 text-muted-foreground">
                          <li>• $3.30/kg = $0.0033/gram</li>
                          <li>• $3.30/kg ≈ $1.50/pound</li>
                          <li>• 150g × $0.0033 = $0.50</li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-medium mb-2">Formula:</h4>
                        <div className="text-sm text-muted-foreground">
                          <code className="bg-muted p-1 rounded">Cost = Quantity × (Cost per Base Unit ÷ Conversion Factor)</code>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Volume Conversions */}
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-primary">Volume Units</h3>
                  <div className="bg-accent/30 rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <h4 className="font-medium mb-2">Base Conversions:</h4>
                        <ul className="text-sm space-y-1 text-muted-foreground">
                          <li>• 1 Liter = 1,000 ML</li>
                          <li>• 1 Gallon = 3.78541 Liters</li>
                          <li>• 1 Gallon = 3,785.41 ML</li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-medium mb-2">Cost Examples:</h4>
                        <ul className="text-sm space-y-1 text-muted-foreground">
                          <li>• $2.00/L = $0.002/ml</li>
                          <li>• $2.00/L ≈ $7.57/gallon</li>
                          <li>• 500ml × $0.002 = $1.00</li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-medium mb-2">Use Cases:</h4>
                        <ul className="text-sm space-y-1 text-muted-foreground">
                          <li>• Beverage costing</li>
                          <li>• Sauce portioning</li>
                          <li>• Chemical dilution</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Package Calculations */}
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-primary">Package Calculations</h3>
                  <div className="bg-accent/30 rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-medium mb-2">Package Types:</h4>
                        <ul className="text-sm space-y-1 text-muted-foreground">
                          <li>
                            • <strong>Box:</strong> Fixed count (e.g., 12 buns/box)
                          </li>
                          <li>
                            • <strong>Pack:</strong> Weight-based (e.g., 5kg pack)
                          </li>
                          <li>
                            • <strong>Case:</strong> Multiple boxes (e.g., 24 boxes/case)
                          </li>
                          <li>
                            • <strong>Bottle:</strong> Volume-based (e.g., 500ml bottle)
                          </li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-medium mb-2">Cost Formula:</h4>
                        <div className="text-sm text-muted-foreground space-y-2">
                          <div>
                            <code className="bg-muted p-1 rounded text-xs">Cost per Unit = Package Price ÷ Units per Package</code>
                          </div>
                          <p>
                            <strong>Example:</strong> Box of 12 buns for $3.00:
                          </p>
                          <p>Cost per bun = $3.00 ÷ 12 = $0.25</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Key Rules */}
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-primary">Important Rules</h3>
                  <div className="bg-warning/10 border border-warning/20 rounded-lg p-4">
                    <ul className="text-sm space-y-2 text-muted-foreground">
                      <li>
                        • <strong>Always verify units</strong> before calculations (grams vs. kg, ml vs. liters)
                      </li>
                      <li>
                        • <strong>Packaged goods may have different unit costs</strong> than bulk purchasing
                      </li>
                      <li>
                        • <strong>Standardize inputs first</strong> - convert all measurements to base units
                      </li>
                      <li>
                        • <strong>Consider waste factors</strong> in real-world applications
                      </li>
                      <li>
                        • <strong>Check supplier packaging</strong> - actual package sizes may vary
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
