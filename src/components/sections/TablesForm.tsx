import { sectionAPI } from "@/api/sections.api.ts";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { InnerSection, Tables } from "@/types/inventory";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Info, Table2, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { tablesSchema } from "./assignmentSchema";

type TablesFormData = z.infer<typeof tablesSchema>;

interface TablesFormProps {
  table?: Tables;
  innerSections?: InnerSection[];
  onSubmit: (data: TablesFormData) => void | Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  existingTableNumbers?: string[];
  preSelectedInnerSectionId?: string;
  parentSectionId?: string;
}

export function TablesForm({ table, innerSections: initialInnerSections = [], onSubmit, onCancel, isLoading = false, existingTableNumbers = [], preSelectedInnerSectionId, parentSectionId }: TablesFormProps) {
  const [innerSections, setInnerSections] = useState<InnerSection[]>(initialInnerSections);
  const [isLoadingSections, setIsLoadingSections] = useState(false);

  const form = useForm<TablesFormData>({
    resolver: zodResolver(tablesSchema),
    defaultValues: {
      innerSectionId: String(table?.innerSectionId || preSelectedInnerSectionId || ""),
      tableNumber: table?.tableNumber || "",
      capacity: table?.capacity || 2
    },
    mode: "onChange"
  });

  // Convert all IDs to strings for consistency
  const idsMatch = (id1: string | number, id2: string | number) => String(id1) === String(id2);

  const selectedInnerSection = innerSections.find(is => idsMatch(is.id, form.getValues("innerSectionId")));

  // Load inner sections when parentSectionId changes
  useEffect(() => {
    const loadInnerSections = async () => {
      if (parentSectionId && innerSections.length === 0) {
        setIsLoadingSections(true);
        try {
          const response = await sectionAPI.getInnerSections(parentSectionId);
          setInnerSections(response.data);
        } catch (error) {
          console.error("Failed to load inner sections:", error);
        } finally {
          setIsLoadingSections(false);
        }
      }
    };

    loadInnerSections();
  }, [parentSectionId, innerSections.length]);

  // Watch form values
  const watchedTableNumber = form.watch("tableNumber");
  const watchedCapacity = form.watch("capacity");

  // Check for duplicate table numbers
  const isDuplicateTableNumber = existingTableNumbers.filter(num => (table ? num !== table.tableNumber : true)).some(num => num.toLowerCase() === watchedTableNumber?.toLowerCase());

  // Handle form submission
  const handleSubmit = async (data: TablesFormData) => {
    // Ensure all data is properly formatted before submission
    const submissionData = {
      ...data,
      innerSectionId: String(data.innerSectionId), // Ensure string ID
      capacity: Number(data.capacity) // Ensure number
    };

    console.log("Submitting table data:", submissionData);
    await onSubmit(submissionData);
  };

  return (
    <div className="w-full">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {/* Inner Section Selection */}
          <FormField
            control={form.control}
            name="innerSectionId"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">Target Inner Section *</FormLabel>
                {isLoadingSections ? (
                  <div className="h-10 px-3 py-2 border border-input rounded-md bg-muted flex items-center justify-center">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    <span className="ml-2">Loading sections...</span>
                  </div>
                ) : preSelectedInnerSectionId ? (
                  <div>
                    <div className="h-10 px-3 py-2 border border-input rounded-md bg-muted flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="font-medium text-foreground">{selectedInnerSection?.name || "Unknown Inner Section"}</span>
                        {selectedInnerSection?.type && <span className="text-xs text-muted-foreground">{selectedInnerSection.type}</span>}
                      </div>
                    </div>
                    <input type="hidden" {...field} value={String(preSelectedInnerSectionId)} />
                  </div>
                ) : (
                  <Select onValueChange={field.onChange} value={field.value} disabled={isLoading}>
                    <FormControl>
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="Choose an inner section" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {innerSections.length === 0 ? (
                        <div className="p-2 text-sm text-muted-foreground text-center">No inner sections available</div>
                      ) : (
                        innerSections.map(innerSection => (
                          <SelectItem key={innerSection.id} value={innerSection.id.toString()}>
                            <div className="flex flex-col">
                              <span className="font-medium">{innerSection.name}</span>
                              <span className="text-xs text-muted-foreground">{innerSection.type}</span>
                            </div>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                )}
                {preSelectedInnerSectionId && !selectedInnerSection && !isLoadingSections && (
                  <Alert variant="destructive" className="mt-2">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>The pre-selected inner section could not be found. Please verify your data or try again later.</AlertDescription>
                  </Alert>
                )}
                {preSelectedInnerSectionId && selectedInnerSection && <p className="text-xs text-muted-foreground mt-1">Inner section is pre-selected. To assign to a different inner section, use the tables table.</p>}
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Table Number */}
          <FormField
            control={form.control}
            name="tableNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">Table Number *</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      placeholder="e.g., T1, Table 01"
                      className="h-10"
                      disabled={isLoading}
                      maxLength={50}
                      {...field}
                      onChange={e => {
                        field.onChange(e.target.value);
                        form.trigger("tableNumber");
                      }}
                    />
                    {isDuplicateTableNumber && watchedTableNumber && <AlertCircle className="absolute right-3 top-3 h-4 w-4 text-destructive" />}
                  </div>
                </FormControl>
                <div className="flex justify-between items-center">
                  <FormMessage />
                  <span className="text-xs text-muted-foreground">{field.value?.length || 0}/50</span>
                </div>
                {isDuplicateTableNumber && watchedTableNumber && (
                  <Alert variant="destructive" className="mt-2">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>A table with the number "{watchedTableNumber}" already exists in this inner section. Please choose a different number.</AlertDescription>
                  </Alert>
                )}
              </FormItem>
            )}
          />

          {/* Capacity */}
          <FormField
            control={form.control}
            name="capacity"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">Capacity *</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="e.g., 4"
                    className="h-10"
                    disabled={isLoading}
                    min={1}
                    max={100}
                    {...field}
                    onChange={e => {
                      // Ensure we always send a number
                      const value = e.target.value;
                      field.onChange(value === "" ? undefined : parseInt(value));
                    }}
                    value={field.value ?? ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Preview Section */}
          {watchedTableNumber && (
            <>
              <Separator />
              <div className="rounded-lg border bg-muted/50 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Info className="h-4 w-4 text-blue-500" />
                  <h3 className="font-medium text-sm">Table Preview</h3>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Table2 className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{watchedTableNumber || "Table Number"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Capacity: {form.watch("capacity") || 1}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Inner Section: {selectedInnerSection?.name || "Unknown Inner Section"}({selectedInnerSection?.type || "Unknown"})
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col-reverse sm:flex-row gap-3 justify-end pt-4">
            <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading || isLoadingSections} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || isLoadingSections || !form.formState.isValid || isDuplicateTableNumber} className="w-full sm:w-auto">
              {isLoading || isLoadingSections ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Processing...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Table2 className="h-4 w-4" />
                  {table ? "Update Table" : "Create Table"}
                </div>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
