import { useState, useEffect, useMemo } from "react";
import { Button } from "../../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../ui/tabs";
import { Badge } from "../../ui/badge";
import { Plus, Trash2, Edit } from "lucide-react";
import { formatCurrency } from "@/utils/conversionLogic";
import { 
  getIngredientsByVariantId, 
  createVariantIngredient, 
  updateVariantIngredient, 
  deleteVariantIngredient,
  VariantIngredient,
  CreateVariantIngredientData 
} from "@/api/variantIngredients.api";
import { IngredientsTable } from "./IngredientsTable";
import { VariantIngredientForm } from "./VariantIngredientForm";

interface Variant {
  id: number;
  name: string;
  volume: number;
  unit: string;
  price: number;
  isActive: boolean;
}

interface VariantIngredientsProps {
  variants: Variant[];
  materials: any[];
  sauces: any[];
  stockEntries: any[];
  onIngredientsChange?: (variantId: number, ingredients: VariantIngredient[]) => void;
}

export function VariantIngredients({ 
  variants, 
  materials, 
  sauces, 
  stockEntries, 
  onIngredientsChange 
}: VariantIngredientsProps) {
  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(null);
  const [variantIngredients, setVariantIngredients] = useState<Record<number, VariantIngredient[]>>({});
  const [loading, setLoading] = useState<Record<number, boolean>>({});
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState<VariantIngredient | null>(null);

  const activeVariants = useMemo(() => 
    variants.filter(v => v.isActive).sort((a, b) => a.name.localeCompare(b.name)),
    [variants]
  );

  // Set default selected variant
  useEffect(() => {
    if (activeVariants.length > 0 && !selectedVariantId) {
      setSelectedVariantId(activeVariants[0].id);
    }
  }, [activeVariants, selectedVariantId]);

  // Load ingredients for a variant
  const loadVariantIngredients = async (variantId: number) => {
    if (variantIngredients[variantId]) return; // Already loaded

    setLoading(prev => ({ ...prev, [variantId]: true }));
    try {
      const response = await getIngredientsByVariantId(variantId);
      setVariantIngredients(prev => ({
        ...prev,
        [variantId]: response.data
      }));
      onIngredientsChange?.(variantId, response.data);
    } catch (error) {
      console.error(`Failed to load ingredients for variant ${variantId}:`, error);
      setVariantIngredients(prev => ({
        ...prev,
        [variantId]: []
      }));
    } finally {
      setLoading(prev => ({ ...prev, [variantId]: false }));
    }
  };

  // Load ingredients when variant is selected
  useEffect(() => {
    if (selectedVariantId) {
      loadVariantIngredients(selectedVariantId);
    }
  }, [selectedVariantId]);

  const handleAddIngredient = async (data: CreateVariantIngredientData) => {
    if (!selectedVariantId) return;

    try {
      const response = await createVariantIngredient({
        ...data,
        variantId: selectedVariantId
      });
      
      const updatedIngredients = [...(variantIngredients[selectedVariantId] || []), response.data];
      setVariantIngredients(prev => ({
        ...prev,
        [selectedVariantId]: updatedIngredients
      }));
      onIngredientsChange?.(selectedVariantId, updatedIngredients);
      setShowAddForm(false);
    } catch (error) {
      console.error('Failed to add ingredient:', error);
    }
  };

  const handleUpdateIngredient = async (id: number, data: Partial<CreateVariantIngredientData>) => {
    if (!selectedVariantId) return;

    try {
      const response = await updateVariantIngredient(id, data);
      
      const updatedIngredients = (variantIngredients[selectedVariantId] || []).map(ing =>
        ing.id === id ? response.data : ing
      );
      setVariantIngredients(prev => ({
        ...prev,
        [selectedVariantId]: updatedIngredients
      }));
      onIngredientsChange?.(selectedVariantId, updatedIngredients);
      setEditingIngredient(null);
    } catch (error) {
      console.error('Failed to update ingredient:', error);
    }
  };

  const handleDeleteIngredient = async (id: number) => {
    if (!selectedVariantId) return;

    try {
      await deleteVariantIngredient(id);
      
      const updatedIngredients = (variantIngredients[selectedVariantId] || []).filter(ing => ing.id !== id);
      setVariantIngredients(prev => ({
        ...prev,
        [selectedVariantId]: updatedIngredients
      }));
      onIngredientsChange?.(selectedVariantId, updatedIngredients);
    } catch (error) {
      console.error('Failed to delete ingredient:', error);
    }
  };

  const calculateVariantCost = (variantId: number): number => {
    const ingredients = variantIngredients[variantId] || [];
    return ingredients.reduce((total, ingredient) => {
      // Use the stored cost or calculate from material/sauce data
      return total + (ingredient.cost || 0);
    }, 0);
  };

  const currentIngredients = selectedVariantId ? variantIngredients[selectedVariantId] || [] : [];
  const isLoading = selectedVariantId ? loading[selectedVariantId] : false;

  if (activeVariants.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-muted-foreground text-center">
            No active variants found. Please add variants to manage ingredients.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Variant-Specific Ingredients
            <Badge variant="outline">
              {activeVariants.length} variant{activeVariants.length !== 1 ? 's' : ''}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedVariantId?.toString()} onValueChange={(value) => setSelectedVariantId(Number(value))}>
            <TabsList className="grid w-full grid-cols-auto gap-1 mb-4" style={{ gridTemplateColumns: `repeat(${Math.min(activeVariants.length, 4)}, 1fr)` }}>
              {activeVariants.map((variant) => (
                <TabsTrigger 
                  key={variant.id} 
                  value={variant.id.toString()}
                  className="flex flex-col items-center p-2 text-xs"
                >
                  <span className="font-medium">{variant.name}</span>
                  <span className="text-muted-foreground">
                    {variant.volume}{variant.unit} • {formatCurrency(variant.price)}
                  </span>
                  <Badge variant="secondary" className="mt-1 text-xs">
                    Cost: {formatCurrency(calculateVariantCost(variant.id))}
                  </Badge>
                </TabsTrigger>
              ))}
            </TabsList>

            {activeVariants.map((variant) => (
              <TabsContent key={variant.id} value={variant.id.toString()} className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">{variant.name} Ingredients</h3>
                    <p className="text-sm text-muted-foreground">
                      {variant.volume}{variant.unit} serving • {formatCurrency(variant.price)} • 
                      Total Cost: {formatCurrency(calculateVariantCost(variant.id))}
                    </p>
                  </div>
                  <Button
                    onClick={() => setShowAddForm(true)}
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Add Ingredient
                  </Button>
                </div>

                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : (
                  <IngredientsTable
                    ingredients={currentIngredients.map(ing => ({
                      id: ing.id,
                      type: ing.materialId ? "material" : "sauce",
                      materialId: ing.materialId?.toString() || "",
                      sauceId: ing.sauceId?.toString(),
                      quantity: ing.quantity,
                      unit: ing.unit,
                      cost: ing.cost,
                      notes: ing.notes,
                      material: ing.material,
                      sauce: ing.sauce
                    }))}
                    stockEntries={stockEntries}
                    materials={materials}
                    sauces={sauces}
                    formatNumber={(value) => value.toFixed(3)}
                    formatCurrency={(amount) => `$${amount.toFixed(2)}`}
                    calculateIngredientCost={() => 0}
                    getMaterialCostPerBaseUnit={() => 0}
                    handleRemoveIngredient={() => {}}
                    totalIngredientsCost={calculateVariantCost(variant.id)}
                    price={variant.price.toString()}
                    onEdit={(ingredient) => setEditingIngredient(ingredient as VariantIngredient)}
                    onDelete={(id) => handleDeleteIngredient(id)}
                    showActions={true}
                  />
                )}
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {/* Add Ingredient Form */}
      {showAddForm && (
        <VariantIngredientForm
          materials={materials}
          sauces={sauces}
          stockEntries={stockEntries}
          onSubmit={handleAddIngredient}
          onCancel={() => setShowAddForm(false)}
        />
      )}

      {/* Edit Ingredient Form */}
      {editingIngredient && (
        <VariantIngredientForm
          materials={materials}
          sauces={sauces}
          stockEntries={stockEntries}
          initialData={editingIngredient}
          onSubmit={(data) => handleUpdateIngredient(editingIngredient.id, data)}
          onCancel={() => setEditingIngredient(null)}
          isEditing={true}
        />
      )}
    </div>
  );
}
