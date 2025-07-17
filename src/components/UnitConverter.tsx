import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalculationBreakdown } from "@/types/conversion";
import { formatCurrency, formatNumber, performConversion } from "@/utils/conversionLogic";
import { ArrowRightLeft, Calculator } from "lucide-react";
import { useState } from "react";

const MASS_UNITS = [
  { value: "kg", label: "Kilograms (kg)" },
  { value: "gram", label: "Grams (g)" },
  { value: "lb", label: "Pounds (lb)" }
];

const VOLUME_UNITS = [
  { value: "liter", label: "Liters (L)" },
  { value: "ml", label: "Milliliters (ml)" },
  { value: "gallon", label: "Gallons (gal)" }
];

export function UnitConverter() {
  const [value, setValue] = useState<string>("");
  const [fromUnit, setFromUnit] = useState<string>("");
  const [toUnit, setToUnit] = useState<string>("");
  const [costPer, setCostPer] = useState<string>("");
  const [costUnit, setCostUnit] = useState<string>("");
  const [conversionType, setConversionType] = useState<"mass" | "volume">("mass");
  const [result, setResult] = useState<CalculationBreakdown | null>(null);
  const [error, setError] = useState<string>("");

  const currentUnits = conversionType === "mass" ? MASS_UNITS : VOLUME_UNITS;

  const handleConvert = () => {
    setError("");

    if (!value || !fromUnit || !toUnit) {
      setError("Please fill in all required fields");
      return;
    }

    const numValue = parseFloat(value);
    const numCostPer = costPer ? parseFloat(costPer) : undefined;

    if (isNaN(numValue) || numValue <= 0) {
      setError("Please enter a valid positive number");
      return;
    }

    if (costPer && (isNaN(numCostPer!) || numCostPer! <= 0)) {
      setError("Please enter a valid cost per unit");
      return;
    }

    try {
      const conversionResult = performConversion({
        value: numValue,
        fromUnit,
        toUnit,
        costPer: numCostPer,
        costUnit: costUnit || toUnit
      });

      setResult(conversionResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Conversion failed");
    }
  };

  const swapUnits = () => {
    setFromUnit(toUnit);
    setToUnit(fromUnit);
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-card hover:shadow-hover transition-all duration-300">
        <CardHeader className="bg-gradient-primary text-primary-foreground rounded-t-lg">
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Unit Converter
          </CardTitle>
          <CardDescription className="text-primary-foreground/80">Convert between different units with automatic cost calculations</CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          {/* Conversion Type Selector */}
          <div className="grid grid-cols-2 gap-4">
            <Button
              variant={conversionType === "mass" ? "default" : "outline"}
              onClick={() => {
                setConversionType("mass");
                setFromUnit("");
                setToUnit("");
                setCostUnit("");
              }}
              className="w-full"
            >
              Mass Conversion
            </Button>
            <Button
              variant={conversionType === "volume" ? "default" : "outline"}
              onClick={() => {
                setConversionType("volume");
                setFromUnit("");
                setToUnit("");
                setCostUnit("");
              }}
              className="w-full"
            >
              Volume Conversion
            </Button>
          </div>

          {/* Input Section */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
            <div className="space-y-2">
              <Label htmlFor="value">Amount</Label>
              <Input id="value" type="number" step="any" placeholder="Enter amount" value={value} onChange={e => setValue(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fromUnit">From</Label>
              <Select value={fromUnit} onValueChange={setFromUnit}>
                <SelectTrigger>
                  <SelectValue placeholder="Select unit" />
                </SelectTrigger>
                <SelectContent>
                  {currentUnits.map(unit => (
                    <SelectItem key={unit.value} value={unit.value}>
                      {unit.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-center">
              <Button variant="ghost" size="icon" onClick={swapUnits} disabled={!fromUnit || !toUnit}>
                <ArrowRightLeft className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-2">
              <Label htmlFor="toUnit">To</Label>
              <Select value={toUnit} onValueChange={setToUnit}>
                <SelectTrigger>
                  <SelectValue placeholder="Select unit" />
                </SelectTrigger>
                <SelectContent>
                  {currentUnits.map(unit => (
                    <SelectItem key={unit.value} value={unit.value}>
                      {unit.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button onClick={handleConvert} className="w-full">
              Convert
            </Button>
          </div>

          {/* Cost Calculation Section */}
          <div className="border-t pt-4">
            <h3 className="text-lg font-semibold mb-4">Cost Calculation (Optional)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="costPer">Cost per unit ($)</Label>
                <Input id="costPer" type="number" step="any" placeholder="e.g., 3.30" value={costPer} onChange={e => setCostPer(e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="costUnit">Cost unit</Label>
                <Select value={costUnit} onValueChange={setCostUnit}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select cost unit" />
                  </SelectTrigger>
                  <SelectContent>
                    {currentUnits.map(unit => (
                      <SelectItem key={unit.value} value={unit.value}>
                        {unit.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
              <p className="text-destructive font-medium">{error}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results Card */}
      {result && (
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Conversion Result</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-accent/50 rounded-lg p-4">
              <div className="text-2xl font-bold text-primary">
                {formatNumber(result.originalValue)} {result.originalUnit} = {formatNumber(result.convertedValue)} {result.convertedUnit}
              </div>
              {result.totalCost > 0 && <div className="text-xl font-semibold text-success mt-2">Total Cost: {formatCurrency(result.totalCost)}</div>}
            </div>

            {result.steps.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">Calculation Steps:</h4>
                <div className="space-y-1">
                  {result.steps.map((step, index) => (
                    <div key={index} className="text-sm text-muted-foreground bg-muted/50 p-2 rounded">
                      {index + 1}. {step}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
