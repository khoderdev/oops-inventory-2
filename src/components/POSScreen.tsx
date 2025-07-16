import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Material, Section, SectionAssignment, SoldItem, StockEntry } from "@/types/inventory";
import { formatCurrency, formatNumber } from "@/utils/conversionLogic";
import { Check, Minus, Package, Plus, Search, Trash2, X } from "lucide-react";
import { useMemo, useState } from "react";

interface POSScreenProps {
  sections: Section[];
  assignments: SectionAssignment[];
  materials: Material[];
  stockEntries: StockEntry[];
  onUpdateAssignment: (assignmentId: string, newQuantity: number) => void;
  onCompleteSale: (soldItems: SoldItem[]) => void;
}

export function POSScreen({ sections, assignments, materials, stockEntries, onUpdateAssignment, onCompleteSale }: POSScreenProps) {
  const [selectedSectionId, setSelectedSectionId] = useState<string>("");
  const [cart, setCart] = useState<SoldItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [notes, setNotes] = useState("");

  // Get available items for the selected section
  const availableItems = useMemo(() => {
    if (!selectedSectionId) return [];

    return assignments
      .filter(a => a.sectionId === selectedSectionId)
      .map(a => {
        // Find the stock entry for this assignment
        const stockEntry = stockEntries.find(se => se.id === a.stockEntryId);
        // Find the material for this stock entry
        const material = materials.find(m => stockEntry && m.id === stockEntry.materialId);

        return {
          assignmentId: a.id,
          materialId: material?.id || "",
          sectionId: a.sectionId,
          materialName: material?.name || "Unknown",
          currentQuantity: a.assignedQuantity,
          unit: a.assignedUnit,
          unitPrice: material?.costPerBaseUnit || 0
        };
      })
      .filter(item => item.currentQuantity > 0);
  }, [selectedSectionId, assignments, materials, stockEntries]);

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
    setCart(prevCart => {
      const existingItem = prevCart.find(cartItem => cartItem.assignmentId === item.assignmentId);

      if (existingItem) {
        // Increment quantity if item already in cart
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
        // Add new item to cart
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
  const completeSale = () => {
    if (cart.length === 0) return;

    // Update inventory
    cart.forEach(item => {
      const assignment = assignments.find(a => a.id === item.assignmentId);
      if (assignment) {
        const newQuantity = assignment.assignedQuantity - item.quantity;
        onUpdateAssignment(item.assignmentId, newQuantity);
      }
    });

    // Record sale
    onCompleteSale(cart);

    // Reset cart and form
    setCart([]);
    setCustomerName("");
    setNotes("");
  };

  // Get section name by ID
  const getSectionName = (sectionId: string) => {
    return sections.find(s => s.id === sectionId)?.name || "Unknown";
  };

  return (
    <div className="p-6 space-y-6">
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
                    <option key={section.id} value={section.id}>
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

                  <div className="space-y-2">
                    <div>
                      <label className="block text-sm font-medium mb-1">Customer Name</label>
                      <Input placeholder="Optional" value={customerName} onChange={e => setCustomerName(e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Notes</label>
                      <Input placeholder="Special instructions" value={notes} onChange={e => setNotes(e.target.value)} />
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" className="flex-1" onClick={() => setCart([])}>
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                    <Button className="flex-1" onClick={completeSale}>
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
    </div>
  );
}
