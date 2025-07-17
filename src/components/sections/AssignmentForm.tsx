import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CreateSectionAssignmentData, Material, Section, SectionAssignment, StockEntry } from "@/types/inventory";
import { formatNumber } from "@/utils/conversionLogic";
import { getSuggestedUnits } from "@/utils/inventoryCalculations";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Textarea } from "../ui/textarea";

const assignmentSchema = z.object({
  sectionId: z.string().min(1, "Section is required"),
  stockEntryId: z.string().min(1, "Stock entry is required"),
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
  onSubmit: (data: CreateSectionAssignmentData) => void;
  onCancel: () => void;
}

export function AssignmentForm({ sections, stockEntries, materials, assignment, onSubmit, onCancel }: AssignmentFormProps) {
  const form = useForm<AssignmentFormData>({
    resolver: zodResolver(assignmentSchema),
    defaultValues: {
      sectionId: assignment?.sectionId || "",
      stockEntryId: assignment?.stockEntryId || "",
      assignedQuantity: assignment?.assignedQuantity || 0,
      assignedUnit: assignment?.assignedUnit || "",
      notes: assignment?.notes || ""
    }
  });

  const watchedStockEntryId = form.watch("stockEntryId");
  const selectedStockEntry = stockEntries.find(entry => entry.id === watchedStockEntryId);
  const material = selectedStockEntry ? materials.find(m => m.id === selectedStockEntry.materialId) : null;
  const availableUnits = material ? getSuggestedUnits(material.unitType) : [];

  const handleSubmit = (data: AssignmentFormData) => {
    // Add required fields that backend expects
    const submissionData: CreateSectionAssignmentData = {
      sectionId: data.sectionId,
      itemType: "stockEntry",
      materialId: selectedStockEntry?.materialId || "",
      stockEntryId: data.stockEntryId,
      assignedQuantity: data.assignedQuantity,
      assignedUnit: data.assignedUnit,
      notes: data.notes
    };
    onSubmit(submissionData);
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
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select section" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {sections.map(section => (
                          <SelectItem key={section.id} value={section.id}>
                            {section.name}
                          </SelectItem>
                        ))}
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
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select stock entry" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {stockEntries.map(entry => {
                          const material = materials.find(m => m.id === entry.materialId);
                          return (
                            <SelectItem key={entry.id} value={entry.id}>
                              {material?.name} - {formatNumber(entry.purchasedQuantity)} {entry.purchasedUnit} (${formatNumber(entry.totalCost)})
                            </SelectItem>
                          );
                        })}
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
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select unit" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {availableUnits.map(unit => (
                          <SelectItem key={unit} value={unit}>
                            {unit}
                          </SelectItem>
                        ))}
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
              <Button type="submit">{assignment ? "Update Assignment" : "Assign to Section"}</Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
