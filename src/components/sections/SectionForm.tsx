import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Section } from "@/types/inventory";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Building2, Info } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const sectionSchema = z.object({
  name: z
    .string()
    .min(1, "Section name is required")
    .max(100, "Section name must be 100 characters or less")
    .regex(/^[a-zA-Z0-9\s\-_]+$/, "Section name can only contain letters, numbers, spaces, hyphens, and underscores"),
  description: z
    .string()
    .optional()
    .refine(val => !val || val.length <= 500, "Description must be 500 characters or less")
});

type SectionFormData = z.infer<typeof sectionSchema>;

interface SectionFormProps {
  section?: Section;
  onSubmit: (data: SectionFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
  existingSectionNames?: string[];
}

export function SectionForm({ section, onSubmit, onCancel, isLoading = false, existingSectionNames = [] }: SectionFormProps) {
  const form = useForm<SectionFormData>({
    resolver: zodResolver(sectionSchema),
    defaultValues: {
      name: section?.name || "",
      description: section?.description || ""
    },
    mode: "onChange"
  });

  const watchedName = form.watch("name");
  const watchedDescription = form.watch("description");

  // Check for duplicate section names
  const isDuplicateName = existingSectionNames.filter(name => (section ? name !== section.name : true)).some(name => name.toLowerCase() === watchedName.toLowerCase());

  // Set custom error for duplicate names
  useEffect(() => {
    if (isDuplicateName && watchedName) {
      form.setError("name", {
        type: "manual",
        message: "A section with this name already exists"
      });
    } else if (!isDuplicateName) {
      form.clearErrors("name");
    }
  }, [isDuplicateName, watchedName, form]);

  const handleSubmit = (data: SectionFormData) => {
    if (isLoading || isDuplicateName) return;
    onSubmit(data);
  };

  return (
    <div className="w-full">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Section Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Section Name *</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input placeholder="e.g., Kitchen, Bar, Storage, Freezer" className="h-10" disabled={isLoading} maxLength={100} {...field} />
                      {isDuplicateName && watchedName && <AlertCircle className="absolute right-3 top-3 h-4 w-4 text-destructive" />}
                    </div>
                  </FormControl>
                  <div className="flex justify-between items-center">
                    <FormMessage />
                    <span className="text-xs text-muted-foreground">{field.value?.length || 0}/100</span>
                  </div>
                  {isDuplicateName && watchedName && (
                    <Alert variant="destructive" className="mt-2">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>A section with the name "{watchedName}" already exists. Please choose a different name.</AlertDescription>
                    </Alert>
                  )}
                </FormItem>
              )}
            />

            {/* Section Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Brief description of this section and its purpose..." className="resize-none min-h-[100px]" disabled={isLoading} maxLength={500} {...field} />
                  </FormControl>
                  <div className="flex justify-between items-center mt-1">
                    <FormMessage />
                    <span className="text-xs text-muted-foreground">{field.value?.length || 0}/500</span>
                  </div>
                </FormItem>
              )}
            />

            {/* Preview Section */}
            {(watchedName || watchedDescription) && (
              <>
                <Separator />
                <div className="rounded-lg border bg-muted/50 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Info className="h-4 w-4 text-blue-500" />
                    <h3 className="font-medium text-sm">Section Preview</h3>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{watchedName || "Section Name"}</span>
                      <Badge variant="outline" className="text-xs">
                        {section ? "Existing" : "New"}
                      </Badge>
                    </div>
                    {watchedDescription && <p className="text-sm text-muted-foreground pl-6">{watchedDescription}</p>}
                  </div>
                </div>
              </>
            )}

            {/* Guidelines */}
            <div className="rounded-lg border bg-blue-50 dark:bg-blue-950/20 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Info className="h-4 w-4 text-blue-600" />
                <h3 className="font-medium text-sm text-blue-800 dark:text-blue-200">Section Guidelines</h3>
              </div>
              <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
                <li>• Use descriptive names that clearly identify the section's purpose</li>
                <li>• Consider physical locations (Kitchen, Storage) or functional areas (Beverages, Ingredients)</li>
                <li>• Keep names concise but meaningful for easy identification</li>
                <li>• Add descriptions to provide context for team members</li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col-reverse sm:flex-row gap-3 justify-end pt-4">
              <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading} className="w-full sm:w-auto">
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading || !form.formState.isValid || isDuplicateName} className="w-full sm:w-auto">
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Processing...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    {section ? "Update Section" : "Create Section"}
                  </div>
                )}
              </Button>
            </div>
        </form>
      </Form>
    </div>
  );
}
