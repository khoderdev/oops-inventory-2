// import { Button } from "@/components/ui/button";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
// import { Input } from "@/components/ui/input";
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// import { Material, Section, SectionAssignment, StockEntry } from "@/types/inventory";
// import { formatNumber } from "@/utils/conversionLogic";
// import { getSuggestedUnits } from "@/utils/inventoryCalculations";
// import { zodResolver } from "@hookform/resolvers/zod";
// import { useForm } from "react-hook-form";
// import { z } from "zod";
// import { Textarea } from "../ui/textarea";

// const assignmentSchema = z.object({
//   sectionId: z.string().min(1, "Section is required"),
//   stockEntryId: z.string().min(1, "Stock entry is required"),
//   materialId: z.string().min(1, "Material is required"),
//   assignedQuantity: z.number().min(0.0001, "Quantity must be positive"),
//   assignedUnit: z.string().min(1, "Unit is required"),
//   notes: z.string().optional()
// });

// type AssignmentFormData = z.infer<typeof assignmentSchema>;

// interface AssignmentFormProps {
//   sections: Section[];
//   stockEntries: StockEntry[];
//   materials: Material[];
//   assignment?: SectionAssignment;
//   onSubmit: (data: AssignmentFormData) => void;
//   onCancel: () => void;
// }

// export function AssignmentForm({ sections, stockEntries, materials, assignment, onSubmit, onCancel }: AssignmentFormProps) {
//   const form = useForm<AssignmentFormData>({
//     resolver: zodResolver(assignmentSchema),
//     defaultValues: {
//       sectionId: assignment?.sectionId || "",
//       stockEntryId: assignment?.stockEntryId || "",
//       materialId: assignment?.materialId || "",
//       assignedQuantity: assignment?.assignedQuantity || 0,
//       assignedUnit: assignment?.assignedUnit || "",
//       notes: assignment?.notes || ""
//     }
//   });
//   console.log("Sections:", sections);
//   console.log("Stock Entries:", stockEntries);
//   console.log("Materials:", materials);
//   console.log("Assignment:", assignment);
//   const watchedStockEntryId = form.watch("stockEntryId");
//   // const selectedStockEntry = stockEntries.find(entry => String(entry.id) === watchedStockEntryId);
//   const selectedStockEntry = stockEntries.find(entry => String(entry.id) === String(watchedStockEntryId));
//   const material = selectedStockEntry ? materials.find(m => m.id === selectedStockEntry.materialId) : null;
//   const availableUnits = material ? getSuggestedUnits(material.unitType) : [];
//   console.log("watchedStockEntryId:", watchedStockEntryId);
//   console.log("selectedStockEntry:", selectedStockEntry);
//   console.log("material:", material);
//   console.log("availableUnits:", availableUnits);

//   const handleSubmit = (data: AssignmentFormData) => {
//     if (!selectedStockEntry) {
//       console.error("No stock entry selected");
//       form.setError("stockEntryId", { message: "Please select a stock entry" });
//       return;
//     }
//     const submitData = {
//       sectionId: String(data.sectionId),
//       stockEntryId: String(data.stockEntryId),
//       materialId: String(selectedStockEntry.materialId),
//       assignedQuantity: data.assignedQuantity,
//       assignedUnit: data.assignedUnit,
//       notes: data.notes || ""
//     };
//     console.log("Submitting Data:", submitData);
//     onSubmit(submitData);
//   };

//   return (
//     <Card className="w-full max-w-2xl mx-auto">
//       <CardHeader>
//         <CardTitle>{assignment ? "Edit Assignment" : "Assign Stock to Section"}</CardTitle>
//       </CardHeader>
//       <CardContent>
//         <Form {...form}>
//           <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//               <FormField
//                 control={form.control}
//                 name="sectionId"
//                 render={({ field }) => (
//                   <FormItem>
//                     <FormLabel>Section</FormLabel>
//                     <Select onValueChange={field.onChange} defaultValue={field.value}>
//                       <FormControl>
//                         <SelectTrigger>
//                           <SelectValue placeholder="Select section" />
//                         </SelectTrigger>
//                       </FormControl>
//                       <SelectContent>
//                         {sections.map(section => (
//                           <SelectItem key={section.id} value={String(section.id)}>
//                             {section.name}
//                           </SelectItem>
//                         ))}
//                       </SelectContent>
//                     </Select>
//                     <FormMessage />
//                   </FormItem>
//                 )}
//               />

//               <FormField
//                 control={form.control}
//                 name="stockEntryId"
//                 render={({ field }) => (
//                   <FormItem>
//                     <FormLabel>Stock Entry</FormLabel>
//                     <Select onValueChange={field.onChange} defaultValue={field.value}>
//                       <FormControl>
//                         <SelectTrigger>
//                           <SelectValue placeholder="Select stock entry" />
//                         </SelectTrigger>
//                       </FormControl>
//                       <SelectContent>
//                         {stockEntries.map(entry => {
//                           const material = materials.find(m => m.id === entry.materialId);
//                           return (
//                             <SelectItem key={entry.id} value={String(entry.id)}>
//                               {material?.name} - {formatNumber(entry.purchasedQuantity)} {entry.purchasedUnit} (${formatNumber(entry.totalCost)})
//                             </SelectItem>
//                           );
//                         })}
//                       </SelectContent>
//                     </Select>
//                     <FormMessage />
//                   </FormItem>
//                 )}
//               />

//               <FormField
//                 control={form.control}
//                 name="assignedQuantity"
//                 render={({ field }) => (
//                   <FormItem>
//                     <FormLabel>Quantity to Assign</FormLabel>
//                     <FormControl>
//                       <Input type="number" step="0.0001" placeholder="0" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />
//                     </FormControl>
//                     <FormMessage />
//                   </FormItem>
//                 )}
//               />

//               <FormField
//                 control={form.control}
//                 name="assignedUnit"
//                 render={({ field }) => (
//                   <FormItem>
//                     <FormLabel>Unit</FormLabel>
//                     <Select onValueChange={field.onChange} defaultValue={field.value}>
//                       <FormControl>
//                         <SelectTrigger>
//                           <SelectValue placeholder="Select unit" />
//                         </SelectTrigger>
//                       </FormControl>
//                       <SelectContent>
//                         {availableUnits.map(unit => (
//                           <SelectItem key={unit} value={unit}>
//                             {unit}
//                           </SelectItem>
//                         ))}
//                       </SelectContent>
//                     </Select>
//                     <FormMessage />
//                   </FormItem>
//                 )}
//               />
//             </div>

//             <FormField
//               control={form.control}
//               name="notes"
//               render={({ field }) => (
//                 <FormItem>
//                   <FormLabel>Notes (Optional)</FormLabel>
//                   <FormControl>
//                     <Textarea placeholder="Additional notes about this assignment..." className="resize-none" {...field} />
//                   </FormControl>
//                   <FormMessage />
//                 </FormItem>
//               )}
//             />

//             <div className="flex gap-3 justify-end">
//               <Button type="button" variant="outline" onClick={onCancel}>
//                 Cancel
//               </Button>
//               <Button type="submit">{assignment ? "Update Assignment" : "Assign to Section"}</Button>
//             </div>
//           </form>
//         </Form>
//       </CardContent>
//     </Card>
//   );
// }
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Material, Section, SectionAssignment, StockEntry } from "@/types/inventory";
import { formatNumber } from "@/utils/conversionLogic";
import { getSuggestedUnits } from "@/utils/inventoryCalculations";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Textarea } from "../ui/textarea";

const assignmentSchema = z.object({
  sectionId: z.string().min(1, "Section is required"),
  stockEntryId: z.string().min(1, "Stock entry is required"),
  materialId: z.string().min(1, "Material is required"),
  assignedQuantity: z.number().min(0.0001, "Quantity must be positive"),
  assignedUnit: z.string().min(1, "Unit is required"),
  notes: z.string().optional()
});

type AssignmentFormData = z.infer<typeof assignmentSchema>;

interface AssignmentFormProps {
  sections: Section[];
  stockEntries: StockEntry[];
  materials: Material[];
  assignment?: SectionAssignment;
  onSubmit: (data: AssignmentFormData) => void;
  onCancel: () => void;
}

export function AssignmentForm({ sections, stockEntries, materials, assignment, onSubmit, onCancel }: AssignmentFormProps) {
  const form = useForm<AssignmentFormData>({
    resolver: zodResolver(assignmentSchema),
    defaultValues: {
      sectionId: assignment?.sectionId ? String(assignment.sectionId) : "",
      stockEntryId: assignment?.stockEntryId ? String(assignment.stockEntryId) : "",
      materialId: assignment?.materialId ? String(assignment.materialId) : "",
      assignedQuantity: assignment?.assignedQuantity || 0,
      assignedUnit: assignment?.assignedUnit || "",
      notes: assignment?.notes || ""
    }
  });

  const watchedStockEntryId = form.watch("stockEntryId");
  const selectedStockEntry = stockEntries.find(entry => String(entry.id) === String(watchedStockEntryId));
  const material = selectedStockEntry ? materials.find(m => String(m.id) === String(selectedStockEntry.materialId)) : null;
  const availableUnits = material ? getSuggestedUnits(material.unitType) : [];

  // Debugging logs
  console.log("Sections:", sections);
  console.log("Stock Entries:", stockEntries);
  console.log("Materials:", materials);
  console.log("Assignment Prop:", assignment);
  console.log("watchedStockEntryId:", watchedStockEntryId);
  console.log("selectedStockEntry:", selectedStockEntry);
  console.log("material:", material);
  console.log("availableUnits:", availableUnits);
  console.log("Form Values:", form.getValues());

  const handleSubmit = (data: AssignmentFormData) => {
    if (!selectedStockEntry) {
      console.error("No stock entry selected");
      form.setError("stockEntryId", { message: "Please select a stock entry" });
      return;
    }
    if (!data.sectionId) {
      console.error("No section selected");
      form.setError("sectionId", { message: "Please select a section" });
      return;
    }
    if (!data.assignedUnit) {
      console.error("No unit selected");
      form.setError("assignedUnit", { message: "Please select a unit" });
      return;
    }
    const submitData = {
      sectionId: String(data.sectionId),
      stockEntryId: String(data.stockEntryId),
      materialId: String(selectedStockEntry.materialId),
      assignedQuantity: data.assignedQuantity,
      assignedUnit: data.assignedUnit,
      notes: data.notes || ""
    };
    console.log("Submitting Data:", submitData);
    onSubmit(submitData);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{assignment ? "Edit Assignment" : "Assign Stock to Section"}</CardTitle>
      </CardHeader>
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
                        console.log("Selected sectionId:", value);
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
                name="stockEntryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stock Entry</FormLabel>
                    <Select
                      onValueChange={value => {
                        console.log("Selected stockEntryId:", value);
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
                                  {(material?.name || "Unknown") + " - " + formatNumber(entry.purchasedQuantity) + " " + entry.purchasedUnit + " ($" + formatNumber(entry.totalCost) + ")"}
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

              <FormField
                control={form.control}
                name="assignedQuantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantity to Assign</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.0001" placeholder="0" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="assignedUnit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unit</FormLabel>
                    <Select
                      onValueChange={value => {
                        console.log("Selected unit:", value);
                        field.onChange(value);
                      }}
                      defaultValue={field.value}
                      disabled={!selectedStockEntry}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={selectedStockEntry ? "Select unit" : "Select a stock entry first"} />
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

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Additional notes about this assignment..." className="resize-none" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-3 justify-end">
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button type="submit" disabled={!form.formState.isValid}>
                {assignment ? "Update Assignment" : "Assign to Section"}
              </Button>
              <Button type="button" onClick={() => console.log("Form Values:", form.getValues())}>
                Log Form Values
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
