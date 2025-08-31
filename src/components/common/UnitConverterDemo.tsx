import React, { useState } from "react";
import { UnitConverter } from "./UnitConverter";
import { UnitType } from "@/types/inventory";

export const UnitConverterDemo: React.FC = () => {
  // Material Form Scenario State
  const [materialScenario, setMaterialScenario] = useState({
    materialType: "food" as "food" | "beverage" | "other",
    unitType: "mass" as UnitType,
    baseUnit: "kg",
    inputUnit: "g",
    quantity: 500,
    costPerUnit: 0.02,
    totalCost: 10,
    packageQuantity: 12,
    volumePerBottle: 750,
    volumeUnit: "ml"
  });

  // Stock Entry Scenario State
  const [stockScenario, setStockScenario] = useState({
    materialType: "beverage" as "food" | "beverage" | "other",
    unitType: "package" as UnitType,
    baseUnit: "bottle",
    inputUnit: "case",
    quantity: 2,
    costPerUnit: 45,
    totalCost: 90,
    packageQuantity: 24,
    volumePerBottle: 330,
    volumeUnit: "ml"
  });

  // Sauce/Recipe Scenario State
  const [sauceScenario, setSauceScenario] = useState({
    materialType: "food" as "food" | "beverage" | "other",
    unitType: "volume" as UnitType,
    baseUnit: "l",
    inputUnit: "ml",
    quantity: 250,
    costPerUnit: 0.008,
    totalCost: 2,
    packageQuantity: 1,
    volumePerBottle: 0,
    volumeUnit: "ml"
  });

  const [activeTab, setActiveTab] = useState<"material" | "stock" | "sauce">("material");

  const scenarios = {
    material: {
      title: "Material Creation Form",
      description: "Creating a new food material with mass units",
      state: materialScenario,
      setState: setMaterialScenario
    },
    stock: {
      title: "Stock Entry Form",
      description: "Adding beverage stock with package units",
      state: stockScenario,
      setState: setStockScenario
    },
    sauce: {
      title: "Sauce/Recipe Form",
      description: "Creating a sauce with volume measurements",
      state: sauceScenario,
      setState: setSauceScenario
    }
  };

  const currentScenario = scenarios[activeTab];

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Dynamic Unit Converter Component Demo</h1>
        <p className="text-gray-600">Comprehensive unit conversion and cost calculation for inventory management</p>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {Object.entries(scenarios).map(([key, scenario]) => (
              <button key={key} onClick={() => setActiveTab(key as "material" | "stock" | "sauce")} className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === key ? "border-blue-500 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"}`}>
                {scenario.title}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Scenario Description */}
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
        <h3 className="text-lg font-medium text-blue-900 mb-1">{currentScenario.title}</h3>
        <p className="text-blue-700">{currentScenario.description}</p>
      </div>

      {/* Scenario Controls */}
      <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-md">
        <h4 className="text-sm font-medium text-gray-800 mb-3">Scenario Configuration</h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Material Type</label>
            <select
              value={currentScenario.state.materialType}
              onChange={e =>
                currentScenario.setState({
                  ...currentScenario.state,
                  materialType: e.target.value as "food" | "beverage" | "other"
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="food">Food</option>
              <option value="beverage">Beverage</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Unit Type</label>
            <select
              value={currentScenario.state.unitType}
              onChange={e =>
                currentScenario.setState({
                  ...currentScenario.state,
                  unitType: e.target.value as UnitType
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="mass">Mass</option>
              <option value="volume">Volume</option>
              <option value="piece">Piece</option>
              <option value="package">Package</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Base Unit</label>
            <input
              type="text"
              value={currentScenario.state.baseUnit}
              onChange={e =>
                currentScenario.setState({
                  ...currentScenario.state,
                  baseUnit: e.target.value
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Base unit"
            />
          </div>
        </div>
      </div>

      {/* Unit Converter Component */}
      <div className="border border-gray-300 rounded-lg p-6 bg-white shadow-sm">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Unit Converter Component</h3>

        <UnitConverter
          materialType={currentScenario.state.materialType}
          unitType={currentScenario.state.unitType}
          baseUnit={currentScenario.state.baseUnit}
          inputUnit={currentScenario.state.inputUnit}
          quantity={currentScenario.state.quantity}
          costPerUnit={currentScenario.state.costPerUnit}
          totalCost={currentScenario.state.totalCost}
          packageQuantity={currentScenario.state.packageQuantity}
          volumePerBottle={currentScenario.state.volumePerBottle}
          volumeUnit={currentScenario.state.volumeUnit}
          showConversionInfo={true}
          showCostBreakdown={true}
          showVolumeInputs={currentScenario.state.materialType === "beverage"}
          showPackageInputs={currentScenario.state.unitType === "package"}
          onQuantityChange={quantity =>
            currentScenario.setState({
              ...currentScenario.state,
              quantity
            })
          }
          onInputUnitChange={inputUnit =>
            currentScenario.setState({
              ...currentScenario.state,
              inputUnit
            })
          }
          onCostPerUnitChange={costPerUnit =>
            currentScenario.setState({
              ...currentScenario.state,
              costPerUnit
            })
          }
          onTotalCostChange={totalCost =>
            currentScenario.setState({
              ...currentScenario.state,
              totalCost
            })
          }
          onPackageQuantityChange={packageQuantity =>
            currentScenario.setState({
              ...currentScenario.state,
              packageQuantity
            })
          }
          onVolumePerBottleChange={volumePerBottle =>
            currentScenario.setState({
              ...currentScenario.state,
              volumePerBottle
            })
          }
          onVolumeUnitChange={volumeUnit =>
            currentScenario.setState({
              ...currentScenario.state,
              volumeUnit
            })
          }
          className="unit-converter-demo"
        />
      </div>

      {/* Integration Examples */}
      <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
        <h4 className="text-sm font-medium text-yellow-800 mb-3">🔧 Integration Examples</h4>

        <div className="space-y-4 text-sm text-yellow-700">
          <div>
            <strong>Material Form Integration:</strong>
            <pre className="mt-1 p-2 bg-white rounded border text-xs overflow-x-auto">
              {`<UnitConverter
  materialType="food"
  unitType={form.watch("unitType")}
  baseUnit={form.watch("baseUnit")}
  inputUnit={form.watch("inputUnit")}
  quantity={parseFloat(form.watch("quantity")) || 0}
  costPerUnit={parseFloat(form.watch("costPerUnit")) || 0}
  onInputUnitChange={(unit) => form.setValue("inputUnit", unit)}
  onQuantityChange={(qty) => form.setValue("quantity", qty.toString())}
  showConversionInfo={true}
  showCostBreakdown={true}
/>`}
            </pre>
          </div>

          <div>
            <strong>Stock Entry Form Integration:</strong>
            <pre className="mt-1 p-2 bg-white rounded border text-xs overflow-x-auto">
              {`<UnitConverter
  materialType={selectedMaterial?.category === "beverages" ? "beverage" : "food"}
  unitType={selectedMaterial?.unitType || "mass"}
  baseUnit={selectedMaterial?.baseUnit || "kg"}
  inputUnit={form.watch("purchasedUnit")}
  quantity={parseFloat(form.watch("purchasedQuantity")) || 0}
  costPerUnit={parseFloat(form.watch("costPerPurchasedUnit")) || 0}
  totalCost={parseFloat(form.watch("totalCost")) || 0}
  onInputUnitChange={(unit) => form.setValue("purchasedUnit", unit)}
  onQuantityChange={(qty) => form.setValue("purchasedQuantity", qty.toString())}
  onCostPerUnitChange={(cost) => form.setValue("costPerPurchasedUnit", cost.toString())}
  onTotalCostChange={(cost) => form.setValue("totalCost", cost.toString())}
  showVolumeInputs={selectedMaterial?.category === "beverages"}
  showPackageInputs={selectedMaterial?.unitType === "package"}
/>`}
            </pre>
          </div>
        </div>
      </div>

      {/* Feature Summary */}
      <div className="mt-8 p-4 bg-green-50 border border-green-200 rounded-md">
        <h4 className="text-sm font-medium text-green-800 mb-3">✅ Component Features</h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-green-700">
          <div>
            <strong>Core Features:</strong>
            <ul className="mt-1 space-y-1 ml-4">
              <li>• Dynamic unit selection based on material type</li>
              <li>• Real-time conversion calculations</li>
              <li>• Automatic cost calculations (per unit ↔ total)</li>
              <li>• Package quantity support</li>
              <li>• Beverage volume per bottle inputs</li>
            </ul>
          </div>

          <div>
            <strong>Display Features:</strong>
            <ul className="mt-1 space-y-1 ml-4">
              <li>• Detailed conversion information</li>
              <li>• Step-by-step calculation breakdown</li>
              <li>• Cost analysis and breakdown</li>
              <li>• Warnings and validation messages</li>
              <li>• Quick reference for available units</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UnitConverterDemo;
