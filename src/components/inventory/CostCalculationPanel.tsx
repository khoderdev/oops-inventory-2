import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Material, MaterialWithStock, StockEntry } from "@/types/inventory";
import { formatCurrency, formatNumber } from "@/utils/conversionLogic";
import { ConversionResult, unitConverter } from "@/utils/enhancedConversions";
import { AlertCircle, Calculator, CheckCircle, Info, Package, TrendingUp } from "lucide-react";
import { useMemo, useState } from "react";

interface CostCalculationPanelProps {
  materials: Material[];
  stockEntries: StockEntry[];
  materialsWithStock: MaterialWithStock[];
}

interface CalculationScenario {
  id: string;
  name: string;
  material: Material;
  quantity: number;
  unit: string;
  result?: ConversionResult;
}

export function CostCalculationPanel({ materials, stockEntries, materialsWithStock }: CostCalculationPanelProps) {
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [selectedUnit, setSelectedUnit] = useState<string>("");
  const [calculationResult, setCalculationResult] = useState<ConversionResult | null>(null);
  const [scenarios, setScenarios] = useState<CalculationScenario[]>([]);

  // Get stock entries for selected material
  const materialStockEntries = useMemo(() => {
    if (!selectedMaterial) return [];
    return stockEntries.filter(entry => entry.materialId === selectedMaterial.id);
  }, [selectedMaterial, stockEntries]);

  // Get available units for selected material
  const availableUnits = useMemo(() => {
    if (!selectedMaterial) return [];
    return unitConverter.getAvailableUnits(selectedMaterial);
  }, [selectedMaterial]);

  // Calculate cost for current selection
  const handleCalculate = () => {
    if (!selectedMaterial || !quantity || !selectedUnit) return;

    const result = unitConverter.calculateCostForQuantity(selectedMaterial, quantity, selectedUnit, materialStockEntries);

    setCalculationResult(result);
  };

  // Add current calculation to scenarios
  const addToScenarios = () => {
    if (!selectedMaterial || !calculationResult) return;

    const scenario: CalculationScenario = {
      id: Date.now().toString(),
      name: `${selectedMaterial.name} - ${quantity} ${selectedUnit}`,
      material: selectedMaterial,
      quantity,
      unit: selectedUnit,
      result: calculationResult
    };

    setScenarios(prev => [...prev, scenario]);
  };

  // Remove scenario
  const removeScenario = (id: string) => {
    setScenarios(prev => prev.filter(s => s.id !== id));
  };

  // Calculate total cost of all scenarios
  const totalScenarioCost = scenarios.reduce((sum, scenario) => sum + (scenario.result?.cost || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Cost Calculation Panel</h2>
          <p className="text-muted-foreground">Calculate costs with dynamic unit conversions and packaging support</p>
        </div>
      </div>

      <Tabs defaultValue="calculator" className="space-y-4">
        <TabsList>
          <TabsTrigger value="calculator">Calculator</TabsTrigger>
          <TabsTrigger value="scenarios">Scenarios</TabsTrigger>
          <TabsTrigger value="examples">Examples</TabsTrigger>
        </TabsList>

        <TabsContent value="calculator" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Input Panel */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  Cost Calculator
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Material</label>
                  <Select
                    value={selectedMaterial?.id || ""}
                    onValueChange={value => {
                      const material = materials.find(m => m.id === value);
                      setSelectedMaterial(material || null);
                      setSelectedUnit("");
                      setCalculationResult(null);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select material" />
                    </SelectTrigger>
                    <SelectContent>
                      {materials.map(material => (
                        <SelectItem key={material.id} value={material.id}>
                          {material.name} ({material.baseUnit})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Quantity</label>
                  <Input type="number" value={quantity} onChange={e => setQuantity(Number(e.target.value))} placeholder="Enter quantity" min="0" step="0.01" />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Unit</label>
                  <Select value={selectedUnit} onValueChange={setSelectedUnit}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select unit" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableUnits.map(unit => (
                        <SelectItem key={unit} value={unit}>
                          {unit}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button onClick={handleCalculate} className="w-full" disabled={!selectedMaterial || !quantity || !selectedUnit}>
                  Calculate Cost
                </Button>

                {calculationResult && (
                  <Button onClick={addToScenarios} variant="outline" className="w-full">
                    Add to Scenarios
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Results Panel */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Calculation Results
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!calculationResult ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Calculator className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Select material, quantity, and unit to calculate cost</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Cost Summary */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 bg-primary/10 rounded-lg">
                        <div className="text-2xl font-bold text-primary">{formatCurrency(calculationResult.cost)}</div>
                        <p className="text-sm text-muted-foreground">Total Cost</p>
                      </div>
                      <div className="text-center p-4 bg-secondary/10 rounded-lg">
                        <div className="text-2xl font-bold">{formatCurrency(calculationResult.costPerUnit)}</div>
                        <p className="text-sm text-muted-foreground">Cost per {selectedUnit}</p>
                      </div>
                    </div>

                    {/* Warnings */}
                    {calculationResult.warnings.length > 0 && (
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          <ul className="list-disc list-inside space-y-1">
                            {calculationResult.warnings.map((warning, index) => (
                              <li key={index}>{warning}</li>
                            ))}
                          </ul>
                        </AlertDescription>
                      </Alert>
                    )}

                    {/* Calculation Steps */}
                    <div>
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <Info className="h-4 w-4" />
                        Calculation Steps
                      </h4>
                      <div className="space-y-1">
                        {calculationResult.steps.map((step, index) => (
                          <div key={index} className="text-sm p-2 bg-muted/50 rounded">
                            {step}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Stock Entry Details */}
                    {materialStockEntries.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-2">Stock Entries Used</h4>
                        <div className="space-y-2">
                          {materialStockEntries.map(entry => (
                            <div key={entry.id} className="text-sm p-2 border rounded">
                              <div className="flex justify-between">
                                <span>{entry.supplier}</span>
                                <span>{formatCurrency(entry.totalCost)}</span>
                              </div>
                              <div className="text-muted-foreground">
                                {formatNumber(entry.purchasedQuantity)} {entry.purchasedUnit} @ {formatCurrency(entry.costPerPurchasedUnit)}/{entry.purchasedUnit}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="scenarios" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Cost Scenarios
                </span>
                {scenarios.length > 0 && <Badge variant="secondary">Total: {formatCurrency(totalScenarioCost)}</Badge>}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {scenarios.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No scenarios added yet</p>
                  <p className="text-sm">Use the calculator to add cost scenarios</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Scenario</TableHead>
                      <TableHead>Material</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Unit</TableHead>
                      <TableHead>Cost</TableHead>
                      <TableHead>Cost/Unit</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {scenarios.map(scenario => (
                      <TableRow key={scenario.id}>
                        <TableCell className="font-medium">{scenario.name}</TableCell>
                        <TableCell>{scenario.material.name}</TableCell>
                        <TableCell>{formatNumber(scenario.quantity)}</TableCell>
                        <TableCell>{scenario.unit}</TableCell>
                        <TableCell>{formatCurrency(scenario.result?.cost || 0)}</TableCell>
                        <TableCell>{formatCurrency(scenario.result?.costPerUnit || 0)}</TableCell>
                        <TableCell>
                          <Button variant="outline" size="sm" onClick={() => removeScenario(scenario.id)}>
                            Remove
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="examples" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Pickles Cost Example</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm space-y-2">
                  <p>
                    <strong>Scenario:</strong> Calculate cost for 50g of pickles
                  </p>
                  <p>
                    <strong>Stock:</strong> 12-jar case purchased for $24.00
                  </p>
                  <p>
                    <strong>Jar size:</strong> 500g each
                  </p>
                </div>
                <div className="bg-muted/50 p-3 rounded text-sm">
                  <p>
                    <strong>Calculation:</strong>
                  </p>
                  <p>1. Case = 12 jars × 500g = 6,000g total</p>
                  <p>2. Cost per gram = $24.00 ÷ 6,000g = $0.004/g</p>
                  <p>3. Cost for 50g = 50g × $0.004/g = $0.20</p>
                </div>
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>This demonstrates multi-level packaging conversion (case → jar → gram)</AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Beef Patties Cost Example</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm space-y-2">
                  <p>
                    <strong>Scenario:</strong> Calculate cost for 3 beef patties
                  </p>
                  <p>
                    <strong>Stock:</strong> 4-pack box purchased for $32.00
                  </p>
                  <p>
                    <strong>Pack size:</strong> 8 patties each
                  </p>
                </div>
                <div className="bg-muted/50 p-3 rounded text-sm">
                  <p>
                    <strong>Calculation:</strong>
                  </p>
                  <p>1. Box = 4 packs × 8 patties = 32 patties total</p>
                  <p>2. Cost per patty = $32.00 ÷ 32 patties = $1.00/patty</p>
                  <p>3. Cost for 3 patties = 3 × $1.00 = $3.00</p>
                </div>
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>This demonstrates piece-based packaging conversion (box → pack → piece)</AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Buns Cost Example</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm space-y-2">
                  <p>
                    <strong>Scenario:</strong> Calculate cost for 1 pack of buns
                  </p>
                  <p>
                    <strong>Stock:</strong> 6-pack case purchased for $18.00
                  </p>
                  <p>
                    <strong>Pack size:</strong> 8 buns each
                  </p>
                </div>
                <div className="bg-muted/50 p-3 rounded text-sm">
                  <p>
                    <strong>Calculation:</strong>
                  </p>
                  <p>1. Case = 6 packs</p>
                  <p>2. Cost per pack = $18.00 ÷ 6 packs = $3.00/pack</p>
                  <p>3. Cost for 1 pack = $3.00</p>
                </div>
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>This demonstrates direct package-to-package conversion</AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Unit Conversion Hierarchy</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm space-y-2">
                  <p>
                    <strong>Mass Units:</strong> kg ↔ g ↔ lb ↔ oz
                  </p>
                  <p>
                    <strong>Volume Units:</strong> liter ↔ ml ↔ gallon ↔ cup
                  </p>
                  <p>
                    <strong>Piece Units:</strong> piece ↔ item ↔ unit
                  </p>
                  <p>
                    <strong>Package Units:</strong> case → box → pack → piece
                  </p>
                </div>
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>Package conversions require material-specific configuration for accurate calculations</AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
