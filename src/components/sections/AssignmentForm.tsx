import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { AssignmentFormData, AssignmentFormProps, Material } from "@/types/inventory";
import { formatStockEntryValue } from "@/utils/formatStockEntry";
import { getSuggestedUnits } from "@/utils/inventoryCalculations";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { AssignmentSchema } from "./AssigmentSchema";

export function AssignmentForm({ sections, stockEntries, menuItems, materials, assignment, onSubmit, onCancel }: AssignmentFormProps) {
  const form = useForm<AssignmentFormData>({
    resolver: zodResolver(AssignmentSchema),
    mode: "onChange", // live validation
    defaultValues: {
      sectionId: assignment?.sectionId ? String(assignment.sectionId) : "",
      itemType: assignment?.menuItemId ? "menuItem" : "stockEntry",
      stockEntryId: assignment?.stockEntryId ? String(assignment.stockEntryId) : "",
      menuItemId: assignment?.menuItemId ? String(assignment.menuItemId) : "",
      materialId: assignment?.materialId ? String(assignment.materialId) : "",
      assignedQuantity: assignment?.assignedQuantity || undefined,
      assignedUnit: assignment?.assignedUnit || ""
    }
  });

  const watchedItemType = form.watch("itemType");
  const watchedStockEntryId = form.watch("stockEntryId");
  const watchedMenuItemId = form.watch("menuItemId");
  const selectedStockEntry = stockEntries.find(entry => String(entry.id) === String(watchedStockEntryId));
  const selectedMenuItem = menuItems.find(item => String(item.id) === String(watchedMenuItemId));

  let material: Material | null | undefined = null;
  if (watchedItemType === "stockEntry" && selectedStockEntry) {
    material = materials.find(m => String(m.id) === String(selectedStockEntry.materialId));
  } else if (watchedItemType === "menuItem" && selectedMenuItem) {
    material = materials.find(m => String(m.id) === String(selectedMenuItem.materialId));
  }

  const availableUnits = material ? getSuggestedUnits(material.unitType) : [];

  const handleSubmit = (data: AssignmentFormData) => {
    if (!data.sectionId) {
      console.error("No section selected");
      form.setError("sectionId", { message: "Please select a section" });
      return;
    }
    const submitData = {
      sectionId: String(data.sectionId),
      itemType: data.itemType,
      stockEntryId: data.itemType === "stockEntry" ? String(data.stockEntryId) : undefined,
      menuItemId: data.itemType === "menuItem" ? String(data.menuItemId) : undefined,
      materialId: material ? String(material.id) : "",
      assignedQuantity: data.itemType === "stockEntry" ? data.assignedQuantity : undefined,
      assignedUnit: data.itemType === "stockEntry" ? data.assignedUnit : undefined
    };
    console.log("Submitting Data:", submitData);
    onSubmit(submitData);
  };

  return (
    <Card className="w-full mx-auto">
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="sectionId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Section</FormLabel>
                    <Select
                      onValueChange={value => {
                        field.onChange(value);
                      }}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={sections.length ? "Select section" : "No sections available"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {sections.length ? (
                          sections
                            .map(section => {
                              if (!section.id) {
                                console.warn("Invalid section ID:", section);
                                return null;
                              }
                              return (
                                <SelectItem key={`section-${section.id}`} value={String(section.id)}>
                                  {section.name}
                                </SelectItem>
                              );
                            })
                            .filter(Boolean)
                        ) : (
                          <SelectItem value="" disabled>
                            No sections available
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="itemType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Item Type</FormLabel>
                    <Select
                      onValueChange={value => {
                        field.onChange(value);
                        form.resetField(value === "stockEntry" ? "menuItemId" : "stockEntryId");
                        if (value === "menuItem") {
                          form.resetField("assignedQuantity");
                          form.resetField("assignedUnit");
                        }
                      }}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select item type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="stockEntry">Stock Entry</SelectItem>
                        <SelectItem value="menuItem">Menu Item</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Tabs value={watchedItemType} className="w-full">
              <TabsContent value="stockEntry">
                <FormField
                  control={form.control}
                  name="stockEntryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Stock Entry</FormLabel>
                      <Select
                        onValueChange={value => {
                          const selectedEntry = stockEntries.find(entry => String(entry.id) === value);
                          if (selectedEntry) {
                            form.setValue("materialId", String(selectedEntry.materialId));
                          } else {
                            form.setValue("materialId", "");
                          }
                          field.onChange(value);
                        }}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={stockEntries.length ? "Select stock entry" : "No stock entries available"} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {stockEntries.length ? (
                            stockEntries
                              .map(entry => {
                                if (!entry.id) {
                                  console.warn("Invalid stock entry ID:", entry);
                                  return null;
                                }
                                const material = materials.find(m => String(m.id) === String(entry.materialId));
                                return (
                                  <SelectItem key={`stock-${entry.id}`} value={String(entry.id)}>
                                    {(material?.name || "Unknown") + " - " + formatStockEntryValue(entry.purchasedQuantity, entry.purchasedUnit) + " " + entry.purchasedUnit + " ($" + formatStockEntryValue(entry.totalCost) + ")"}
                                  </SelectItem>
                                );
                              })
                              .filter(Boolean)
                          ) : (
                            <SelectItem value="" disabled>
                              No stock entries available
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>
              <TabsContent value="menuItem">
                <FormField
                  control={form.control}
                  name="menuItemId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Menu Item</FormLabel>
                      <Select
                        onValueChange={value => {
                          const selectedItem = menuItems.find(item => String(item.id) === value);
                          if (selectedItem) {
                            form.setValue("materialId", String(selectedItem.materialId));
                          } else {
                            form.setValue("materialId", "");
                          }
                          field.onChange(value);
                        }}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={menuItems.length ? "Select menu item" : "No menu items available"} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {menuItems.length ? (
                            menuItems
                              .map(item => {
                                if (!item.id) {
                                  console.warn("Invalid menu item ID:", item);
                                  return null;
                                }
                                const material = materials.find(m => String(m.id) === String(item.materialId));
                                return (
                                  <SelectItem key={`menu-${item.id}`} value={String(item.id)}>
                                    {item.name} {material ? `(${material.name})` : ""}
                                  </SelectItem>
                                );
                              })
                              .filter(Boolean)
                          ) : (
                            <SelectItem value="" disabled>
                              No menu items available
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>
            </Tabs>

            {watchedItemType === "stockEntry" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="assignedQuantity"
                  render={({ field }) => {
                    const value = typeof field.value === "number" ? field.value : parseFloat(field.value) || 0;
                    return (
                      <FormItem>
                        <FormLabel>Quantity to Assign</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.0001"
                            placeholder="0"
                            value={value}
                            onChange={e => {
                              const numValue = parseFloat(e.target.value);
                              field.onChange(isNaN(numValue) ? 0 : numValue);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />

                <FormField
                  control={form.control}
                  name="assignedUnit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unit</FormLabel>
                      <Select
                        onValueChange={value => {
                          field.onChange(value);
                        }}
                        defaultValue={field.value}
                        disabled={!material}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={material ? "Select unit" : "Select a stock entry first"} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {availableUnits.length ? (
                            availableUnits.map(unit => (
                              <SelectItem key={`unit-${unit}`} value={unit}>
                                {unit}
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="no-units" disabled>
                              No units available
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            <div className="flex gap-3 justify-end">
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button type="submit" disabled={!form.formState.isValid || (form.watch("itemType") === "menuItem" && !form.watch("menuItemId")) || (form.watch("itemType") === "stockEntry" && !form.watch("stockEntryId"))}>
                {assignment ? "Update Assignment" : "Assign to Section"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
