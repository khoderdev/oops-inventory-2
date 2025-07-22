import { menuAPI } from "@/api/menu.api.ts.tsx";
import { posAPI } from "@/api/pos.api.ts";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { errorMessageAtom, showPOSPanelAtom, successMessageAtom } from "@/store/inventoryAtoms";
import { createSaleAction } from "@/store/posActions";
import { CartItem, MenuItem, MenuItemSale, NegativeStockWarning, POSPanelProps, Section, SectionAssignment, SoldItem } from "@/types/inventory";
import { formatCurrency, formatNumber } from "@/utils/conversionLogic";
import { useAtom } from "jotai";
import { AlertCircle, AlertTriangle, Check, History, Loader2, Minus, Package, PackageSearch, Plus, Search, ShoppingCart, Trash2, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

export function POSPanel({ materials, sectionAssignments, initialSectionId }: POSPanelProps) {
  const [selectedSectionId, setSelectedSectionId] = useState(initialSectionId || "");
  const [, setShowPOSPanel] = useAtom(showPOSPanelAtom);
  const [successMessage, setSuccessMessage] = useAtom(successMessageAtom);
  const [, setErrorMessage] = useAtom(errorMessageAtom);
  const [, createSale] = useAtom(createSaleAction);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, setMenuItems] = useState<MenuItem[]>([]);
  const [optimisticAssignments, setOptimisticAssignments] = useState<SectionAssignment[]>(sectionAssignments);
  const [, setIsRefreshing] = useState(false);
  const [negativeStockWarnings, setNegativeStockWarnings] = useState<NegativeStockWarning[]>([]);
  const [showNegativeStockDialog, setShowNegativeStockDialog] = useState(false);
  const errorTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const successTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const navigate = useNavigate();

  const showError = useCallback((message: string) => {
    setError(message);
    if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
    errorTimeoutRef.current = setTimeout(() => setError(null), 5000);
  }, []);

  useEffect(() => {
    if (initialSectionId) {
      setSelectedSectionId(initialSectionId);
    }
  }, [initialSectionId]);

  // Update optimistic assignments when props change
  useEffect(() => {
    setOptimisticAssignments(sectionAssignments);
  }, [sectionAssignments]);

  // Fetch menu items
  useEffect(() => {
    const fetchMenuItems = async () => {
      try {
        const response = await menuAPI.getMenus();
        setMenuItems(response.data);
      } catch (error) {
        console.error("Failed to fetch menu items:", error);
        showError("Failed to load menu items");
      }
    };
    fetchMenuItems();
  }, [showError]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
      if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current);
    };
  }, []);

  const sections = useMemo(() => {
    const sectionMap = new Map<string, Section>();
    optimisticAssignments.forEach(assignment => {
      if (assignment.section) {
        const sectionId = String(assignment.section.id);
        if (!sectionMap.has(sectionId)) {
          sectionMap.set(sectionId, assignment.section);
        }
      }
    });
    return Array.from(sectionMap.values());
  }, [optimisticAssignments]);

  const availableItems = useMemo(() => {
    if (!selectedSectionId) return [];
    const items: Array<{
      type: "individual" | "menu";
      id: string;
      name: string;
      unitPrice: number;
      unit?: string;
      assignmentId?: string;
      menuItemId?: number;
      currentQuantity?: number;
      ingredients?: { materialId: number; quantity: number; unit: string }[];
    }> = [];
    const sectionAssignmentsForSection = optimisticAssignments.filter(a => {
      const matches = Number(a.sectionId) === Number(selectedSectionId);
      return matches;
    });

    const stockEntryAssignments = sectionAssignmentsForSection.filter(a => {
      const hasStockEntry = a.material && a.stockEntry;
      return hasStockEntry;
    });

    const individualItems = stockEntryAssignments
      .map(a => {
        const material = a.material;
        const stockEntry = a.stockEntry;

        if (!material || !stockEntry) {
          return null;
        }

        const isPackageUnit = material.unitType === "package";
        let displayQuantity = a.assignedQuantity || 0;
        let displayUnit = a.assignedUnit || material.baseUnit;

        // Calculate unit price from stock entry cost data
        let displayUnitPrice = 0;
        if (stockEntry.costPerPurchasedUnit && stockEntry.purchasedQuantity) {
          if (isPackageUnit && material.packageQuantity) {
            // For package units, calculate cost per individual piece
            displayUnitPrice = stockEntry.costPerPurchasedUnit / material.packageQuantity;
          } else {
            // For regular units, use cost per purchased unit
            displayUnitPrice = stockEntry.costPerPurchasedUnit;
          }
        } else if (stockEntry.totalCost && stockEntry.purchasedIndividualQuantity) {
          // Fallback: calculate from total cost and individual quantity
          displayUnitPrice = stockEntry.totalCost / stockEntry.purchasedIndividualQuantity;
        } else if (material.costPerUnit) {
          // Last resort: use material's cost per unit if available
          displayUnitPrice = parseFloat(String(material.costPerUnit));
        }

        // Ensure displayUnitPrice is a valid number
        displayUnitPrice = isNaN(displayUnitPrice) || !isFinite(displayUnitPrice) ? 0 : displayUnitPrice;

        if (isPackageUnit) {
          // Use assignedIndividualQuantity if available, otherwise calculate
          if (a.assignedIndividualQuantity !== null && a.assignedIndividualQuantity !== undefined) {
            displayQuantity = a.assignedIndividualQuantity;
            displayUnit = material.baseUnit;
          } else if (material.packageQuantity && a.assignedQuantity) {
            displayQuantity = a.assignedQuantity * material.packageQuantity;
            displayUnit = material.baseUnit;
          }
        }
        return {
          type: "individual" as const,
          id: `individual-${a.id}`,
          name: material.name,
          unitPrice: displayUnitPrice,
          unit: displayUnit,
          assignmentId: a.id.toString(),
          currentQuantity: displayQuantity
        };
      })
      .filter(item => item !== null && (item.currentQuantity || 0) > 0);

    const menuItemAssignments = sectionAssignmentsForSection.filter(a => {
      const hasMenuItem = a.menuItem && !a.stockEntry;
      return hasMenuItem;
    });

    const menuItemsInSection = menuItemAssignments
      .map(a => {
        const menuItem = a.menuItem;
        if (!menuItem) {
          return null;
        }

        return {
          type: "menu" as const,
          id: `menu-${menuItem.id}`,
          name: menuItem.name,
          unitPrice: menuItem.price,
          assignmentId: a.id.toString(),
          menuItemId: menuItem.id,
          ingredients: menuItem.ingredients || []
        };
      })
      .filter(Boolean) as unknown as Array<{
      type: "menu";
      id: string;
      name: string;
      unitPrice: number;
      assignmentId: string;
      menuItemId: number;
      ingredients: { materialId: number; quantity: number; unit: string }[];
    }>;

    items.push(...individualItems, ...menuItemsInSection);
    return items;
  }, [selectedSectionId, optimisticAssignments]);

  const filteredItems = useMemo(() => {
    return availableItems.filter(item => {
      return item.name.toLowerCase().includes(searchTerm.toLowerCase());
    });
  }, [availableItems, searchTerm]);

  // Optimistic inventory update
  const updateInventoryOptimistically = useCallback((soldItems: SoldItem[]) => {
    setOptimisticAssignments(prevAssignments => {
      return prevAssignments.map(assignment => {
        const soldItem = soldItems.find(item => item.assignmentId === assignment.id.toString());
        if (!soldItem) return assignment;

        const material = assignment.material;
        if (!material) return assignment;

        // Calculate new quantities
        let newAssignedQuantity = assignment.assignedQuantity || 0;
        let newAssignedIndividualQuantity = assignment.assignedIndividualQuantity;

        if (material.unitType === "package" && material.packageQuantity) {
          // For package units, deduct from individual quantity
          const currentIndividualQty = newAssignedIndividualQuantity || newAssignedQuantity * material.packageQuantity;
          const newIndividualQty = Math.max(0, currentIndividualQty - soldItem.quantity);
          newAssignedIndividualQuantity = newIndividualQty;
          newAssignedQuantity = newIndividualQty / material.packageQuantity;
        } else {
          // For regular units, deduct directly
          newAssignedQuantity = Math.max(0, newAssignedQuantity - soldItem.quantity);
        }

        return {
          ...assignment,
          assignedQuantity: newAssignedQuantity,
          assignedIndividualQuantity: newAssignedIndividualQuantity
        };
      });
    });
  }, []);

  // Revert optimistic updates on error
  const revertOptimisticUpdates = useCallback(() => {
    setOptimisticAssignments(sectionAssignments);
  }, [sectionAssignments]);

  // Calculate cart total
  const cartTotal = useMemo(() => {
    const total = cart.reduce((total, item) => {
      const itemTotal = isNaN(item.totalPrice) || !isFinite(item.totalPrice) ? 0 : item.totalPrice;
      return total + itemTotal;
    }, 0);
    return isNaN(total) || !isFinite(total) ? 0 : total;
  }, [cart]);

  // Add item to cart
  const addToCart = useCallback((item: (typeof availableItems)[0]) => {
    // Validate unit price
    const validUnitPrice = isNaN(item.unitPrice) || !isFinite(item.unitPrice) ? 0 : item.unitPrice;

    setCart(prevCart => {
      const existingItem = prevCart.find(cartItem => cartItem.id === item.id);

      if (existingItem) {
        const maxQuantity = item.type === "individual" ? item.currentQuantity || 1 : 999;
        const newQuantity = Math.min(existingItem.quantity + 1, maxQuantity);
        const newTotalPrice = validUnitPrice * newQuantity;

        return prevCart.map(cartItem =>
          cartItem.id === item.id
            ? {
                ...cartItem,
                quantity: newQuantity,
                unitPrice: validUnitPrice,
                totalPrice: isNaN(newTotalPrice) || !isFinite(newTotalPrice) ? 0 : newTotalPrice
              }
            : cartItem
        );
      } else {
        const totalPrice = validUnitPrice * 1;
        return [
          ...prevCart,
          {
            id: item.id,
            type: item.type,
            name: item.name,
            quantity: 1,
            unitPrice: validUnitPrice,
            totalPrice: isNaN(totalPrice) || !isFinite(totalPrice) ? 0 : totalPrice,
            unit: item.unit,
            assignmentId: item.assignmentId,
            menuItemId: item.menuItemId,
            ingredients: item.ingredients
          }
        ];
      }
    });
  }, []);

  // Remove item from cart
  const removeFromCart = useCallback((itemId: string) => {
    setCart(prevCart => prevCart.filter(item => item.id !== itemId));
  }, []);

  // Update item quantity in cart
  const updateCartItemQuantity = useCallback(
    (itemId: string, newQuantity: number) => {
      const item = availableItems.find(i => i.id === itemId);
      if (!item) return;

      const maxQuantity = item.type === "individual" ? item.currentQuantity || 1 : 999;
      const clampedQuantity = Math.min(Math.max(newQuantity, 1), maxQuantity);

      setCart(prevCart =>
        prevCart.map(cartItem => {
          if (cartItem.id === itemId) {
            const validUnitPrice = isNaN(cartItem.unitPrice) || !isFinite(cartItem.unitPrice) ? 0 : cartItem.unitPrice;
            const newTotalPrice = validUnitPrice * clampedQuantity;

            return {
              ...cartItem,
              quantity: clampedQuantity,
              unitPrice: validUnitPrice,
              totalPrice: isNaN(newTotalPrice) || !isFinite(newTotalPrice) ? 0 : newTotalPrice
            };
          }
          return cartItem;
        })
      );
    },
    [availableItems]
  );

  // Complete sale with optimistic updates
  const completeSale = useCallback(async () => {
    if (cart.length === 0) {
      showError("Cart is empty");
      return;
    }

    // Check if we have individual items that require a section
    const hasIndividualItems = cart.some(item => item.type === "individual");
    const hasMenuItems = cart.some(item => item.type === "menu");

    if (hasIndividualItems && !selectedSectionId) {
      showError("Please select a section for individual item sales");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Determine sectionId based on sale type
      let finalSectionId: string | undefined;
      if (hasIndividualItems) {
        // Individual items require a valid section ID
        finalSectionId = selectedSectionId;
      } else {
        // Menu items can have null/undefined sectionId
        finalSectionId = undefined;
      }

      // Prepare individual items for sale
      const individualItems: SoldItem[] = [];
      const menuItemsForSale: MenuItemSale[] = [];

      cart.forEach(cartItem => {
        if (cartItem.type === "individual") {
          // Find the original item to get material info
          const originalItem = availableItems.find(item => item.id === cartItem.id);
          if (originalItem && originalItem.assignmentId) {
            // Find the assignment to get material details
            const assignment = sectionAssignments.find(a => a.id.toString() === originalItem.assignmentId);
            const material = materials.find(m => m.id === String(assignment?.materialId));

            individualItems.push({
              assignmentId: originalItem.assignmentId,
              materialId: String(assignment?.materialId || ""),
              sectionId: selectedSectionId,
              materialName: material?.name || cartItem.name,
              unit: cartItem.unit || "",
              quantity: cartItem.quantity,
              unitPrice: cartItem.unitPrice,
              totalPrice: cartItem.totalPrice
            });
          }
        } else if (cartItem.type === "menu") {
          // Menu item sale
          menuItemsForSale.push({
            menuItemId: String(cartItem.menuItemId!),
            quantity: cartItem.quantity,
            unitPrice: cartItem.unitPrice,
            totalPrice: cartItem.totalPrice,
            ingredients:
              cartItem.ingredients?.map(i => ({
                materialId: String(i.materialId),
                quantity: i.quantity,
                unit: i.unit
              })) || [],
            createdAt: new Date(),
            updatedAt: undefined
          });
        }
      });

      const saleData = {
        saleDate: new Date(),
        totalAmount: cartTotal,
        sectionId: finalSectionId,
        items: individualItems,
        menuItems: menuItemsForSale,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Apply optimistic updates before API call
      updateInventoryOptimistically(individualItems);

      // Clear cart immediately for better UX
      const currentCart = [...cart];
      setCart([]);

      try {
        const response = await posAPI.createSale(saleData);
        const saleResponse = response.data;

        // Handle negative stock warnings from the API response
        const warnings = saleResponse.negativeStockWarnings || [];
        setNegativeStockWarnings(warnings);
        if (warnings.length > 0) {
          setShowNegativeStockDialog(true);
        }
      } catch (apiError) {
        // Revert optimistic updates on API failure
        revertOptimisticUpdates();
        setCart(currentCart); // Restore cart
        throw apiError;
      }
    } catch (error: unknown) {
      console.error("Sale failed:", error);
      const errorMessage = error && typeof error === "object" && "response" in error ? (error as { response?: { data?: { error?: string } } }).response?.data?.error : undefined;
      showError(errorMessage || "Failed to complete sale");
    } finally {
      setIsLoading(false);
    }
  }, [cart, cartTotal, selectedSectionId, availableItems, materials, sectionAssignments, updateInventoryOptimistically, revertOptimisticUpdates, showError]);

  const getSectionName = (sectionId: string) => {
    const section = sections.find(s => String(s.id) === String(sectionId));
    return section?.name || "Unknown Section";
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-4 md:p-6">
      {/* Section Selection and Items */}
      <div className="lg:col-span-2 space-y-6">
        {/* Messages */}
        <div className="space-y-3">
          {error && (
            <Alert variant="destructive" className="animate-fade-in">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="font-medium">{error}</AlertDescription>
            </Alert>
          )}

          {successMessage && (
            <Alert className="border-green-300 bg-green-50 text-green-800 animate-fade-in">
              <Check className="h-4 w-4" />
              <AlertDescription className="font-medium">{successMessage}</AlertDescription>
            </Alert>
          )}
        </div>

        {/* Negative Stock Warnings Dialog */}
        <Dialog open={showNegativeStockDialog} onOpenChange={setShowNegativeStockDialog}>
          <DialogContent className="max-w-2xl rounded-xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="h-5 w-5" />
                Negative Stock Warning
              </DialogTitle>
              <DialogDescription className="text-gray-600">The following items resulted in negative stock after this sale. The sale was completed, but these items may need restocking.</DialogDescription>
            </DialogHeader>
            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
              {negativeStockWarnings.map((warning, index) => (
                <div key={index} className="p-3 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="font-medium text-red-900">{warning.materialName}</div>
                      <div className="text-sm text-red-800 grid grid-cols-2 md:grid-cols-3 gap-2">
                        <span>
                          Available: {formatNumber(warning.availableQuantity)} {warning.unit}
                        </span>
                        <span>
                          Required: {formatNumber(warning.requiredQuantity)} {warning.unit}
                        </span>
                        <span className="font-semibold">
                          Shortage: {formatNumber(warning.shortageQuantity)} {warning.unit}
                        </span>
                      </div>
                      <div className="flex gap-2 items-center">
                        {warning.type && (
                          <Badge variant="outline" className="text-xs bg-white">
                            {warning.type}
                          </Badge>
                        )}
                        {warning.action && <div className="text-xs text-red-700 italic">{warning.action}</div>}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              <div className="pt-3 border-t">
                <div className="text-sm text-gray-500 font-medium">Total items with negative stock: {negativeStockWarnings.length}</div>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => setShowNegativeStockDialog(false)} className="mt-4">
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Section Selection */}
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center  gap-2 text-lg">
                <Package className="h-5 w-5 text-primary" />
                <span>Section Selection</span>
              </div>
              <Button variant="outline" size="sm" onClick={() => navigate("/sales-history")} className="flex items-center gap-2 border-gray-300 hover:bg-gray-50">
                <History className="h-4 w-4" />
                <span>Sales History</span>
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 items-center">
              {sections.map(section => (
                <Button
                  key={section.id}
                  variant={selectedSectionId === section.id ? "default" : "outline"}
                  onClick={() => {
                    setSelectedSectionId(section.id);
                    setCart([]);
                    setSearchTerm("");
                  }}
                  className={`h-16 justify-center text-center transition-all ${selectedSectionId === section.id ? "shadow-md" : "hover:border-primary/50"}`}
                >
                  <span className="truncate">{section.name}</span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Available Items */}
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="text-lg">Available Items</span>
              {selectedSectionId && (
                <Badge variant="outline" className="text-xs bg-gray-50">
                  {filteredItems.length} {filteredItems.length === 1 ? "item" : "items"}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedSectionId ? (
              <>
                {/* Search */}
                <div className="relative mb-6">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-gray-400" />
                  </div>
                  <Input placeholder="Search items..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10 h-11 rounded-lg bg-gray-50 focus:bg-white" />
                </div>

                {/* Items Grid */}
                {filteredItems.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                    {filteredItems.map(item => {
                      const cartItem = cart.find(cartItem => cartItem.id === item.id);
                      const availableQuantity = item.type === "individual" ? (item.currentQuantity || 0) - (cartItem?.quantity || 0) : 999;
                      const isOutOfStock = item.type === "individual" && availableQuantity <= 0;
                      const isLowStock = item.type === "individual" && availableQuantity > 0 && availableQuantity <= 5;

                      return (
                        <div key={item.id} onClick={() => !isOutOfStock && addToCart(item)} className={`group relative bg-white border-2 rounded-xl p-5 transition-all duration-200 ${isOutOfStock ? "border-red-200 bg-red-50/30 opacity-75 cursor-not-allowed" : isLowStock ? "border-orange-200 hover:border-orange-300 cursor-pointer hover:shadow-lg" : "border-gray-200 hover:border-primary/40 hover:shadow-lg cursor-pointer"}`}>
                          {/* Stock Status Indicator */}
                          {isOutOfStock && <div className="absolute -top-2 -right-2 bg-red-500 text-white text-[0.60rem] font-bold px-2 py-1 rounded-full shadow-sm">Out of Stock</div>}
                          {isLowStock && <div className="absolute -top-2 -right-2 bg-orange-500 text-white text-[0.60rem] font-bold px-2 py-1 rounded-full shadow-sm">Low Stock</div>}

                          {/* Header */}
                          <div className="flex justify-between items-start gap-3 mb-4">
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-gray-900 text-2xl text-wrap leading-tight truncate group-hover:text-primary transition-colors">{item.name}</h3>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant={item.type === "individual" ? "default" : "secondary"} className={`text-[0.55rem] font-medium ${item.type === "individual" ? "bg-blue-100 text-blue-800 hover:bg-blue-200" : "bg-purple-100 text-purple-800 hover:bg-purple-200"}`}>
                                  {item.type === "individual" ? "Individual Item" : "Menu Item"}
                                </Badge>
                              </div>
                            </div>

                            <div className="text-right flex-shrink-0">
                              <div className="text-lg font-bold text-gray-900 group-hover:text-primary transition-colors">{formatCurrency(item.unitPrice)}</div>
                              {item.type === "individual" && (
                                <div className={`text-xs font-medium mt-1 ${isOutOfStock ? "text-red-600" : isLowStock ? "text-orange-600" : "text-gray-600"}`}>
                                  {formatNumber(availableQuantity)} {item.unit} left
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Menu Item Ingredients */}
                          {item.type === "menu" && item.ingredients && item.ingredients.length > 0 && (
                            <div className="mb-4 p-3 bg-gray-50 rounded-lg border">
                              <div className="flex items-center gap-2 mb-2">
                                <Package className="h-4 w-4 text-gray-500" />
                                <span className="text-sm font-medium text-gray-700">Ingredients</span>
                              </div>
                              <div className="grid grid-cols-1 gap-1.5 max-h-24 overflow-y-auto">
                                {item.ingredients.slice(0, 4).map((ing, idx) => {
                                  const material = materials.find(m => m.id === String(ing.materialId));
                                  return (
                                    <div key={idx} className="flex justify-between items-center text-sm">
                                      <span className="text-gray-700 truncate flex-1 mr-2">{material?.name || `Material ${ing.materialId}`}</span>
                                      <span className="text-gray-600 font-medium flex-shrink-0">
                                        {formatNumber(ing.quantity)} {ing.unit}
                                      </span>
                                    </div>
                                  );
                                })}
                                {item.ingredients.length > 4 && <div className="text-xs text-gray-500 italic text-center pt-1 border-t">+{item.ingredients.length - 4} more ingredients</div>}
                              </div>
                            </div>
                          )}

                          {/* Quick Add Indicator */}
                          {!isOutOfStock && <div className="absolute inset-0 rounded-xl bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none" />}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-16 text-gray-500">
                    <div className="bg-gray-100 rounded-full p-6 w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                      <PackageSearch className="h-12 w-12 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">{searchTerm ? "No matching items found" : "No items available"}</h3>
                    <p className="text-gray-500 mb-4">{searchTerm ? "Try adjusting your search terms" : "This section doesn't have any items yet"}</p>
                    {searchTerm && (
                      <Button variant="outline" size="sm" onClick={() => setSearchTerm("")} className="border-primary text-primary hover:bg-primary hover:text-white">
                        <X className="h-4 w-4 mr-2" />
                        Clear search
                      </Button>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <Package className="h-14 w-14 mx-auto mb-4 opacity-40" />
                <p className="font-medium">Please select a section to view available items</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Cart and Checkout */}
      <div className="h-[calc(100vh-2rem)] flex flex-col">
        <Card className="flex-1 shadow-sm hover:shadow-md transition-shadow flex flex-col overflow-hidden">
          <CardHeader className="pb-3 flex-shrink-0">
            <CardTitle className="flex items-center gap-2 text-lg">
              <ShoppingCart className="h-5 w-5 text-primary" />
              <span>Sale Summary</span>
            </CardTitle>
            {selectedSectionId && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Badge variant="secondary" className="text-xs bg-gray-100">
                  {getSectionName(selectedSectionId)}
                </Badge>
                <span>•</span>
                <span>
                  {cart.length} {cart.length === 1 ? "item" : "items"}
                </span>
              </div>
            )}
          </CardHeader>
          <CardContent className="flex-1 flex flex-col overflow-hidden">
            {cart.length > 0 ? (
              <>
                {/* Scrollable Cart Items */}
                <div className="flex-1 overflow-hidden">
                  <div className="border rounded-xl overflow-hidden h-full flex flex-col">
                    <Table>
                      <TableHeader className="bg-gray-50 flex-shrink-0">
                        <TableRow className="hover:bg-transparent">
                          <TableHead className="font-medium text-gray-700">Item</TableHead>
                          <TableHead className="font-medium text-gray-700">Qty</TableHead>
                          <TableHead className="text-right font-medium text-gray-700">Price</TableHead>
                          <TableHead className="w-[40px]"></TableHead>
                        </TableRow>
                      </TableHeader>
                    </Table>
                    <div className="flex-1 overflow-y-auto">
                      <Table>
                        <TableBody>
                          {cart.map(item => (
                            <TableRow key={item.id} className="hover:bg-gray-50/50 transition-colors">
                              <TableCell className="font-medium">
                                <div className="flex flex-col">
                                  <span className="text-gray-900">{item.name}</span>
                                  <span className="text-xs text-gray-500">
                                    {formatCurrency(item.unitPrice)}
                                    {item.unit && `/${item.unit}`}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1">
                                  <Button size="sm" variant="outline" className="h-7 w-7 p-0 hover:bg-destructive hover:text-white" onClick={() => updateCartItemQuantity(item.id, item.quantity - 1)} disabled={item.quantity <= 1}>
                                    <Minus className="h-3 w-3" />
                                  </Button>
                                  <span className="min-w-[2rem] text-center font-medium text-gray-700">{item.quantity}</span>
                                  <Button size="sm" variant="outline" className="h-7 w-7 p-0 hover:bg-primary hover:text-white" onClick={() => updateCartItemQuantity(item.id, item.quantity + 1)}>
                                    <Plus className="h-3 w-3" />
                                  </Button>
                                </div>
                              </TableCell>
                              <TableCell className="text-right font-medium text-gray-900">{formatCurrency(item.totalPrice)}</TableCell>
                              <TableCell className="text-right">
                                <Button size="sm" variant="ghost" onClick={() => removeFromCart(item.id)} className="h-7 w-7 p-0 hover:bg-destructive hover:text-white">
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </div>

                {/* Fixed Footer - Totals and Buttons */}
                <div className="flex-shrink-0 space-y-4 pt-4">
                  <div className="space-y-3 pt-4 border-t">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Subtotal</span>
                      <span className="font-medium text-gray-900">{formatCurrency(cartTotal)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold">
                      <span className="text-gray-900">Total</span>
                      <span className="text-primary">{formatCurrency(cartTotal)}</span>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      className="flex-1 h-11 border-gray-300 hover:bg-gray-50"
                      onClick={() => {
                        setCart([]);
                        setSearchTerm("");
                      }}
                      disabled={isLoading}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Clear Cart
                    </Button>
                    <Button className="flex-1 h-11" onClick={completeSale} disabled={isLoading || cart.length === 0}>
                      {isLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Check className="h-4 w-4 mr-2" />
                          Complete Sale
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-10 text-gray-500">
                <ShoppingCart className="h-14 w-14 mx-auto mb-4 opacity-40" />
                <p className="font-medium">Your cart is empty</p>
                <p className="text-sm mt-1">Add items to start a sale</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
