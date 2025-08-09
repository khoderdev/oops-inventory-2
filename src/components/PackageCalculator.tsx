import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Package, Plus, Trash2 } from 'lucide-react';
import { calculatePackagedGoodCost, formatCurrency, formatNumber } from '@/utils/conversionLogic';
import { PackagedGood, CalculationBreakdown } from '@/types/conversion';

const PACKAGE_TYPES = [
  { value: 'box', label: 'Box' },
  { value: 'pack', label: 'Pack' },
  { value: 'case', label: 'Case' },
  { value: 'bottle', label: 'Bottle' },
  { value: 'piece', label: 'Individual Piece' }
];

const BASE_UNITS = [
  { value: 'piece', label: 'Individual Pieces' },
  { value: 'gram', label: 'Grams' },
  { value: 'kg', label: 'Kilograms' },
  { value: 'ml', label: 'Milliliters' },
  { value: 'l', label: 'Liters' }
];

const DEFAULT_PACKAGES: PackagedGood[] = [
  {
    name: 'Burger Buns',
    packageType: 'box',
    unitsPerPackage: 12,
    costPerPackage: 3.00,
    baseUnit: 'piece'
  },
  {
    name: 'Pickles',
    packageType: 'pack',
    unitsPerPackage: 3000,
    costPerPackage: 3.30,
    baseUnit: 'gram'
  },
  {
    name: 'Ketchup',
    packageType: 'bottle',
    unitsPerPackage: 500,
    costPerPackage: 2.00,
    baseUnit: 'ml'
  }
];

export function PackageCalculator() {
  const [packages, setPackages] = useState<PackagedGood[]>(DEFAULT_PACKAGES);
  const [selectedPackage, setSelectedPackage] = useState<string>('');
  const [requestedQuantity, setRequestedQuantity] = useState<string>('');
  const [requestedUnit, setRequestedUnit] = useState<string>('');
  const [result, setResult] = useState<CalculationBreakdown | null>(null);
  const [error, setError] = useState<string>('');
  
  // New package form
  const [newPackage, setNewPackage] = useState<Partial<PackagedGood>>({
    name: '',
    packageType: 'box',
    unitsPerPackage: 0,
    costPerPackage: 0,
    baseUnit: 'piece'
  });
  const [showAddForm, setShowAddForm] = useState(false);

  const handleCalculate = () => {
    setError('');
    
    if (!selectedPackage || !requestedQuantity || !requestedUnit) {
      setError('Please fill in all fields');
      return;
    }

    const packageData = packages.find(p => p.name === selectedPackage);
    if (!packageData) {
      setError('Selected package not found');
      return;
    }

    const quantity = parseFloat(requestedQuantity);
    if (isNaN(quantity) || quantity <= 0) {
      setError('Please enter a valid positive quantity');
      return;
    }

    try {
      const calculationResult = calculatePackagedGoodCost(
        packageData,
        quantity,
        requestedUnit
      );
      setResult(calculationResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Calculation failed');
    }
  };

  const addNewPackage = () => {
    if (!newPackage.name || !newPackage.unitsPerPackage || !newPackage.costPerPackage) {
      setError('Please fill in all package details');
      return;
    }

    const packageToAdd: PackagedGood = {
      name: newPackage.name!,
      packageType: newPackage.packageType as any,
      unitsPerPackage: newPackage.unitsPerPackage!,
      costPerPackage: newPackage.costPerPackage!,
      baseUnit: newPackage.baseUnit!
    };

    setPackages([...packages, packageToAdd]);
    setNewPackage({
      name: '',
      packageType: 'box',
      unitsPerPackage: 0,
      costPerPackage: 0,
      baseUnit: 'piece'
    });
    setShowAddForm(false);
    setError('');
  };

  const removePackage = (packageName: string) => {
    setPackages(packages.filter(p => p.name !== packageName));
    if (selectedPackage === packageName) {
      setSelectedPackage('');
    }
  };

  const selectedPackageData = packages.find(p => p.name === selectedPackage);

  return (
    <div className="space-y-6">
      <Card className="shadow-card hover:shadow-hover transition-all duration-300">
        <CardHeader className="bg-gradient-primary text-primary-foreground rounded-t-lg">
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Package Cost Calculator
          </CardTitle>
          <CardDescription className="text-primary-foreground/80">
            Calculate costs for packaged goods with custom unit conversions
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          {/* Package Selection */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="package">Select Package</Label>
              <Select value={selectedPackage} onValueChange={setSelectedPackage}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose package" />
                </SelectTrigger>
                <SelectContent>
                  {packages.map((pkg) => (
                    <SelectItem key={pkg.name} value={pkg.name}>
                      {pkg.name} ({pkg.unitsPerPackage} {pkg.baseUnit}/{pkg.packageType})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity Needed</Label>
              <Input
                id="quantity"
                type="number"
                step="any"
                placeholder="Enter quantity"
                value={requestedQuantity}
                onChange={(e) => setRequestedQuantity(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="unit">Unit</Label>
              <Select value={requestedUnit} onValueChange={setRequestedUnit}>
                <SelectTrigger>
                  <SelectValue placeholder="Select unit" />
                </SelectTrigger>
                <SelectContent>
                  {BASE_UNITS.map((unit) => (
                    <SelectItem key={unit.value} value={unit.value}>
                      {unit.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button onClick={handleCalculate} className="w-full">
                Calculate Cost
              </Button>
            </div>
          </div>

          {/* Package Details */}
          {selectedPackageData && (
            <div className="bg-accent/30 rounded-lg p-4">
              <h4 className="font-semibold mb-2">{selectedPackageData.name} Details:</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="font-medium">Package Type:</span>
                  <br />
                  {selectedPackageData.packageType}
                </div>
                <div>
                  <span className="font-medium">Units per Package:</span>
                  <br />
                  {selectedPackageData.unitsPerPackage} {selectedPackageData.baseUnit}
                </div>
                <div>
                  <span className="font-medium">Cost per Package:</span>
                  <br />
                  {formatCurrency(selectedPackageData.costPerPackage)}
                </div>
                <div>
                  <span className="font-medium">Cost per Unit:</span>
                  <br />
                  {formatCurrency(selectedPackageData.costPerPackage / selectedPackageData.unitsPerPackage)}
                </div>
              </div>
            </div>
          )}

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
            <CardTitle>Cost Calculation Result</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-success/10 border border-success/20 rounded-lg p-4">
              <div className="text-2xl font-bold text-success">
                Total Cost: {formatCurrency(result.totalCost)}
              </div>
              <div className="text-lg text-muted-foreground mt-1">
                For {formatNumber(result.originalValue)} {result.originalUnit}
              </div>
            </div>

            {result.steps.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">Calculation Breakdown:</h4>
                <div className="space-y-1">
                  {result.steps.map((step, index) => (
                    <div key={index} className="text-sm bg-muted/50 p-3 rounded">
                      <span className="font-medium text-primary">{index + 1}.</span> {step}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Manage Packages */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Manage Packages
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAddForm(!showAddForm)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Package
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add New Package Form */}
          {showAddForm && (
            <div className="border rounded-lg p-4 bg-accent/20">
              <h4 className="font-semibold mb-4">Add New Package</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Package Name</Label>
                  <Input
                    placeholder="e.g., Premium Beef Patties"
                    value={newPackage.name || ''}
                    onChange={(e) => setNewPackage({...newPackage, name: e.target.value})}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Package Type</Label>
                  <Select
                    value={newPackage.packageType}
                    onValueChange={(value) => setNewPackage({...newPackage, packageType: value as any})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PACKAGE_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Base Unit</Label>
                  <Select
                    value={newPackage.baseUnit}
                    onValueChange={(value) => setNewPackage({...newPackage, baseUnit: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {BASE_UNITS.map((unit) => (
                        <SelectItem key={unit.value} value={unit.value}>
                          {unit.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Units per Package</Label>
                  <Input
                    type="number"
                    placeholder="e.g., 12"
                    value={newPackage.unitsPerPackage || ''}
                    onChange={(e) => setNewPackage({...newPackage, unitsPerPackage: parseFloat(e.target.value) || 0})}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Cost per Package ($)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="e.g., 15.99"
                    value={newPackage.costPerPackage || ''}
                    onChange={(e) => setNewPackage({...newPackage, costPerPackage: parseFloat(e.target.value) || 0})}
                  />
                </div>

                <div className="flex items-end gap-2">
                  <Button onClick={addNewPackage} className="flex-1">
                    Add Package
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowAddForm(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Package List */}
          <div className="space-y-2">
            <h4 className="font-semibold">Current Packages:</h4>
            {packages.map((pkg, index) => (
              <div key={index} className="flex items-center justify-between bg-muted/30 p-3 rounded">
                <div>
                  <span className="font-medium">{pkg.name}</span>
                  <span className="text-sm text-muted-foreground ml-2">
                    ({pkg.unitsPerPackage} {pkg.baseUnit}/{pkg.packageType} - {formatCurrency(pkg.costPerPackage)})
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removePackage(pkg.name)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}