import { salesAPI } from "@/api/sales.api.ts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MaterialWithStock, MenuItemSale, SaleRecord, Section, SectionAssignment, SoldItem } from "@/types/inventory";
import { formatCurrency, formatNumber } from "@/utils/conversionLogic";
import { Tabs, TabsList, TabsTrigger } from "@radix-ui/react-tabs";
import { Check, Minus, Package, Plus, Search, Trash2, X } from "lucide-react";
import { useMemo, useState } from "react";

interface POSPanelProps {
  materials: MaterialWithStock[];
  sectionAssignments: SectionAssignment[];
}

export function POSPanel({ materials, sectionAssignments }: POSPanelProps) {
  const [selectedSectionId, setSelectedSectionId] = useState<string>("");
  const [cart, setCart] = useState<SoldItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [saleType, setSaleType] = useState<"individual" | "menu">("individual");
  const [selectedMenuItems, setSelectedMenuItems] = useState<MenuItemSale[]>([]);
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
    return sectionAssignments
      .filter(a => a.itemType === "menuItem" && a.menuItem)
      .map(a => a.menuItem!)
      .filter((item, index, self) => self.findIndex(i => i.id === item.id) === index); // Remove duplicates
  }, [sectionAssignments]);

  // Get available items for the selected section
  const availableItems = useMemo(() => {
    if (!selectedSectionId) return [];

    console.log("=== SELECTED SECTION DATA ===");
    console.log("Selected Section ID:", selectedSectionId);

    // Find the selected section
    const selectedSection = sections.find(s => s.id.toString() === selectedSectionId);
    console.log("Selected Section Object:", selectedSection);

    // Filter assignments for this section
    const sectionAssignmentsForSection = sectionAssignments.filter(a => a.sectionId.toString() === selectedSectionId);
    console.log("All assignments for section:", sectionAssignmentsForSection);

    // Filter stock entry assignments
    // Handle cases where itemType might be missing - infer from presence of stockEntry
    const stockEntryAssignments = sectionAssignmentsForSection.filter(a => {
      const hasStockEntry = a.itemType === "stockEntry" || (a.stockEntry && !a.menuItem);
      console.log(`Assignment ${a.id} - itemType: ${a.itemType}, hasStockEntry: ${!!a.stockEntry}, hasMenuItems: ${!!a.menuItem}, filtered: ${hasStockEntry}`);
      return hasStockEntry;
    });
    console.log("Stock entry assignments:", stockEntryAssignments);

    const items = stockEntryAssignments.map(a => {
      // Find material and stock entry from materials with stock
      const material = materials.find(m => m.id === String(a.materialId));
      const stockEntry = material?.stockEntries.find(se => se.id === a.stockEntryId);

      console.log(`Assignment ${a.id}:`, {
        assignment: a,
        foundMaterial: material,
        foundStockEntry: stockEntry
      });

      // Check if this is a package unit (box/pack) that needs conversion
      const isPackageUnit = material?.unitType === "package" && (a.assignedUnit === "box" || a.assignedUnit === "pack" || a.assignedUnit === "case");

      let displayQuantity = a.assignedQuantity;
      let displayUnit = a.assignedUnit;
      let displayUnitPrice = material?.costPerBaseUnit || 0;

      if (isPackageUnit && material?.packageQuantity) {
        // Convert package units to base units
        displayQuantity = a.assignedQuantity * material.packageQuantity;
        displayUnit = material.baseUnit;
        displayUnitPrice = material.costPerBaseUnit || 0;

        console.log(`Package conversion for ${material.name}:`, {
          originalQuantity: a.assignedQuantity,
          originalUnit: a.assignedUnit,
          packageQuantity: material.packageQuantity,
          convertedQuantity: displayQuantity,
          convertedUnit: displayUnit,
          unitPrice: displayUnitPrice
        });
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
    console.log("Available items (quantity > 0):", availableItems);
    console.log("=== END SECTION DATA ===");

    return availableItems;
  }, [selectedSectionId, sectionAssignments, materials, sections]);

  // Filter available items based on search term
  const filteredItems = useMemo(() => {
    return availableItems.filter(item => item.materialName.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [availableItems, searchTerm]);

  // Calculate cart total
  const cartTotal = useMemo(() => {
    return cart.reduce((total, item) => total + item.totalPrice, 0);
  }, [cart]);

  // Add item to cart
  const addToCart = (item: (typeof availableItems)[0]) => {
    console.log("Adding item to cart:", item);
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
  };

  // Remove item from cart
  const removeFromCart = (assignmentId: string) => {
    setCart(prevCart => prevCart.filter(item => item.assignmentId !== assignmentId));
  };

  // Update item quantity in cart
  const updateCartItemQuantity = (assignmentId: string, newQuantity: number) => {
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
  };

  // Complete sale
  const completeSale = async () => {
    try {
      // Create sale record
      const saleRecord: Omit<SaleRecord, "id"> = {
        saleDate: new Date(),
        items: cart,
        menuItems: selectedMenuItems,
        totalAmount: saleType === "individual" ? cartTotal : selectedMenuItems.reduce((sum, item) => sum + item.totalPrice, 0),
        sectionId: selectedSectionId,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Save sale to API
      const createdSale = await salesAPI.createSale(saleRecord);
      console.log("Sale completed:", createdSale.data);

      // Reset form
      setCart([]);
      setSelectedMenuItems([]);
    } catch (error) {
      console.error("Failed to complete sale:", error);
      // You might want to add error handling UI here
    }
  };

  const getSectionName = (sectionId: string) => {
    const section = sections.find(s => s.id.toString() === sectionId);
    console.log(`Getting section name for ID ${sectionId}:`, section);
    return section?.name || "Unknown";
  };

  return (
    <div className="p-6 space-y-6">
      <Tabs defaultValue="individual" className="mb-6">
        <TabsList>
          <TabsTrigger value="individual" onClick={() => setSaleType("individual")}>
            Individual Items
          </TabsTrigger>
          <TabsTrigger value="menu" onClick={() => setSaleType("menu")}>
            Menu Items
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {saleType === "individual" ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Section Selection and Items */}
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Select Section & Items</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Section</label>
                  <select value={selectedSectionId} onChange={e => setSelectedSectionId(e.target.value)} className="w-full px-3 py-2 border border-input bg-background rounded-md">
                    <option value="">Select a section</option>
                    {sections.map(section => (
                      <option key={section.id} value={section.id.toString()}>
                        {section.name}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedSectionId && (
                  <>
                    <div className="relative">
                      <Input placeholder="Search items..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-9" />
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
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
                            filteredItems.map(item => (
                              <TableRow key={item.assignmentId}>
                                <TableCell className="font-medium">{item.materialName}</TableCell>
                                <TableCell>
                                  {formatNumber(item.currentQuantity)} {item.unit}
                                </TableCell>
                                <TableCell>
                                  {formatCurrency(item.unitPrice)}/{item.unit}
                                </TableCell>
                                <TableCell>
                                  <Button size="sm" variant="outline" onClick={() => addToCart(item)} disabled={item.currentQuantity <= 0}>
                                    <Plus className="h-4 w-4" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))
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
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedSectionId && <div className="text-sm text-muted-foreground">Section: {getSectionName(selectedSectionId)}</div>}

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
                            <TableRow key={item.assignmentId}>
                              <TableCell className="font-medium">{item.materialName}</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Button size="sm" variant="outline" className="h-6 w-6 p-0" onClick={() => updateCartItemQuantity(item.assignmentId, item.quantity - 1)} disabled={item.quantity <= 1}>
                                    <Minus className="h-3 w-3" />
                                  </Button>
                                  <span>{item.quantity}</span>
                                  <Button size="sm" variant="outline" className="h-6 w-6 p-0" onClick={() => updateCartItemQuantity(item.assignmentId, item.quantity + 1)} disabled={item.quantity >= (availableItems.find(i => i.assignmentId === item.assignmentId)?.currentQuantity || 0)}>
                                    <Plus className="h-3 w-3" />
                                  </Button>
                                </div>
                              </TableCell>
                              <TableCell className="text-right">{formatCurrency(item.totalPrice)}</TableCell>
                              <TableCell className="text-right">
                                <Button size="sm" variant="ghost" onClick={() => removeFromCart(item.assignmentId)}>
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between font-medium">
                        <span>Subtotal</span>
                        <span>{formatCurrency(cartTotal)}</span>
                      </div>
                      <div className="flex justify-between text-lg font-bold">
                        <span>Total</span>
                        <span>{formatCurrency(cartTotal)}</span>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button variant="outline" className="flex-1" onClick={() => setCart([])}>
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                      </Button>
                      <Button className="flex-1" onClick={completeSale} disabled={cart.length === 0}>
                        <Check className="h-4 w-4 mr-2" />
                        Complete Sale
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
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Menu Items Selection */}
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Menu Items</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative mb-4">
                  <Input placeholder="Search menu items..." className="pl-9" />
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
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
                      {menuItems.map(item => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.name}</TableCell>
                          <TableCell>{formatCurrency(item.price)}</TableCell>
                          <TableCell>
                            <div className="text-sm text-muted-foreground">
                              {item.ingredients.map((ing, idx) => (
                                <div key={idx}>
                                  {formatNumber(ing.quantity)} {ing.unit} {materials.find(m => m.id === String(ing.materialId))?.name}
                                </div>
                              ))}
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
                                  ingredients: item.ingredients.map(ing => ({
                                    materialId: ing.materialId,
                                    quantity: ing.quantity,
                                    unit: ing.unit
                                  })),
                                  createdAt: undefined,
                                  updatedAt: undefined
                                };
                                setSelectedMenuItems([...selectedMenuItems, menuItemSale]);
                              }}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Selected Menu Items */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Selected Menu Items</CardTitle>
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

                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between font-bold">
                        <span>Total</span>
                        <span>{formatCurrency(selectedMenuItems.reduce((sum, item) => sum + item.totalPrice, 0))}</span>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-4">
                      <Button variant="outline" className="flex-1" onClick={() => setSelectedMenuItems([])}>
                        <X className="h-4 w-4 mr-2" />
                        Clear
                      </Button>
                      <Button className="flex-1" onClick={completeSale} disabled={selectedMenuItems.length === 0}>
                        <Check className="h-4 w-4 mr-2" />
                        Complete Order
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
      )}
    </div>
  );
}
