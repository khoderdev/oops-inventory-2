// import { Alert, AlertDescription } from "@/components/ui/alert";
// import { Button } from "@/components/ui/button";
// import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
// import { Input } from "@/components/ui/input";
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// import { Separator } from "@/components/ui/separator";
// import { useInventoryCRUD } from "@/hooks/useInventoryCRUD";
// import { CreateInnerSectionData, InnerSection, Section } from "@/types/inventory";
// import { zodResolver } from "@hookform/resolvers/zod";
// import { AlertCircle, Building2, Info } from "lucide-react";
// import { useEffect } from "react";
// import { useForm } from "react-hook-form";
// import { z } from "zod";
// import { innerSectionSchema } from "./assignmentSchema";

// type InnerSectionFormData = z.infer<typeof innerSectionSchema>;

// interface InnerSectionFormProps {
//   innerSection?: InnerSection;
//   sections: Section[];
//   onSubmit: (data: InnerSectionFormData) => void | Promise<void>;
//   onCancel: () => void;
//   isLoading?: boolean;
//   existingInnerSectionNames?: string[];
//   preSelectedSectionId?: string;
//   setShowInnerSectionForm: (show: boolean) => void;
// }

// export function InnerSectionForm({ innerSection, sections, onSubmit, onCancel, isLoading = false, existingInnerSectionNames = [], preSelectedSectionId, setShowInnerSectionForm }: InnerSectionFormProps) {
//   const form = useForm<InnerSectionFormData>({
//     resolver: zodResolver(innerSectionSchema),
//     defaultValues: {
//       sectionId: innerSection?.sectionId.toString() || preSelectedSectionId || "",
//       name: innerSection?.name || "",
//       type: innerSection?.type || "indoor"
//     },
//     mode: "onChange"
//   });

//   const { getInnerSections, createInnerSection, updateInnerSection, loading: crudLoading, error: crudError } = useInventoryCRUD(() => {});

//   const watchedValues = form.watch();
//   const isDirty = form.formState.isDirty;
//   const isValid = form.formState.isValid;

//   const isDuplicateName = existingInnerSectionNames.filter(name => (innerSection ? name !== innerSection.name : true)).some(name => name.toLowerCase() === watchedValues.name?.toLowerCase() && sections.find(s => s.id.toString() === watchedValues.sectionId)?.id === (innerSection?.sectionId || preSelectedSectionId));

//   // In your form submission handler (InnerSectionForm.tsx)
//   const handleSubmit = async (data: InnerSectionFormData) => {
//     try {
//       if (innerSection) {
//         const updatedData = {
//           ...innerSection,
//           ...data
//         };
//         await onSubmit(updatedData); // Pass the full updated object
//       } else {
//         await onSubmit(data as CreateInnerSectionData);
//       }
//       setShowInnerSectionForm(false);
//       onCancel();
//     } catch (err) {
//       console.error("Operation failed:", err);
//     }
//   };

//   useEffect(() => {
//     if (innerSection) {
//       form.reset({
//         sectionId: innerSection.sectionId.toString(),
//         name: innerSection.name,
//         type: innerSection.type
//       });
//     } else {
//       form.reset({
//         sectionId: preSelectedSectionId || "",
//         name: "",
//         type: "indoor"
//       });
//     }
//   }, [innerSection, form, preSelectedSectionId]);

//   const getSelectedSection = () => {
//     return sections.find(s => s.id.toString() === watchedValues.sectionId?.toString());
//   };

//   const selectedSection = getSelectedSection();

//   return (
//     <div className="w-full">
//       <Form {...form}>
//         <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
//           {/* Section Selection */}
//           <FormField
//             control={form.control}
//             name="sectionId"
//             render={({ field }) => (
//               <FormItem>
//                 <FormLabel className="text-sm font-medium">Target Section *</FormLabel>
//                 {preSelectedSectionId ? (
//                   <div>
//                     <div className="h-10 px-3 py-2 border border-input rounded-md bg-muted flex items-center justify-between">
//                       <div className="flex flex-col">
//                         <span className="font-medium text-foreground">{selectedSection?.name || "Unknown Section"}</span>
//                       </div>
//                     </div>
//                     <input type="hidden" {...field} value={preSelectedSectionId} />
//                   </div>
//                 ) : (
//                   <Select
//                     onValueChange={value => {
//                       field.onChange(value);
//                       form.trigger("sectionId");
//                     }}
//                     value={field.value}
//                     disabled={isLoading}
//                   >
//                     <FormControl>
//                       <SelectTrigger className="h-10">
//                         <SelectValue placeholder="Choose a section" />
//                       </SelectTrigger>
//                     </FormControl>
//                     <SelectContent>
//                       {sections.length === 0 ? (
//                         <div className="p-2 text-sm text-muted-foreground text-center">No sections available</div>
//                       ) : (
//                         sections.map(section => (
//                           <SelectItem key={section.id} value={section.id.toString()}>
//                             <div className="flex flex-col">
//                               <span className="font-medium">{section.name}</span>
//                             </div>
//                           </SelectItem>
//                         ))
//                       )}
//                     </SelectContent>
//                   </Select>
//                 )}
//                 {preSelectedSectionId && <p className="text-xs text-muted-foreground mt-1">Section is pre-selected. To assign to a different section, use the inner sections table.</p>}
//                 <FormMessage />
//               </FormItem>
//             )}
//           />

//           {/* Inner Section Name */}
//           <FormField
//             control={form.control}
//             name="name"
//             render={({ field }) => (
//               <FormItem>
//                 <FormLabel className="text-sm font-medium">Inner Section Name *</FormLabel>
//                 <FormControl>
//                   <div className="relative">
//                     <Input
//                       placeholder="e.g., Main Indoor, Patio Outdoor"
//                       className="h-10"
//                       disabled={isLoading}
//                       maxLength={100}
//                       {...field}
//                       onChange={e => {
//                         field.onChange(e);
//                         form.trigger("name");
//                       }}
//                     />
//                     {isDuplicateName && watchedValues.name && <AlertCircle className="absolute right-3 top-3 h-4 w-4 text-destructive" />}
//                   </div>
//                 </FormControl>
//                 <div className="flex justify-between items-center">
//                   <FormMessage />
//                   <span className="text-xs text-muted-foreground">{field.value?.length || 0}/100</span>
//                 </div>
//                 {isDuplicateName && watchedValues.name && (
//                   <Alert variant="destructive" className="mt-2">
//                     <AlertCircle className="h-4 w-4" />
//                     <AlertDescription>A section with the name "{watchedValues.name}" already exists in this section. Please choose a different name.</AlertDescription>
//                   </Alert>
//                 )}
//               </FormItem>
//             )}
//           />

//           {/* Type Selection */}
//           <FormField
//             control={form.control}
//             name="type"
//             render={({ field }) => (
//               <FormItem>
//                 <FormLabel className="text-sm font-medium">Type *</FormLabel>
//                 <Select
//                   onValueChange={value => {
//                     field.onChange(value);
//                     form.trigger("type");
//                   }}
//                   value={field.value}
//                   disabled={isLoading}
//                 >
//                   <FormControl>
//                     <SelectTrigger className="h-10">
//                       <SelectValue placeholder="Choose type" />
//                     </SelectTrigger>
//                   </FormControl>
//                   <SelectContent>
//                     <SelectItem value="indoor">Indoor</SelectItem>
//                     <SelectItem value="outdoor">Outdoor</SelectItem>
//                   </SelectContent>
//                 </Select>
//                 <FormMessage />
//               </FormItem>
//             )}
//           />

//           {/* Preview Section */}
//           {(watchedValues.name || watchedValues.type) && (
//             <>
//               <Separator />
//               <div className="rounded-lg border bg-muted/50 p-4">
//                 <div className="flex items-center gap-2 mb-3">
//                   <Info className="h-4 w-4 text-blue-500" />
//                   <h3 className="font-medium text-sm">Inner Section Preview</h3>
//                 </div>
//                 <div className="space-y-2">
//                   <div className="flex items-center gap-2">
//                     <Building2 className="h-4 w-4 text-muted-foreground" />
//                     <span className="font-medium">{watchedValues.name || "Inner Section Name"}</span>
//                     <span className="text-xs text-muted-foreground">({watchedValues.type})</span>
//                   </div>
//                   <div className="text-xs text-muted-foreground">Section: {selectedSection?.name || "Unknown Section"}</div>
//                 </div>
//               </div>
//             </>
//           )}

//           {/* Action Buttons */}
//           <div className="flex flex-col-reverse sm:flex-row gap-3 justify-end pt-4">
//             <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading} className="w-full sm:w-auto">
//               Cancel
//             </Button>
//             <Button type="submit" disabled={isLoading || !isDirty || !isValid || isDuplicateName} className="w-full sm:w-auto">
//               {isLoading ? (
//                 <div className="flex items-center gap-2">
//                   <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
//                   Processing...
//                 </div>
//               ) : (
//                 <div className="flex items-center gap-2">
//                   <Building2 className="h-4 w-4" />
//                   {innerSection ? "Update Inner Section" : "Create Inner Section"}
//                 </div>
//               )}
//             </Button>
//           </div>
//         </form>
//       </Form>
//     </div>
//   );
// }

import { sectionAPI } from "@/api/sections.api.ts";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useInventoryCRUD } from "@/hooks/useInventoryCRUD";
import { CreateInnerSectionData, InnerSection, Section } from "@/types/inventory";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Building2, Info } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { innerSectionSchema } from "./assignmentSchema";

type InnerSectionFormData = z.infer<typeof innerSectionSchema>;

interface InnerSectionFormProps {
  innerSection?: InnerSection;
  onSubmit: (data: InnerSectionFormData) => void | Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  existingInnerSectionNames?: string[];
  setShowInnerSectionForm: (show: boolean) => void;
}

export function InnerSectionForm({ innerSection, onSubmit, onCancel, isLoading = false, existingInnerSectionNames = [], setShowInnerSectionForm }: InnerSectionFormProps) {
  const [sections, setSections] = useState<Section[]>([]);
  const [loadingSections, setLoadingSections] = useState(false);

  const form = useForm<InnerSectionFormData>({
    resolver: zodResolver(innerSectionSchema),
    defaultValues: {
      sectionId: innerSection?.sectionId.toString() || "",
      name: innerSection?.name || "",
      type: innerSection?.type || "indoor"
    },
    mode: "onChange"
  });

  const { getInnerSections } = useInventoryCRUD(() => {});

  const watchedValues = form.watch();
  const isDirty = form.formState.isDirty;
  const isValid = form.formState.isValid;

  const isDuplicateName = existingInnerSectionNames.filter(name => (innerSection ? name !== innerSection.name : true)).some(name => name.toLowerCase() === watchedValues.name?.toLowerCase() && sections.find(s => s.id.toString() === watchedValues.sectionId)?.id === innerSection?.sectionId);

  // Load sections when component mounts
  useEffect(() => {
    const loadSections = async () => {
      setLoadingSections(true);
      try {
        // Replace this with your actual API call
        const response = await sectionAPI.getSections();
        setSections(response.data);
      } catch (error) {
        console.error("Failed to load sections:", error);
      } finally {
        setLoadingSections(false);
      }
    };

    loadSections();
  }, []);

  const handleSubmit = async (data: InnerSectionFormData) => {
    try {
      if (innerSection) {
        const updatedData = {
          ...innerSection,
          ...data
        };
        await onSubmit(updatedData);
      } else {
        await onSubmit(data as CreateInnerSectionData);
      }
      setShowInnerSectionForm(false);
      onCancel();
    } catch (err) {
      console.error("Operation failed:", err);
    }
  };

  useEffect(() => {
    if (innerSection) {
      form.reset({
        sectionId: innerSection.sectionId.toString(),
        name: innerSection.name,
        type: innerSection.type
      });
    }
  }, [innerSection, form]);

  const getSelectedSection = () => {
    return sections.find(s => s.id.toString() === watchedValues.sectionId?.toString());
  };

  const selectedSection = getSelectedSection();

  return (
    <div className="w-full">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {/* Section Selection */}
          <FormField
            control={form.control}
            name="sectionId"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">Target Section *</FormLabel>
                <Select
                  onValueChange={value => {
                    field.onChange(value);
                    form.trigger("sectionId");
                  }}
                  value={field.value}
                  disabled={isLoading || loadingSections}
                >
                  <FormControl>
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder={loadingSections ? "Loading sections..." : "Choose a section"} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {loadingSections ? (
                      <div className="p-2 text-sm text-muted-foreground text-center">Loading sections...</div>
                    ) : sections.length === 0 ? (
                      <div className="p-2 text-sm text-muted-foreground text-center">No sections available</div>
                    ) : (
                      sections.map(section => (
                        <SelectItem key={section.id} value={section.id.toString()}>
                          <div className="flex flex-col">
                            <span className="font-medium">{section.name}</span>
                            <span className="text-xs text-muted-foreground">{section.innerSections?.length || 0} inner section(s)</span>
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Inner Section Name */}
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">Inner Section Name *</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      placeholder="e.g., Main Indoor, Patio Outdoor"
                      className="h-10"
                      disabled={isLoading}
                      maxLength={100}
                      {...field}
                      onChange={e => {
                        field.onChange(e);
                        form.trigger("name");
                      }}
                    />
                    {isDuplicateName && watchedValues.name && <AlertCircle className="absolute right-3 top-3 h-4 w-4 text-destructive" />}
                  </div>
                </FormControl>
                <div className="flex justify-between items-center">
                  <FormMessage />
                  <span className="text-xs text-muted-foreground">{field.value?.length || 0}/100</span>
                </div>
                {isDuplicateName && watchedValues.name && (
                  <Alert variant="destructive" className="mt-2">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>A section with the name "{watchedValues.name}" already exists in this section. Please choose a different name.</AlertDescription>
                  </Alert>
                )}
              </FormItem>
            )}
          />

          {/* Type Selection */}
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">Type *</FormLabel>
                <Select
                  onValueChange={value => {
                    field.onChange(value);
                    form.trigger("type");
                  }}
                  value={field.value}
                  disabled={isLoading}
                >
                  <FormControl>
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Choose type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="indoor">Indoor</SelectItem>
                    <SelectItem value="outdoor">Outdoor</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Preview Section */}
          {(watchedValues.name || watchedValues.type) && (
            <>
              <Separator />
              <div className="rounded-lg border bg-muted/50 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Info className="h-4 w-4 text-blue-500" />
                  <h3 className="font-medium text-sm">Inner Section Preview</h3>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{watchedValues.name || "Inner Section Name"}</span>
                    <span className="text-xs text-muted-foreground">({watchedValues.type})</span>
                  </div>
                  <div className="text-xs text-muted-foreground">Section: {selectedSection?.name || "No section selected"}</div>
                </div>
              </div>
            </>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col-reverse sm:flex-row gap-3 justify-end pt-4">
            <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !isDirty || !isValid || isDuplicateName || !watchedValues.sectionId} className="w-full sm:w-auto">
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Processing...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  {innerSection ? "Update Inner Section" : "Create Inner Section"}
                </div>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
