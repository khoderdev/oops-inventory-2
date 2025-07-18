import { posAPI } from "@/api/pos.api.ts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MaterialWithStock, MenuItemSale, SaleRecord, Section, SectionAssignment, SoldItem } from "@/types/inventory";
import { formatCurrency, formatNumber } from "@/utils/conversionLogic";
import { Check, Minus, Package, Plus, Search, Trash2, X, ShoppingCart, AlertCircle, Loader2 } from "lucide-react";
import { useMemo, useState, useCallback } from "react";

interface POSPanelProps {
  materials: MaterialWithStock[];
  sectionAssignments: SectionAssignment[];
}

export function POSPanel({ materials, sectionAssignments }: POSPanelProps) {
  const [selectedSectionId, setSelectedSectionId] = useState<string>("");
  const [cart, setCart] = useState<SoldItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [menuSearchTerm, setMenuSearchTerm] = useState("");
  const [saleType, setSaleType] = useState<"individual" | "menu">("individual");
  const [selectedMenuItems, setSelectedMenuItems] = useState<MenuItemSale[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  // Derive sections from assignments
  const sections = useMemo(() => {
    const sectionMap = new Map<string, Section>();
    sectionAssignments.forEach(assignment => {
      if (assignment.section && !sectionMap.has(assignment.section.id)) {
        sectionMap.set(assignment.section.id, assignment.section);
      }
    });
    return Array.from(sectionMap.values());
  }, [sectionAssignments]);

  // Derive menu items from assignments
  const menuItems = useMemo(() => {
    console.log('Section assignments for menu items:', sectionAssignments);
    
    const menuItemAssignments = sectionAssignments.filter(a => {
      // Check if it's a menu item assignment by looking for menuItem data
      const hasMenuItem = a.menuItem && a.menuItemId;
      const isMenuItemType = a.itemType === "menuItem";
      
      console.log(`Assignment ${a.id}: itemType=${a.itemType}, hasMenuItem=${hasMenuItem}, menuItemId=${a.menuItemId}`);
      
      // Accept if either itemType is "menuItem" OR if it has menuItem data
      return (isMenuItemType || hasMenuItem) && a.menuItem;
    });
    
    console.log('Filtered menu item assignments:', menuItemAssignments);
    
    const items = menuItemAssignments
      .map(a => a.menuItem!)
      .filter((item, index, self) => self.findIndex(i => i.id === item.id) === index); // Remove duplicates
    
    console.log('Final menu items:', items);
    return items;
  }, [sectionAssignments]);

  // Get available items for the selected section
  const availableItems = useMemo(() => {
    if (!selectedSectionId) return [];

    // Filter assignments for this section
    const sectionAssignmentsForSection = sectionAssignments.filter(a => a.sectionId.toString() === selectedSectionId);

    const stockEntryAssignments = sectionAssignmentsForSection.filter(a => {
      const hasStockEntry = a.itemType === "stockEntry" || (a.stockEntry && !a.menuItem);
      return hasStockEntry;
    });

    const items = stockEntryAssignments.map(a => {
      // Find material and stock entry from materials with stock
      const material = materials.find(m => m.id === String(a.materialId));
      const stockEntry = material?.stockEntries.find(se => se.id === a.stockEntryId);

      // Check if this is a package unit (box/pack) that needs conversion
      const isPackageUnit = material?.unitType === "package" && (a.assignedUnit === "box" || a.assignedUnit === "pack" || a.assignedUnit === "case");

      let displayQuantity = a.assignedQuantity;
      let displayUnit = a.assignedUnit;
      let displayUnitPrice = material?.costPerBaseUnit || 0;

      if (isPackageUnit && material?.packageQuantity) {
        displayQuantity = a.assignedQuantity * material.packageQuantity;
        displayUnit = material.baseUnit;
        displayUnitPrice = material.costPerBaseUnit || 0;
      }

      return {
        assignmentId: a.id.toString(),
        materialId: material?.id.toString() || "",
        sectionId: a.sectionId.toString(),
        materialName: material?.name || "Unknown",
        currentQuantity: displayQuantity,
        unit: displayUnit,
        unitPrice: displayUnitPrice,
        isPackageConverted: isPackageUnit
      };
    });

    const availableItems = items.filter(item => item.currentQuantity > 0);
    return availableItems;
  }, [selectedSectionId, sectionAssignments, materials]);

  // Filter available items based on search term
  const filteredItems = useMemo(() => {
    return availableItems.filter(item => item.materialName.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [availableItems, searchTerm]);

  // Filter menu items based on search term
  const filteredMenuItems = useMemo(() => {
    return menuItems.filter(item => 
      item.name.toLowerCase().includes(menuSearchTerm.toLowerCase()) ||
      item.category?.toLowerCase().includes(menuSearchTerm.toLowerCase())
    );
  }, [menuItems, menuSearchTerm]);

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
      const existingItem = prevCart.find(cartItem => cartItem.assignmentId === item.assignmentId);

      if (existingItem) {
        return prevCart.map(cartItem =>
          cartItem.assignmentId === item.assignmentId
            ? {
                ...cartItem,
                quantity: Math.min(cartItem.quantity + 1, item.currentQuantity),
                totalPrice: cartItem.unitPrice * Math.min(cartItem.quantity + 1, item.currentQuantity)
              }
            : cartItem
        );
      } else {
        return [
          ...prevCart,
          {
            assignmentId: item.assignmentId,
            materialId: item.materialId,
            sectionId: item.sectionId,
            materialName: item.materialName,
            unit: item.unit,
            quantity: 1,
            unitPrice: item.unitPrice,
            totalPrice: item.unitPrice
          }
        ];
      }
    });
  }, []);

  // Remove item from cart
  const removeFromCart = useCallback((assignmentId: string) => {
    setCart(prevCart => prevCart.filter(item => item.assignmentId !== assignmentId));
  }, []);

  // Update item quantity in cart
  const updateCartItemQuantity = useCallback((assignmentId: string, newQuantity: number) => {
    const item = availableItems.find(i => i.assignmentId === assignmentId);
    if (!item) return;

    const clampedQuantity = Math.min(Math.max(newQuantity, 1), item.currentQuantity);

    setCart(prevCart =>
      prevCart.map(cartItem =>
        cartItem.assignmentId === assignmentId
          ? {
              ...cartItem,
              quantity: clampedQuantity,
              totalPrice: cartItem.unitPrice * clampedQuantity
            }
          : cartItem
      )
    );
  }, [availableItems]);

  // Complete sale
  const completeSale = useCallback(async () => {
    if ((saleType === "individual" && cart.length === 0) || (saleType === "menu" && selectedMenuItems.length === 0)) {
      setError("Please add items to complete the sale");
      clearMessages();
      return;
    }

    if (!selectedSectionId && saleType === "individual") {
      setError("Please select a section");
      clearMessages();
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      // Create sale record
      const saleRecord: Omit<SaleRecord, "id"> = {
        saleDate: new Date(),
        items: saleType === "individual" ? cart : [],
        menuItems: saleType === "menu" ? selectedMenuItems : [],
        totalAmount: saleType === "individual" ? cartTotal : selectedMenuItems.reduce((sum, item) => sum + item.totalPrice, 0),
        sectionId: selectedSectionId,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Save sale to API
      const createdSale = await posAPI.createSale(saleRecord);
      console.log("Sale completed:", createdSale.data);

      // Reset form
      setCart([]);
      setSelectedMenuItems([]);
      setSearchTerm("");
      setMenuSearchTerm("");
      
      setSuccessMessage(`Sale completed successfully! Total: ${formatCurrency(saleRecord.totalAmount)}`);
      clearMessages();
    } catch (error) {
      console.error("Failed to complete sale:", error);
      setError(error instanceof Error ? error.message : "Failed to complete sale. Please try again.");
      clearMessages();
    } finally {
      setIsLoading(false);
    }
  }, [cart, selectedMenuItems, saleType, selectedSectionId, cartTotal, clearMessages]);

  const getSectionName = (sectionId: string) => {
    const section = sections.find(s => s.id.toString() === sectionId);
    return section?.name || "Unknown";
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Point of Sale</h1>
          <p className="text-muted-foreground">Process sales and manage orders</p>
        </div>
        <div className="flex items-center gap-2">
          <ShoppingCart className="h-5 w-5 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {saleType === "individual" ? `${cart.length} items` : `${selectedMenuItems.length} items`}
          </span>
        </div>
      </div>

      {/* Error and Success Messages */}
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

      <Tabs value={saleType} onValueChange={(value) => setSaleType(value as "individual" | "menu")} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="individual" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Individual Items
          </TabsTrigger>
          <TabsTrigger value="menu" className="flex items-center gap-2">
            <ShoppingCart className="h-4 w-4" />
            Menu Items
          </TabsTrigger>
        </TabsList>

        <TabsContent value="individual" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Select Section & Items</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-foreground">Section</label>
                  <select 
                    value={selectedSectionId} 
                    onChange={e => setSelectedSectionId(e.target.value)} 
                    className="w-full px-3 py-2 border border-input bg-background rounded-md focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
                  >
                    <option value="">Select a section</option>
                    {sections.map(section => (
                      <option key={section.id} value={section.id.toString()}>
                        {section.name}
                      </option>
                    ))}
                  </select>
                  {selectedSectionId && (
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="secondary" className="text-xs">
                        {getSectionName(selectedSectionId)}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {filteredItems.length} items available
                      </span>
                    </div>
                  )}
                </div>

                {selectedSectionId && (
                  <>
                    <div className="relative">
                      <Input 
                        placeholder="Search items..." 
                        value={searchTerm} 
                        onChange={e => setSearchTerm(e.target.value)} 
                        className="pl-9 focus:ring-2 focus:ring-primary focus:border-transparent transition-colors" 
                      />
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                      {searchTerm && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                          onClick={() => setSearchTerm("")}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      )}
                    </div>

                    <div className="border rounded-md overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Item</TableHead>
                            <TableHead>Available</TableHead>
                            <TableHead>Price/Unit</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredItems.length > 0 ? (
                            filteredItems.map(item => {
                              const assignment = sectionAssignments.find(a => a.id.toString() === item.assignmentId);
                              const material = materials.find(m => m.id === item.materialId);
                              const isPackage = material?.unitType === "package";
                              
                              return (
                                <TableRow key={item.assignmentId} className="hover:bg-muted/50 transition-colors">
                                  <TableCell className="font-medium">
                                    <div className="flex items-center gap-2">
                                      <span>{item.materialName}</span>
                                      {isPackage && (
                                        <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700 border-orange-200">
                                          Package
                                        </Badge>
                                      )}
                                    </div>
                                  </TableCell>
                                <TableCell>
                                  {(() => {
                                    // Find the assignment and material for this item
                                    const assignment = sectionAssignments.find(a => a.id.toString() === item.assignmentId);
                                    const material = materials.find(m => m.id === item.materialId);

                                    if (material?.unitType === "package" && material.packageQuantity && material.packageQuantity > 0 && assignment) {
                                      // Use assignedIndividualQuantity if available, otherwise calculate
                                      const assignedQty = assignment.assignedQuantity || 0;
                                      const assignedUnit = assignment.assignedUnit || "";
                                      const convertedQty = assignment.assignedIndividualQuantity || assignedQty * material.packageQuantity;

                                      return (
                                        <div className="text-sm">
                                          <div>
                                            {formatNumber(assignedQty)} {assignedUnit}
                                          </div>
                                          <div className="text-xs text-muted-foreground">
                                            ({formatNumber(convertedQty)} {material.baseUnit})
                                          </div>
                                        </div>
                                      );
                                    }

                                    return (
                                      <div className="text-sm">
                                        {formatNumber(item.currentQuantity)} {item.unit}
                                      </div>
                                    );
                                  })()}
                                </TableCell>
                                  <TableCell>
                                    <div className="text-sm font-medium text-green-600">
                                      {formatCurrency(item.unitPrice)}
                                      <span className="text-xs text-muted-foreground">/{item.unit}</span>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <Button 
                                      size="sm" 
                                      variant="outline" 
                                      onClick={() => addToCart(item)} 
                                      disabled={item.currentQuantity <= 0}
                                      className="hover:bg-primary hover:text-primary-foreground transition-colors"
                                    >
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
                    <div className="border rounded-md overflow-hidden">
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
                            <TableRow key={item.assignmentId} className="hover:bg-muted/50 transition-colors">
                              <TableCell className="font-medium">
                                <div className="flex flex-col">
                                  <span>{item.materialName}</span>
                                  <span className="text-xs text-muted-foreground">
                                    {formatCurrency(item.unitPrice)}/{item.unit}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1">
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    className="h-7 w-7 p-0 hover:bg-destructive hover:text-destructive-foreground" 
                                    onClick={() => updateCartItemQuantity(item.assignmentId, item.quantity - 1)} 
                                    disabled={item.quantity <= 1}
                                  >
                                    <Minus className="h-3 w-3" />
                                  </Button>
                                  <span className="min-w-[2rem] text-center font-medium">{item.quantity}</span>
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    className="h-7 w-7 p-0 hover:bg-primary hover:text-primary-foreground" 
                                    onClick={() => updateCartItemQuantity(item.assignmentId, item.quantity + 1)} 
                                    disabled={item.quantity >= (availableItems.find(i => i.assignmentId === item.assignmentId)?.currentQuantity || 0)}
                                  >
                                    <Plus className="h-3 w-3" />
                                  </Button>
                                </div>
                              </TableCell>
                              <TableCell className="text-right font-medium">{formatCurrency(item.totalPrice)}</TableCell>
                              <TableCell className="text-right">
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  onClick={() => removeFromCart(item.assignmentId)}
                                  className="h-7 w-7 p-0 hover:bg-destructive hover:text-destructive-foreground"
                                >
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
                      <Button 
                        className="flex-1" 
                        onClick={completeSale} 
                        disabled={cart.length === 0 || isLoading || !selectedSectionId}
                      >
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
                    <Package className="h-8 w-8 mx-auto mb-2" />
                    <p>Your cart is empty</p>
                    <p className="text-sm">Add items from the section inventory</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          </div>
        </TabsContent>

        <TabsContent value="menu" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Menu Items Selection */}
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Menu Items</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative mb-4">
                  <Input 
                    placeholder="Search menu items..." 
                    value={menuSearchTerm}
                    onChange={e => setMenuSearchTerm(e.target.value)}
                    className="pl-9 focus:ring-2 focus:ring-primary focus:border-transparent transition-colors" 
                  />
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  {menuSearchTerm && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                      onClick={() => setMenuSearchTerm("")}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>
                <div className="mb-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>{filteredMenuItems.length} menu items available</span>
                  </div>
                </div>
                <div className="border rounded-md overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Ingredients</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredMenuItems.length > 0 ? (
                        filteredMenuItems.map(item => (
                          <TableRow key={item.id} className="hover:bg-muted/50 transition-colors">
                            <TableCell className="font-medium">
                              <div className="flex flex-col">
                                <span>{item.name}</span>
                                {item.category && (
                                  <Badge variant="secondary" className="text-xs w-fit mt-1">
                                    {item.category}
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm font-medium text-green-600">
                                {formatCurrency(item.price)}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm text-muted-foreground">
                                {item.ingredients && item.ingredients.length > 0 ? (
                                  item.ingredients.map((ing, idx) => (
                                    <div key={idx}>
                                      {formatNumber(ing.quantity)} {ing.unit} {materials.find(m => m.id === String(ing.materialId))?.name}
                                    </div>
                                  ))
                                ) : (
                                  <span className="text-xs text-muted-foreground">No ingredients</span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  const menuItemSale: MenuItemSale = {
                                    menuItemId: item.id,
                                    quantity: 1,
                                    unitPrice: item.price,
                                    totalPrice: item.price,
                                    ingredients: item.ingredients ? item.ingredients.map(ing => ({
                                      materialId: ing.materialId,
                                      quantity: ing.quantity,
                                      unit: ing.unit
                                    })) : [],
                                    createdAt: undefined,
                                    updatedAt: undefined
                                  };
                                  setSelectedMenuItems([...selectedMenuItems, menuItemSale]);
                                }}
                                className="hover:bg-primary hover:text-primary-foreground transition-colors"
                              >
                                <Plus className="h-4 w-4" />
                                <span className="sr-only">Add to order</span>
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-8">
                            <div className="text-muted-foreground">
                              {menuSearchTerm ? "No matching menu items found" : "No menu items available"}
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Selected Menu Items */}
          <div>
            <Card className="h-fit">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  Selected Menu Items
                </CardTitle>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>{selectedMenuItems.length} items selected</span>
                </div>
              </CardHeader>
              <CardContent>
                {selectedMenuItems.length > 0 ? (
                  <>
                    <div className="border rounded-md overflow-hidden mb-4">
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
                          {selectedMenuItems.map((item, index) => {
                            const menuItem = menuItems.find(m => m.id === item.menuItemId);
                            return (
                              <TableRow key={index}>
                                <TableCell className="font-medium">{menuItem?.name}</TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="h-6 w-6 p-0"
                                      onClick={() => {
                                        const updated = [...selectedMenuItems];
                                        updated[index].quantity = Math.max(1, updated[index].quantity - 1);
                                        updated[index].totalPrice = updated[index].quantity * updated[index].unitPrice;
                                        setSelectedMenuItems(updated);
                                      }}
                                    >
                                      <Minus className="h-3 w-3" />
                                    </Button>
                                    <span>{item.quantity}</span>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="h-6 w-6 p-0"
                                      onClick={() => {
                                        const updated = [...selectedMenuItems];
                                        updated[index].quantity += 1;
                                        updated[index].totalPrice = updated[index].quantity * updated[index].unitPrice;
                                        setSelectedMenuItems(updated);
                                      }}
                                    >
                                      <Plus className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </TableCell>
                                <TableCell className="text-right">{formatCurrency(item.totalPrice)}</TableCell>
                                <TableCell className="text-right">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => {
                                      setSelectedMenuItems(selectedMenuItems.filter((_, i) => i !== index));
                                    }}
                                  >
                                    <Trash2 className="h-4 w-4 text-red-500" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>

                    <div className="space-y-3 pt-4 border-t mb-4">
                      <div className="flex justify-between text-lg font-bold">
                        <span>Total</span>
                        <span className="text-primary">{formatCurrency(selectedMenuItems.reduce((sum, item) => sum + item.totalPrice, 0))}</span>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-4">
                      <Button 
                        variant="outline" 
                        className="flex-1" 
                        onClick={() => {
                          setSelectedMenuItems([]);
                          setMenuSearchTerm("");
                        }}
                        disabled={isLoading}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Clear All
                      </Button>
                      <Button 
                        className="flex-1" 
                        onClick={completeSale} 
                        disabled={selectedMenuItems.length === 0 || isLoading}
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <Check className="h-4 w-4 mr-2" />
                            Complete Order
                          </>
                        )}
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Package className="h-8 w-8 mx-auto mb-2" />
                    <p>No menu items selected</p>
                    <p className="text-sm">Add items from the menu</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
