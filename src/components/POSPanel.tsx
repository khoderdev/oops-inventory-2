import { menuAPI } from "@/api/menu.api.ts.tsx";
import { posAPI } from "@/api/pos.api.ts";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CartItem, MenuItem, MenuItemSale, POSPanelProps, Section, SectionAssignment, SoldItem, NegativeStockWarning } from "@/types/inventory";
import { formatCurrency, formatNumber } from "@/utils/conversionLogic";
import { AlertCircle, Check, Loader2, Minus, Package, Plus, Search, ShoppingCart, Trash2, X, AlertTriangle } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export function POSPanel({ materials, sectionAssignments }: POSPanelProps) {
  const [selectedSectionId, setSelectedSectionId] = useState<string>("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [, setMenuItems] = useState<MenuItem[]>([]);
  const [optimisticAssignments, setOptimisticAssignments] = useState<SectionAssignment[]>(sectionAssignments);
  const [, setIsRefreshing] = useState(false);
  const [negativeStockWarnings, setNegativeStockWarnings] = useState<NegativeStockWarning[]>([]);
  const [showNegativeStockDialog, setShowNegativeStockDialog] = useState(false);

  const errorTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const successTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Enhanced message handling with auto-clear
  const showError = useCallback((message: string) => {
    setError(message);
    if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
    errorTimeoutRef.current = setTimeout(() => setError(null), 5000);
  }, []);

  const showSuccess = useCallback((message: string) => {
    setSuccessMessage(message);
    if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current);
    successTimeoutRef.current = setTimeout(() => setSuccessMessage(null), 3000);
  }, []);

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
      if (assignment.section && !sectionMap.has(assignment.section.id)) {
        sectionMap.set(assignment.section.id, assignment.section);
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
        const displayUnitPrice = parseFloat(String(material.costPerBaseUnit || "0"));

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
    return cart.reduce((total, item) => total + item.totalPrice, 0);
  }, [cart]);

  // Clear messages after timeout
  const clearMessages = useCallback(() => {
    setTimeout(() => {
      setError(null);
      setSuccessMessage(null);
    }, 5000);
  }, []);

  // Add item to cart
  const addToCart = useCallback((item: (typeof availableItems)[0]) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(cartItem => cartItem.id === item.id);

      if (existingItem) {
        const maxQuantity = item.type === "individual" ? item.currentQuantity || 1 : 999;
        return prevCart.map(cartItem =>
          cartItem.id === item.id
            ? {
                ...cartItem,
                quantity: Math.min(cartItem.quantity + 1, maxQuantity),
                totalPrice: cartItem.unitPrice * Math.min(cartItem.quantity + 1, maxQuantity)
              }
            : cartItem
        );
      } else {
        return [
          ...prevCart,
          {
            id: item.id,
            type: item.type,
            name: item.name,
            quantity: 1,
            unitPrice: item.unitPrice,
            totalPrice: item.unitPrice,
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
        prevCart.map(cartItem =>
          cartItem.id === itemId
            ? {
                ...cartItem,
                quantity: clampedQuantity,
                totalPrice: cartItem.unitPrice * clampedQuantity
              }
            : cartItem
        )
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
        showSuccess(`Sale completed successfully! Total: ${formatCurrency(cartTotal)}`);

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
    } catch (error: any) {
      console.error("Sale failed:", error);
      showError(error.response?.data?.error || "Failed to complete sale");
    } finally {
      setIsLoading(false);
    }
  }, [cart, cartTotal, selectedSectionId, availableItems, materials, sectionAssignments, updateInventoryOptimistically, revertOptimisticUpdates, showError, showSuccess]);

  // Refresh data function
  const refreshData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      // Reset optimistic state to actual props
      setOptimisticAssignments(sectionAssignments);

      // Refetch menu items
      const response = await menuAPI.getMenus();
      setMenuItems(response.data);

      showSuccess("Data refreshed successfully");
    } catch (error) {
      console.error("Failed to refresh data:", error);
      showError("Failed to refresh data");
    } finally {
      setIsRefreshing(false);
    }
  }, [sectionAssignments, showError, showSuccess]);

  const getSectionName = (sectionId: string) => {
    const section = sections.find(s => s.id.toString() === sectionId);
    return section?.name || "Unknown Section";
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Section Selection and Items */}
      <div className="lg:col-span-2 space-y-4">
        {/* Messages */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {successMessage && (
          <Alert className="border-green-200 bg-green-50 text-green-800">
            <Check className="h-4 w-4" />
            <AlertDescription>{successMessage}</AlertDescription>
          </Alert>
        )}

        {/* Negative Stock Warnings Dialog */}
        <Dialog open={showNegativeStockDialog} onOpenChange={setShowNegativeStockDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="h-5 w-5" />
                Negative Stock Warning
              </DialogTitle>
              <DialogDescription>The following items resulted in negative stock after this sale. The sale was completed, but these items may need restocking.</DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              {negativeStockWarnings.map((warning, index) => (
                <div key={index} className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 space-y-1">
                      <div className="font-medium text-red-900">{warning.materialName}</div>
                      <div className="text-sm text-red-800">
                        Available: {formatNumber(warning.availableQuantity)} {warning.unit} | Required: {formatNumber(warning.requiredQuantity)} {warning.unit} | Shortage: {formatNumber(warning.shortageQuantity)} {warning.unit}
                      </div>
                      {warning.type && (
                        <Badge variant="outline" className="text-xs">
                          {warning.type}
                        </Badge>
                      )}
                      {warning.action && <div className="text-xs text-red-700 italic">{warning.action}</div>}
                    </div>
                  </div>
                </div>
              ))}
              <div className="pt-2 border-t">
                <div className="text-sm text-muted-foreground">Total items with negative stock: {negativeStockWarnings.length}</div>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Section Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Section Selection
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {sections.map(section => (
                <Button
                  key={section.id}
                  variant={selectedSectionId === section.id ? "default" : "outline"}
                  onClick={() => {
                    setSelectedSectionId(section.id);
                    setCart([]);
                    setSearchTerm("");
                  }}
                  className="text-left justify-start"
                >
                  {section.name}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Available Items */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Available Items</span>
              {selectedSectionId && (
                <Badge variant="outline" className="text-xs">
                  {filteredItems.length} items
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedSectionId ? (
              <>
                {/* Search */}
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input placeholder="Search items..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" />
                </div>

                {/* Items Table */}
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Available/Price</TableHead>
                        <TableHead className="w-[100px]">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredItems.length > 0 ? (
                        filteredItems.map(item => {
                          const cartItem = cart.find(cartItem => cartItem.id === item.id);
                          const availableQuantity = item.type === "individual" ? (item.currentQuantity || 0) - (cartItem?.quantity || 0) : 999;

                          return (
                            <TableRow key={item.id}>
                              <TableCell>
                                <div className="flex flex-col">
                                  <span className="font-medium">{item.name}</span>
                                  {item.type === "menu" && item.ingredients && item.ingredients.length > 0 && (
                                    <div className="text-xs text-muted-foreground mt-1">
                                      <span className="font-medium">Ingredients:</span>
                                      {item.ingredients.map((ing, idx) => (
                                        <div key={idx}>
                                          {formatNumber(ing.quantity)} {ing.unit} {materials.find(m => m.id === String(ing.materialId))?.name}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant={item.type === "individual" ? "default" : "secondary"}>{item.type === "individual" ? "Individual" : "Menu Item"}</Badge>
                              </TableCell>
                              <TableCell>
                                {item.type === "individual" ? (
                                  <div className="flex flex-col">
                                    <span className={availableQuantity <= 0 ? "text-red-500" : ""}>
                                      {formatNumber(availableQuantity)} {item.unit}
                                    </span>
                                    <span className="text-sm text-muted-foreground">
                                      {formatCurrency(item.unitPrice)}/{item.unit}
                                    </span>
                                  </div>
                                ) : (
                                  <span className="font-medium">{formatCurrency(item.unitPrice)}</span>
                                )}
                              </TableCell>
                              <TableCell>
                                <Button size="sm" variant="outline" onClick={() => addToCart(item)} disabled={item.type === "individual" && (item.currentQuantity || 0) <= 0} className="hover:bg-primary hover:text-primary-foreground transition-colors">
                                  <Plus className="h-4 w-4" />
                                  <span className="sr-only">Add to cart</span>
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      ) : (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-4">
                            {searchTerm ? "No matching items found" : "No items available in this section"}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Please select a section to view available items</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Cart and Checkout */}
      <div className="space-y-4">
        <Card className="h-fit">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Order Summary
            </CardTitle>
            {selectedSectionId && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Badge variant="secondary" className="text-xs">
                  {getSectionName(selectedSectionId)}
                </Badge>
                <span>•</span>
                <span>{cart.length} items</span>
              </div>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {cart.length > 0 ? (
              <>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item</TableHead>
                        <TableHead>Qty</TableHead>
                        <TableHead className="text-right">Price</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cart.map(item => (
                        <TableRow key={item.id} className="hover:bg-muted/50 transition-colors">
                          <TableCell className="font-medium">
                            <div className="flex flex-col">
                              <span>{item.name}</span>
                              <span className="text-xs text-muted-foreground">
                                {formatCurrency(item.unitPrice)}
                                {item.unit && `/${item.unit}`}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button size="sm" variant="outline" className="h-7 w-7 p-0 hover:bg-destructive hover:text-destructive-foreground" onClick={() => updateCartItemQuantity(item.id, item.quantity - 1)} disabled={item.quantity <= 1}>
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="min-w-[2rem] text-center font-medium">{item.quantity}</span>
                              <Button size="sm" variant="outline" className="h-7 w-7 p-0 hover:bg-primary hover:text-primary-foreground" onClick={() => updateCartItemQuantity(item.id, item.quantity + 1)}>
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-medium">{formatCurrency(item.totalPrice)}</TableCell>
                          <TableCell className="text-right">
                            <Button size="sm" variant="ghost" onClick={() => removeFromCart(item.id)} className="h-7 w-7 p-0 hover:bg-destructive hover:text-destructive-foreground">
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <div className="space-y-3 pt-4 border-t">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium">{formatCurrency(cartTotal)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span className="text-primary">{formatCurrency(cartTotal)}</span>
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setCart([]);
                      setSearchTerm("");
                    }}
                    disabled={isLoading}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Clear Cart
                  </Button>
                  <Button className="flex-1" onClick={completeSale} disabled={isLoading || cart.length === 0}>
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
              </>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Your cart is empty</p>
                <p className="text-sm">Add items to start a sale</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
