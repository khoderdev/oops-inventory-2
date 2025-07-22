// // import { MaterialForm } from "@/components/materials/MaterialForm";
// // import { MaterialTable } from "@/components/materials/MaterialTable";
// // import { SectionForm } from "@/components/sections/SectionForm";
// // import { StockEntriesTable } from "@/components/stock/StockEntriesTable";
// // import { StockForm } from "@/components/stock/StockForm";
// // import { Button } from "@/components/ui/button";
// // import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// // import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
// // import { Input } from "@/components/ui/input";
// // import { ScrollArea } from "@/components/ui/scroll-area";
// // import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// // import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// // import { useInventoryStore } from "@/hooks/useInventoryStore";
// // import { MaterialWithStock, MenuItem } from "@/types/inventory";
// // import { formatCurrency } from "@/utils/conversionLogic";
// // import { calculateCostForQuantity, getSuggestedUnits } from "@/utils/inventoryCalculations";
// // import { Building2 } from "lucide-react";
// // import { useState } from "react";
// // import { MenuItemBuilder } from "../menu/MenuBuilder";
// // import { SectionsManagementPanel } from "../sections/SectionsManagementPanel";
// // import { TablesManagementPanel } from "../sections/TablesManagementPanel";

// // interface InventoryManagementPanelProps {
// //   onDeleteMaterial?: (id: string) => void;
// //   onDeleteStockEntry?: (id: string) => void;
// //   onCreateMenuItem?: (data: MenuItem) => void;
// //   onUpdateMenuItem?: (id: string, data: MenuItem) => void;
// //   onDeleteMenuItem?: (id: string) => void;
// //   onCreateSection?: (data: { name: string; description?: string }) => void;
// //   onUpdateSection?: (id: string, data: { name: string; description?: string }) => void;
// //   onDeleteSection?: (id: string) => void;
// // }

// // export function InventoryManagementPanel({ onDeleteMaterial, onDeleteStockEntry, onCreateMenuItem, onUpdateMenuItem, onDeleteMenuItem, onCreateSection, onUpdateSection, onDeleteSection }: InventoryManagementPanelProps = {}) {
// //   const {
// //     materialsWithStock,
// //     filteredMaterials,
// //     stockEntries,
// //     sections,
// //     innerSections,
// //     sectionAssignments,
// //     menuItems,
// //     activeTab,
// //     searchTerm,
// //     categoryFilter,
// //     lowStockFilter,
// //     setSearchTerm,
// //     setCategoryFilter,
// //     setLowStockFilter,
// //     showMaterialForm,
// //     showStockForm,
// //     showSectionForm,
// //     selectedMaterial,
// //     selectedStockEntry,
// //     selectedSection,
// //     setShowMaterialForm,
// //     setShowStockForm,
// //     setShowSectionForm,
// //     setSelectedMaterial,
// //     setSelectedStockEntry,
// //     setSelectedSection,
// //     tabLoading,
// //     handleTabChange,
// //     handleMaterialSubmit,
// //     handleStockSubmit,
// //     handleEditMaterial,
// //     handleAddStock,
// //     handleDeleteMaterial,
// //     handleCreateMenuItem,
// //     handleUpdateMenuItem,
// //     handleDeleteMenuItem,
// //     handleAddStockOperation,
// //     handleRecordWasteOperation,
// //     handleAddToSpecificEntryOperation,
// //     handleWasteFromSpecificEntryOperation,
// //     fetchTabData
// //   } = useInventoryStore();

// //   const handleSectionSubmit = async (data: { name: string; description?: string }) => {
// //     try {
// //       if (selectedSection) {
// //         // Edit mode
// //         if (onUpdateSection) {
// //           await onUpdateSection(selectedSection.id, data);
// //         }
// //       } else {
// //         // Create mode
// //         if (onCreateSection) {
// //           await onCreateSection(data);
// //         }
// //       }
// //       setShowSectionForm(false);
// //       setSelectedSection(null);
// //     } catch (error) {
// //       console.error("Failed to submit section:", error);
// //     }
// //   };

// //   const existingSectionNames = sections.map(section => section.name);

// //   const handleDataRefresh = async () => {
// //     try {
// //       await fetchTabData("sections");
// //     } catch (error) {
// //       console.error("Failed to refresh data:", error);
// //     }
// //   };

// //   return (
// //     <div className="space-y-6">
// //       {/* Main Content Tabs */}
// //       <Tabs value={activeTab} onValueChange={handleTabChange}>
// //         <TabsList>
// //           <TabsTrigger value="material" className="relative">
// //             Material
// //             {tabLoading.material}
// //           </TabsTrigger>
// //           <TabsTrigger value="stock" className="relative">
// //             Stock Entries
// //             {tabLoading.stock}
// //           </TabsTrigger>
// //           <TabsTrigger value="sections" className="relative">
// //             Sections
// //             {tabLoading.sections}
// //           </TabsTrigger>
// //           <TabsTrigger value="menu" className="relative">
// //             Menu Builder
// //             {tabLoading.menu}
// //           </TabsTrigger>
// //           <TabsTrigger value="tables" className="relative">
// //             Tables
// //             {tabLoading.tables}
// //           </TabsTrigger>
// //           <TabsTrigger value="conversions" className="relative">
// //             Unit Conversions
// //             {tabLoading.conversions}
// //           </TabsTrigger>
// //         </TabsList>

// //         <TabsContent value="material">
// //           <MaterialTable filteredMaterials={filteredMaterials} onEditMaterial={handleEditMaterial} onAddStock={handleAddStock} onDeleteMaterial={handleDeleteMaterial} />
// //         </TabsContent>

// //         <TabsContent value="stock">
// //           <StockEntriesTable />
// //         </TabsContent>

// //         <TabsContent value="sections">
// //           <SectionsManagementPanel innerSections={innerSections} sections={sections} sectionAssignments={sectionAssignments} materials={materialsWithStock} stockEntries={stockEntries} menuItems={menuItems} onDataRefresh={handleDataRefresh} />
// //         </TabsContent>

// //         <TabsContent value="menu">
// //           <MenuItemBuilder stockEntries={stockEntries} materials={filteredMaterials} sections={sections} menuItems={menuItems} onCreateMenuItem={handleCreateMenuItem} onUpdateMenuItem={handleUpdateMenuItem} onDeleteMenuItem={handleDeleteMenuItem} innerSections={[]} tables={[]} />
// //         </TabsContent>

// //         <TabsContent value="tables">
// //           <TablesManagementPanel />
// //         </TabsContent>
// //       </Tabs>

// //       {/* Forms */}
// //       {showMaterialForm && (
// //         <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
// //           <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
// //             <MaterialForm
// //               material={selectedMaterial || undefined}
// //               onSubmit={handleMaterialSubmit}
// //               onCancel={() => {
// //                 setShowMaterialForm(false);
// //                 setSelectedMaterial(null);
// //               }}
// //             />
// //           </div>
// //         </div>
// //       )}

// //       {showStockForm && (
// //         <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
// //           <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
// //             <StockForm
// //               materials={materialsWithStock}
// //               stockEntry={selectedStockEntry || undefined}
// //               selectedMaterialId={selectedMaterial?.id}
// //               onSubmit={handleStockSubmit}
// //               onAddStock={handleAddStockOperation}
// //               onRecordWaste={handleRecordWasteOperation}
// //               onAddToSpecificEntry={handleAddToSpecificEntryOperation}
// //               onWasteFromSpecificEntry={handleWasteFromSpecificEntryOperation}
// //               onCancel={() => {
// //                 setShowStockForm(false);
// //                 setSelectedMaterial(null);
// //                 setSelectedStockEntry(null);
// //               }}
// //             />
// //           </div>
// //         </div>
// //       )}

// //       {/* Section Form Dialog */}
// //       <Dialog open={showSectionForm} onOpenChange={setShowSectionForm}>
// //         <DialogContent className="max-w-4xl max-h-[90vh] p-0">
// //           <DialogHeader className="px-6 py-4 border-b">
// //             <DialogTitle className="flex items-center gap-2 text-lg">
// //               <Building2 className="h-5 w-5" />
// //               {selectedSection ? "Edit Section" : "Create New Section"}
// //             </DialogTitle>
// //             <DialogDescription>{selectedSection ? "Update the section details below" : "Create a new section to organize your inventory items"}</DialogDescription>
// //           </DialogHeader>

// //           <ScrollArea className="max-h-[calc(90vh-120px)]">
// //             <div className="px-6 py-4">
// //               <SectionForm
// //                 section={selectedSection || undefined}
// //                 onSubmit={handleSectionSubmit}
// //                 onCancel={() => {
// //                   setShowSectionForm(false);
// //                   setSelectedSection(null);
// //                 }}
// //                 existingSectionNames={existingSectionNames}
// //               />
// //             </div>
// //           </ScrollArea>
// //         </DialogContent>
// //       </Dialog>
// //     </div>
// //   );
// // }

// // // Extended ConversionResult for the calculator
// // interface CalculatorConversionResult {
// //   cost: number;
// //   steps?: string[];
// //   warning?: string;
// //   error?: string;
// // }

// // // Unit Conversion Calculator Component
// // function UnitConversionCalculator({ materials }: { materials: MaterialWithStock[] }) {
// //   const [selectedMaterial, setSelectedMaterial] = useState<MaterialWithStock | null>(null);
// //   const [quantity, setQuantity] = useState<number>(1);
// //   const [fromUnit, setFromUnit] = useState<string>("");
// //   const [toUnit, setToUnit] = useState<string>("");
// //   const [conversionResult, setConversionResult] = useState<CalculatorConversionResult | null>(null);

// //   const handleCalculate = () => {
// //     if (!selectedMaterial || !quantity || !fromUnit || !toUnit) return;

// //     try {
// //       const result = calculateCostForQuantity(selectedMaterial, quantity, fromUnit, selectedMaterial.averageCostPerBaseUnit);
// //       setConversionResult({
// //         cost: result.cost,
// //         steps: result.steps,
// //         warning: undefined
// //       });
// //     } catch (error) {
// //       console.error("Conversion error:", error);
// //       setConversionResult({
// //         cost: 0,
// //         error: "Conversion failed"
// //       });
// //     }
// //   };

// //   const suggestedUnits = selectedMaterial ? getSuggestedUnits(selectedMaterial.unitType) : [];

// //   return (
// //     <Card>
// //       <CardHeader>
// //         <CardTitle>Unit Conversion Calculator</CardTitle>
// //       </CardHeader>
// //       <CardContent className="space-y-4">
// //         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
// //           <div>
// //             <label className="block text-sm font-medium mb-2">Material</label>
// //             <Select
// //               value={selectedMaterial?.id || ""}
// //               onValueChange={value => {
// //                 const material = materials.find(m => m.id === value);
// //                 setSelectedMaterial(material || null);
// //                 setFromUnit("");
// //                 setToUnit("");
// //                 setConversionResult(null);
// //               }}
// //             >
// //               <SelectTrigger>
// //                 <SelectValue placeholder="Select material" />
// //               </SelectTrigger>
// //               <SelectContent>
// //                 {materials.map(material => (
// //                   <SelectItem key={material.id} value={material.id}>
// //                     {material.name} ({material.baseUnit})
// //                   </SelectItem>
// //                 ))}
// //               </SelectContent>
// //             </Select>
// //           </div>

// //           <div>
// //             <label className="block text-sm font-medium mb-2">Quantity</label>
// //             <Input type="number" value={quantity} onChange={e => setQuantity(Number(e.target.value))} placeholder="Enter quantity" min="0" step="0.01" />
// //           </div>

// //           <div>
// //             <label className="block text-sm font-medium mb-2">From Unit</label>
// //             <Select value={fromUnit} onValueChange={setFromUnit}>
// //               <SelectTrigger>
// //                 <SelectValue placeholder="Select from unit" />
// //               </SelectTrigger>
// //               <SelectContent>
// //                 {suggestedUnits.map(unit => (
// //                   <SelectItem key={unit} value={unit}>
// //                     {unit}
// //                   </SelectItem>
// //                 ))}
// //               </SelectContent>
// //             </Select>
// //           </div>

// //           <div>
// //             <label className="block text-sm font-medium mb-2">To Unit</label>
// //             <Select value={toUnit} onValueChange={setToUnit}>
// //               <SelectTrigger>
// //                 <SelectValue placeholder="Select to unit" />
// //               </SelectTrigger>
// //               <SelectContent>
// //                 {suggestedUnits.map(unit => (
// //                   <SelectItem key={unit} value={unit}>
// //                     {unit}
// //                   </SelectItem>
// //                 ))}
// //               </SelectContent>
// //             </Select>
// //           </div>
// //         </div>

// //         <Button onClick={handleCalculate} className="w-full">
// //           Calculate Conversion & Cost
// //         </Button>

// //         {conversionResult && (
// //           <Card>
// //             <CardHeader>
// //               <CardTitle>Conversion Result</CardTitle>
// //             </CardHeader>
// //             <CardContent>
// //               {conversionResult.error ? (
// //                 <p className="text-red-600">{conversionResult.error}</p>
// //               ) : (
// //                 <div className="space-y-2">
// //                   <p>
// //                     <strong>Total Cost:</strong> {formatCurrency(conversionResult.cost)}
// //                   </p>
// //                   {conversionResult.warning && (
// //                     <p className="text-yellow-600">
// //                       <strong>Warning:</strong> {conversionResult.warning}
// //                     </p>
// //                   )}
// //                   <div>
// //                     <strong>Calculation Steps:</strong>
// //                     <ul className="list-disc list-inside mt-1 space-y-1">
// //                       {conversionResult.steps?.map((step: string, index: number) => (
// //                         <li key={index} className="text-sm text-muted-foreground">
// //                           {step}
// //                         </li>
// //                       ))}
// //                     </ul>
// //                   </div>
// //                 </div>
// //               )}
// //             </CardContent>
// //           </Card>
// //         )}
// //       </CardContent>
// //     </Card>
// //   );
// // }

// // ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// // ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// // ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// // ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// // ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// import { MaterialForm } from "@/components/materials/MaterialForm";
// import { MaterialTable } from "@/components/materials/MaterialTable";
// import { SectionForm } from "@/components/sections/SectionForm";
// import { StockEntriesTable } from "@/components/stock/StockEntriesTable";
// import { StockForm } from "@/components/stock/StockForm";
// import { Button } from "@/components/ui/button";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
// import { Input } from "@/components/ui/input";
// import { ScrollArea } from "@/components/ui/scroll-area";
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// import { useInventoryStore } from "@/hooks/useInventoryStore";
// import { posPanelDataAtom, selectedPOSPanelTableAtom, showPOSPanelAtom } from "@/store/inventoryAtoms";
// import { InnerSection, MaterialWithStock, MenuItem, SectionAssignment, SectionWithAssignments, StockEntry, Tables } from "@/types/inventory";
// import { formatCurrency } from "@/utils/conversionLogic";
// import { calculateCostForQuantity, getSuggestedUnits } from "@/utils/inventoryCalculations";
// import { useAtom, useAtomValue } from "jotai";
// import { Building2 } from "lucide-react";
// import { useCallback, useState } from "react";
// import { MenuItemBuilder } from "../menu/MenuBuilder";
// import { POSPanel } from "../POSPanel";
// import { SectionsManagementPanel } from "../sections/SectionsManagementPanel";
// import { TablesManagementPanel } from "../sections/TablesManagementPanel";

// interface InventoryManagementPanelProps {
//   onDeleteMaterial?: (id: string) => void;
//   onDeleteStockEntry?: (id: string) => void;
//   onCreateMenuItem?: (data: MenuItem) => void;
//   onUpdateMenuItem?: (id: string, data: MenuItem) => void;
//   onDeleteMenuItem?: (id: string) => void;
//   onCreateSection?: (data: { name: string; description?: string }) => void;
//   onUpdateSection?: (id: string, data: { name: string; description?: string }) => void;
//   onDeleteSection?: (id: string) => void;
// }

// interface SelectedItem {
//   type: "material" | "stock" | "section" | "assignment" | "innerSection" | "table";
//   data: MaterialWithStock | StockEntry | SectionWithAssignments | SectionAssignment | InnerSection | Tables;
// }

// // DetailModal Component
// function DetailModal({ isOpen, onClose, selectedItem }: { isOpen: boolean; onClose: () => void; selectedItem: SelectedItem | null }) {
//   const [showPOSPanel, setShowPOSPanel] = useAtom(showPOSPanelAtom);
//   const [selectedTable, setSelectedPOSPanelTable] = useAtom(selectedPOSPanelTableAtom);
//   const posPanelData = useAtomValue(posPanelDataAtom);

//   const handleClose = useCallback(() => {
//     onClose();
//     setShowPOSPanel(false);
//     setSelectedPOSPanelTable(null);
//   }, [onClose, setShowPOSPanel, setSelectedPOSPanelTable]);

//   // Placeholder render functions for item types
//   const renderMaterialDetails = (data: MaterialWithStock) => (
//     <div>
//       <p>
//         <strong>Name:</strong> {data.name}
//       </p>
//       <p>
//         <strong>Unit Type:</strong> {data.unitType}
//       </p>
//       <p>
//         <strong>Base Unit:</strong> {data.baseUnit}
//       </p>
//     </div>
//   );

//   const renderStockDetails = (data: StockEntry) => (
//     <div>
//       <p>
//         <strong>Material ID:</strong> {data.materialId}
//       </p>
//       <p>
//         <strong>Quantity:</strong> {data.quantity}
//       </p>
//       <p>
//         <strong>Unit:</strong> {data.purchasedUnit}
//       </p>
//     </div>
//   );

//   const renderSectionDetails = (data: SectionWithAssignments) => (
//     <div>
//       <p>
//         <strong>Name:</strong> {data.name}
//       </p>
//       <p>
//         <strong>Total Value:</strong> {formatCurrency(data.totalValue)}
//       </p>
//       <p>
//         <strong>Assignments:</strong> {data.assignments.length}
//       </p>
//     </div>
//   );

//   const renderAssignmentDetails = (data: SectionAssignment) => (
//     <div>
//       <p>
//         <strong>Material:</strong> {data.material?.name || "Unknown"}
//       </p>
//       <p>
//         <strong>Quantity:</strong> {data.assignedQuantity} {data.assignedUnit}
//       </p>
//     </div>
//   );

//   const renderInnerSectionDetails = (data: InnerSection) => (
//     <div>
//       <p>
//         <strong>Name:</strong> {data.name}
//       </p>
//       <p>
//         <strong>Type:</strong> {data.type}
//       </p>
//       <p>
//         <strong>Tables:</strong> {data.tables?.length || 0}
//       </p>
//     </div>
//   );

//   const renderTableDetails = (data: Tables) => (
//     <div>
//       <p>
//         <strong>Table Number:</strong> {data.tableNumber}
//       </p>
//       <p>
//         <strong>Capacity:</strong> {data.capacity}
//       </p>
//       <p>
//         <strong>Status:</strong> {data.isReserved ? "Reserved" : "Available"}
//       </p>
//     </div>
//   );

//   return (
//     <Dialog open={isOpen} onOpenChange={handleClose}>
//       <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
//         <DialogHeader>
//           <DialogTitle>
//             {selectedItem?.type === "material" && "Material Details"}
//             {selectedItem?.type === "stock" && "Stock Entry Details"}
//             {selectedItem?.type === "section" && "Section Details"}
//             {selectedItem?.type === "assignment" && "Assignment Details"}
//             {selectedItem?.type === "innerSection" && "Inner Section Details"}
//             {selectedItem?.type === "table" && (showPOSPanel ? `POS Panel - Table ${selectedTable?.tableNumber}` : `Table Details - ${selectedTable?.tableNumber}`)}
//           </DialogTitle>
//           <DialogDescription>{selectedItem?.type === "table" && showPOSPanel ? "Manage orders for the selected table" : "View details of the selected item"}</DialogDescription>
//         </DialogHeader>
//         <div className="py-4">
//           {selectedItem?.type === "table" && showPOSPanel ? (
//             <POSPanel materials={posPanelData.materials} sectionAssignments={posPanelData.sectionAssignments} initialSectionId={posPanelData.selectedSectionId} innerSections={[]} tables={[]} />
//           ) : (
//             <>
//               {selectedItem?.type === "material" && renderMaterialDetails(selectedItem.data as MaterialWithStock)}
//               {selectedItem?.type === "stock" && renderStockDetails(selectedItem.data as StockEntry)}
//               {selectedItem?.type === "section" && renderSectionDetails(selectedItem.data as SectionWithAssignments)}
//               {selectedItem?.type === "assignment" && renderAssignmentDetails(selectedItem.data as SectionAssignment)}
//               {selectedItem?.type === "innerSection" && renderInnerSectionDetails(selectedItem.data as InnerSection)}
//               {selectedItem?.type === "table" && renderTableDetails(selectedItem.data as Tables)}
//             </>
//           )}
//         </div>
//       </DialogContent>
//     </Dialog>
//   );
// }

// interface CalculatorConversionResult {
//   cost: number;
//   steps?: string[];
//   warning?: string;
//   error?: string;
// }

// // Unit Conversion Calculator Component
// function UnitConversionCalculator({ materials }: { materials: MaterialWithStock[] }) {
//   const [selectedMaterial, setSelectedMaterial] = useState<MaterialWithStock | null>(null);
//   const [quantity, setQuantity] = useState<number>(1);
//   const [fromUnit, setFromUnit] = useState<string>("");
//   const [toUnit, setToUnit] = useState<string>("");
//   const [conversionResult, setConversionResult] = useState<CalculatorConversionResult | null>(null);

//   const handleCalculate = () => {
//     if (!selectedMaterial || !quantity || !fromUnit || !toUnit) return;

//     try {
//       const result = calculateCostForQuantity(selectedMaterial, quantity, fromUnit, selectedMaterial.averageCostPerBaseUnit);
//       setConversionResult({
//         cost: result.cost,
//         steps: result.steps,
//         warning: undefined
//       });
//     } catch (error) {
//       console.error("Conversion error:", error);
//       setConversionResult({
//         cost: 0,
//         error: "Conversion failed"
//       });
//     }
//   };

//   const suggestedUnits = selectedMaterial ? getSuggestedUnits(selectedMaterial.unitType) : [];

//   return (
//     <Card>
//       <CardHeader>
//         <CardTitle>Unit Conversion Calculator</CardTitle>
//       </CardHeader>
//       <CardContent className="space-y-4">
//         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//           <div>
//             <label className="block text-sm font-medium mb-2">Material</label>
//             <Select
//               value={selectedMaterial?.id || ""}
//               onValueChange={value => {
//                 const material = materials.find(m => m.id === value);
//                 setSelectedMaterial(material || null);
//                 setFromUnit("");
//                 setToUnit("");
//                 setConversionResult(null);
//               }}
//             >
//               <SelectTrigger>
//                 <SelectValue placeholder="Select material" />
//               </SelectTrigger>
//               <SelectContent>
//                 {materials.map(material => (
//                   <SelectItem key={material.id} value={material.id}>
//                     {material.name} ({material.baseUnit})
//                   </SelectItem>
//                 ))}
//               </SelectContent>
//             </Select>
//           </div>

//           <div>
//             <label className="block text-sm font-medium mb-2">Quantity</label>
//             <Input type="number" value={quantity} onChange={e => setQuantity(Number(e.target.value))} placeholder="Enter quantity" min="0" step="0.01" />
//           </div>

//           <div>
//             <label className="block text-sm font-medium mb-2">From Unit</label>
//             <Select value={fromUnit} onValueChange={setFromUnit}>
//               <SelectTrigger>
//                 <SelectValue placeholder="Select from unit" />
//               </SelectTrigger>
//               <SelectContent>
//                 {suggestedUnits.map(unit => (
//                   <SelectItem key={unit} value={unit}>
//                     {unit}
//                   </SelectItem>
//                 ))}
//               </SelectContent>
//             </Select>
//           </div>

//           <div>
//             <label className="block text-sm font-medium mb-2">To Unit</label>
//             <Select value={toUnit} onValueChange={setToUnit}>
//               <SelectTrigger>
//                 <SelectValue placeholder="Select to unit" />
//               </SelectTrigger>
//               <SelectContent>
//                 {suggestedUnits.map(unit => (
//                   <SelectItem key={unit} value={unit}>
//                     {unit}
//                   </SelectItem>
//                 ))}
//               </SelectContent>
//             </Select>
//           </div>
//         </div>

//         <Button onClick={handleCalculate} className="w-full">
//           Calculate Conversion & Cost
//         </Button>

//         {conversionResult && (
//           <Card>
//             <CardHeader>
//               <CardTitle>Conversion Result</CardTitle>
//             </CardHeader>
//             <CardContent>
//               {conversionResult.error ? (
//                 <p className="text-red-600">{conversionResult.error}</p>
//               ) : (
//                 <div className="space-y-2">
//                   <p>
//                     <strong>Total Cost:</strong> {formatCurrency(conversionResult.cost)}
//                   </p>
//                   {conversionResult.warning && (
//                     <p className="text-yellow-600">
//                       <strong>Warning:</strong> {conversionResult.warning}
//                     </p>
//                   )}
//                   <div>
//                     <strong>Calculation Steps:</strong>
//                     <ul className="list-disc list-inside mt-1 space-y-1">
//                       {conversionResult.steps?.map((step: string, index: number) => (
//                         <li key={index} className="text-sm text-muted-foreground">
//                           {step}
//                         </li>
//                       ))}
//                     </ul>
//                   </div>
//                 </div>
//               )}
//             </CardContent>
//           </Card>
//         )}
//       </CardContent>
//     </Card>
//   );
// }

// // Main InventoryManagementPanel Component
// export function InventoryManagementPanel({ onDeleteMaterial, onDeleteStockEntry, onCreateMenuItem, onUpdateMenuItem, onDeleteMenuItem, onCreateSection, onUpdateSection, onDeleteSection }: InventoryManagementPanelProps = {}) {
//   const {
//     materialsWithStock,
//     filteredMaterials,
//     stockEntries,
//     sections,
//     innerSections,
//     sectionAssignments,
//     menuItems,
//     activeTab,
//     searchTerm,
//     categoryFilter,
//     lowStockFilter,
//     setSearchTerm,
//     setCategoryFilter,
//     setLowStockFilter,
//     showMaterialForm,
//     showStockForm,
//     showSectionForm,
//     selectedMaterial,
//     selectedStockEntry,
//     selectedSection,
//     setShowMaterialForm,
//     setShowStockForm,
//     setShowSectionForm,
//     setSelectedMaterial,
//     setSelectedStockEntry,
//     setSelectedSection,
//     tabLoading,
//     handleTabChange,
//     handleMaterialSubmit,
//     handleStockSubmit,
//     handleEditMaterial,
//     handleAddStock,
//     handleDeleteMaterial,
//     handleCreateMenuItem,
//     handleUpdateMenuItem,
//     handleDeleteMenuItem,
//     handleAddStockOperation,
//     handleRecordWasteOperation,
//     handleAddToSpecificEntryOperation,
//     handleWasteFromSpecificEntryOperation,
//     fetchTabData
//   } = useInventoryStore();

//   const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
//   const [selectedItem, setSelectedItem] = useState<SelectedItem | null>(null);
//   const [showInnerSectionForm, setShowInnerSectionForm] = useState(false);
//   const [showTableForm, setShowTableForm] = useState(false);
//   const [showAssignmentForm, setShowAssignmentForm] = useState(false);
//   const [editingInnerSection, setEditingInnerSection] = useState<InnerSection | undefined>(undefined);
//   const [editingTable, setEditingTable] = useState<Tables | undefined>(undefined);
//   const [editingAssignment, setEditingAssignment] = useState<SectionAssignment | undefined>(undefined);
//   const [selectedSectionId, setSelectedSectionId] = useState("");
//   const [selectedInnerSectionId, setSelectedInnerSectionId] = useState("");

//   const handleSectionSubmit = async (data: { name: string; description?: string }) => {
//     try {
//       if (selectedSection) {
//         if (onUpdateSection) {
//           await onUpdateSection(selectedSection.id, data);
//         }
//       } else {
//         if (onCreateSection) {
//           await onCreateSection(data);
//         }
//       }
//       setShowSectionForm(false);
//       setSelectedSection(null);
//     } catch (error) {
//       console.error("Failed to submit section:", error);
//     }
//   };

//   const handleDeleteSection = async (sectionId: string) => {
//     try {
//       if (onDeleteSection) {
//         await onDeleteSection(sectionId);
//       }
//       await fetchTabData("sections");
//     } catch (error) {
//       console.error("Failed to delete section:", error);
//     }
//   };

//   // Placeholder handlers for inner sections, tables, and assignments
//   const handleDeleteInnerSection = async (innerSectionId: string) => {
//     console.log("Delete inner section:", innerSectionId);
//     // Implement deletion logic
//   };

//   const handleDeleteTable = async (tableId: string) => {
//     console.log("Delete table:", tableId);
//     // Implement deletion logic
//   };

//   const handleDeleteAssignment = async (assignmentId: string) => {
//     console.log("Delete assignment:", assignmentId);
//     // Implement deletion logic
//   };

//   const existingSectionNames = sections.map(section => section.name);

//   const handleDataRefresh = async () => {
//     try {
//       await fetchTabData("sections");
//     } catch (error) {
//       console.error("Failed to refresh data:", error);
//     }
//   };

//   // Compute sectionsWithAssignments
//   const sectionsWithAssignments = sections.map(section => ({
//     ...section,
//     assignments: sectionAssignments.filter(assignment => assignment.sectionId === section.id),
//     innerSections: innerSections
//       .filter(is => is.sectionId === section.id)
//       .map(is => ({
//         ...is,
//         tables: is.tables || []
//       })),
//     totalValue: sectionAssignments
//       .filter(assignment => assignment.sectionId === section.id)
//       .reduce((total, assignment) => {
//         const cost = assignment.stockEntry?.costPerPurchasedUnit || 0;
//         const quantity = assignment.assignedQuantity || 0;
//         return total + cost * quantity;
//       }, 0)
//   }));

//   return (
//     <div className="space-y-6">
//       {/* Detail Modal */}
//       <DetailModal isOpen={isDetailModalOpen} onClose={() => setIsDetailModalOpen(false)} selectedItem={selectedItem} />

//       {/* Main Content Tabs */}
//       <Tabs value={activeTab} onValueChange={handleTabChange}>
//         <TabsList>
//           <TabsTrigger value="material" className="relative">
//             Material
//             {tabLoading.material}
//           </TabsTrigger>
//           <TabsTrigger value="stock" className="relative">
//             Stock Entries
//             {tabLoading.stock}
//           </TabsTrigger>
//           <TabsTrigger value="sections" className="relative">
//             Sections
//             {tabLoading.sections}
//           </TabsTrigger>
//           <TabsTrigger value="menu" className="relative">
//             Menu Builder
//             {tabLoading.menu}
//           </TabsTrigger>
//           <TabsTrigger value="tables" className="relative">
//             Tables
//             {tabLoading.tables}
//           </TabsTrigger>
//           <TabsTrigger value="conversions" className="relative">
//             Unit Conversions
//             {tabLoading.conversions}
//           </TabsTrigger>
//         </TabsList>

//         <TabsContent value="material">
//           <MaterialTable filteredMaterials={filteredMaterials} onEditMaterial={handleEditMaterial} onAddStock={handleAddStock} onDeleteMaterial={handleDeleteMaterial} />
//         </TabsContent>

//         <TabsContent value="stock">
//           <StockEntriesTable />
//         </TabsContent>

//         <TabsContent value="sections">
//           <SectionsManagementPanel innerSections={innerSections} sections={sections} sectionAssignments={sectionAssignments} materials={materialsWithStock} stockEntries={stockEntries} menuItems={menuItems} onDataRefresh={handleDataRefresh} />
//         </TabsContent>

//         <TabsContent value="menu">
//           <MenuItemBuilder
//             stockEntries={stockEntries}
//             materials={filteredMaterials}
//             sections={sections}
//             menuItems={menuItems}
//             onCreateMenuItem={handleCreateMenuItem}
//             onUpdateMenuItem={handleUpdateMenuItem}
//             onDeleteMenuItem={handleDeleteMenuItem}
//             innerSections={innerSections}
//             tables={[]} // Update if tables are available
//           />
//         </TabsContent>

//         <TabsContent value="tables">
//           <TablesManagementPanel sections={sections} innerSections={innerSections} setSelectedItem={setSelectedItem} setIsDetailModalOpen={setIsDetailModalOpen} />
//         </TabsContent>

//         <TabsContent value="conversions">
//           <UnitConversionCalculator materials={materialsWithStock} />
//         </TabsContent>
//       </Tabs>

//       {/* Forms */}
//       {showMaterialForm && (
//         <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
//           <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
//             <MaterialForm
//               material={selectedMaterial || undefined}
//               onSubmit={handleMaterialSubmit}
//               onCancel={() => {
//                 setShowMaterialForm(false);
//                 setSelectedMaterial(null);
//               }}
//             />
//           </div>
//         </div>
//       )}

//       {showStockForm && (
//         <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
//           <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
//             <StockForm
//               materials={materialsWithStock}
//               stockEntry={selectedStockEntry || undefined}
//               selectedMaterialId={selectedMaterial?.id}
//               onSubmit={handleStockSubmit}
//               onAddStock={handleAddStockOperation}
//               onRecordWaste={handleRecordWasteOperation}
//               onAddToSpecificEntry={handleAddToSpecificEntryOperation}
//               onWasteFromSpecificEntry={handleWasteFromSpecificEntryOperation}
//               onCancel={() => {
//                 setShowStockForm(false);
//                 setSelectedMaterial(null);
//                 setSelectedStockEntry(null);
//               }}
//             />
//           </div>
//         </div>
//       )}

//       {/* Section Form Dialog */}
//       <Dialog open={showSectionForm} onOpenChange={setShowSectionForm}>
//         <DialogContent className="max-w-4xl max-h-[90vh] p-0">
//           <DialogHeader className="px-6 py-4 border-b">
//             <DialogTitle className="flex items-center gap-2 text-lg">
//               <Building2 className="h-5 w-5" />
//               {selectedSection ? "Edit Section" : "Create New Section"}
//             </DialogTitle>
//             <DialogDescription>{selectedSection ? "Update the section details below" : "Create a new section to organize your inventory items"}</DialogDescription>
//           </DialogHeader>
//           <ScrollArea className="max-h-[calc(90vh-120px)]">
//             <div className="px-6 py-4">
//               <SectionForm
//                 section={selectedSection || undefined}
//                 onSubmit={handleSectionSubmit}
//                 onCancel={() => {
//                   setShowSectionForm(false);
//                   setSelectedSection(null);
//                 }}
//                 existingSectionNames={existingSectionNames}
//               />
//             </div>
//           </ScrollArea>
//         </DialogContent>
//       </Dialog>

//       {/* Placeholder for InnerSectionForm, TableForm, and AssignmentForm */}
//       {showInnerSectionForm && (
//         <Dialog open={showInnerSectionForm} onOpenChange={setShowInnerSectionForm}>
//           <DialogContent>
//             <DialogHeader>
//               <DialogTitle>{editingInnerSection ? "Edit Inner Section" : "Create Inner Section"}</DialogTitle>
//             </DialogHeader>
//             <div>Placeholder InnerSectionForm</div>
//           </DialogContent>
//         </Dialog>
//       )}

//       {showTableForm && (
//         <Dialog open={showTableForm} onOpenChange={setShowTableForm}>
//           <DialogContent>
//             <DialogHeader>
//               <DialogTitle>{editingTable ? "Edit Table" : "Create Table"}</DialogTitle>
//             </DialogHeader>
//             <div>Placeholder TableForm</div>
//           </DialogContent>
//         </Dialog>
//       )}

//       {showAssignmentForm && (
//         <Dialog open={showAssignmentForm} onOpenChange={setShowAssignmentForm}>
//           <DialogContent>
//             <DialogHeader>
//               <DialogTitle>{editingAssignment ? "Edit Assignment" : "Create Assignment"}</DialogTitle>
//             </DialogHeader>
//             <div>Placeholder AssignmentForm</div>
//           </DialogContent>
//         </Dialog>
//       )}
//     </div>
//   );
// }

// ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

import { MaterialForm } from "@/components/materials/MaterialForm";
import { MaterialTable } from "@/components/materials/MaterialTable";
import { SectionForm } from "@/components/sections/SectionForm";
import { StockEntriesTable } from "@/components/stock/StockEntriesTable";
import { StockForm } from "@/components/stock/StockForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useInventoryStore } from "@/hooks/useInventoryStore";
import { posPanelDataAtom, selectedPOSPanelTableAtom, showPOSPanelAtom } from "@/store/inventoryAtoms";
import { InnerSection, MaterialWithStock, MenuItem, SectionAssignment, SectionWithAssignments, StockEntry, Tables } from "@/types/inventory";
import { formatCurrency } from "@/utils/conversionLogic";
import { calculateCostForQuantity, getSuggestedUnits } from "@/utils/inventoryCalculations";
import { useAtom, useAtomValue } from "jotai";
import { Building2 } from "lucide-react";
import { useCallback, useState } from "react";
import { MenuItemBuilder } from "../menu/MenuBuilder";
import { POSPanel } from "../POSPanel";
import { SectionsManagementPanel } from "../sections/SectionsManagementPanel";
import { TablesManagementPanel } from "../sections/TablesManagementPanel";

interface InventoryManagementPanelProps {
  onDeleteMaterial?: (id: string) => void;
  onDeleteStockEntry?: (id: string) => void;
  onCreateMenuItem?: (data: MenuItem) => void;
  onUpdateMenuItem?: (id: string, data: MenuItem) => void;
  onDeleteMenuItem?: (id: string) => void;
  onCreateSection?: (data: { name: string; description?: string }) => void;
  onUpdateSection?: (id: string, data: { name: string; description?: string }) => void;
  onDeleteSection?: (id: string) => void;
}

interface SelectedItem {
  type: "material" | "stock" | "section" | "assignment" | "innerSection" | "table";
  data: MaterialWithStock | StockEntry | SectionWithAssignments | SectionAssignment | InnerSection | Tables;
}

// DetailModal Component
function DetailModal({ isOpen, onClose, selectedItem }: { isOpen: boolean; onClose: () => void; selectedItem: SelectedItem | null }) {
  const [showPOSPanel, setShowPOSPanel] = useAtom(showPOSPanelAtom);
  const [selectedTable, setSelectedPOSPanelTable] = useAtom(selectedPOSPanelTableAtom);
  const posPanelData = useAtomValue(posPanelDataAtom);
  const { innerSections, materialsWithStock, sectionAssignments } = useInventoryStore();

  const handleClose = useCallback(() => {
    onClose();
    setShowPOSPanel(false);
    setSelectedPOSPanelTable(null);
  }, [onClose, setShowPOSPanel, setSelectedPOSPanelTable]);

  const renderMaterialDetails = (data: MaterialWithStock) => (
    <div>
      <p>
        <strong>Name:</strong> {data.name}
      </p>
      <p>
        <strong>Unit Type:</strong> {data.unitType}
      </p>
      <p>
        <strong>Base Unit:</strong> {data.baseUnit}
      </p>
    </div>
  );

  const renderStockDetails = (data: StockEntry) => (
    <div>
      <p>
        <strong>Material ID:</strong> {data.materialId}
      </p>
      <p>
        <strong>Quantity:</strong> {data.quantity}
      </p>
      <p>
        <strong>Unit:</strong> {data.purchasedUnit}
      </p>
    </div>
  );

  const renderSectionDetails = (data: SectionWithAssignments) => (
    <div>
      <p>
        <strong>Name:</strong> {data.name}
      </p>
      <p>
        <strong>Total Value:</strong> {formatCurrency(data.totalValue)}
      </p>
      <p>
        <strong>Assignments:</strong> {data.assignments.length}
      </p>
    </div>
  );

  const renderAssignmentDetails = (data: SectionAssignment) => (
    <div>
      <p>
        <strong>Material:</strong> {data.material?.name || "Unknown"}
      </p>
      <p>
        <strong>Quantity:</strong> {data.assignedQuantity} {data.assignedUnit}
      </p>
    </div>
  );

  const renderInnerSectionDetails = (data: InnerSection) => (
    <div>
      <p>
        <strong>Name:</strong> {data.name}
      </p>
      <p>
        <strong>Type:</strong> {data.type}
      </p>
      <p>
        <strong>Tables:</strong> {data.tables?.length || 0}
      </p>
    </div>
  );

  const renderTableDetails = (data: Tables) => (
    <div>
      <p>
        <strong>Table Number:</strong> {data.tableNumber}
      </p>
      <p>
        <strong>Capacity:</strong> {data.capacity}
      </p>
      <p>
        <strong>Status:</strong> {data.isReserved ? "Reserved" : "Available"}
      </p>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {selectedItem?.type === "material" && "Material Details"}
            {selectedItem?.type === "stock" && "Stock Entry Details"}
            {selectedItem?.type === "section" && "Section Details"}
            {selectedItem?.type === "assignment" && "Assignment Details"}
            {selectedItem?.type === "innerSection" && "Inner Section Details"}
            {selectedItem?.type === "table" && (showPOSPanel ? `POS Panel - Table ${selectedTable?.tableNumber}` : `Table Details - ${selectedTable?.tableNumber}`)}
          </DialogTitle>
          <DialogDescription>{selectedItem?.type === "table" && showPOSPanel ? "Manage orders for the selected table" : "View details of the selected item"}</DialogDescription>
        </DialogHeader>
        <div className="py-4">
          {selectedItem?.type === "table" && showPOSPanel ? (
            <POSPanel materials={materialsWithStock} sectionAssignments={sectionAssignments} initialSectionId={posPanelData.selectedSectionId} innerSections={innerSections} tables={innerSections.flatMap(is => is.tables || [])} />
          ) : (
            <>
              {selectedItem?.type === "material" && renderMaterialDetails(selectedItem.data as MaterialWithStock)}
              {selectedItem?.type === "stock" && renderStockDetails(selectedItem.data as StockEntry)}
              {selectedItem?.type === "section" && renderSectionDetails(selectedItem.data as SectionWithAssignments)}
              {selectedItem?.type === "assignment" && renderAssignmentDetails(selectedItem.data as SectionAssignment)}
              {selectedItem?.type === "innerSection" && renderInnerSectionDetails(selectedItem.data as InnerSection)}
              {selectedItem?.type === "table" && renderTableDetails(selectedItem.data as Tables)}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface CalculatorConversionResult {
  cost: number;
  steps?: string[];
  warning?: string;
  error?: string;
}

function UnitConversionCalculator({ materials }: { materials: MaterialWithStock[] }) {
  const [selectedMaterial, setSelectedMaterial] = useState<MaterialWithStock | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [fromUnit, setFromUnit] = useState<string>("");
  const [toUnit, setToUnit] = useState<string>("");
  const [conversionResult, setConversionResult] = useState<CalculatorConversionResult | null>(null);

  const handleCalculate = () => {
    if (!selectedMaterial || !quantity || !fromUnit || !toUnit) return;

    try {
      const result = calculateCostForQuantity(selectedMaterial, quantity, fromUnit, selectedMaterial.averageCostPerBaseUnit);
      setConversionResult({
        cost: result.cost,
        steps: result.steps,
        warning: undefined
      });
    } catch (error) {
      console.error("Conversion error:", error);
      setConversionResult({
        cost: 0,
        error: "Conversion failed"
      });
    }
  };

  const suggestedUnits = selectedMaterial ? getSuggestedUnits(selectedMaterial.unitType) : [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Unit Conversion Calculator</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Material</label>
            <Select
              value={selectedMaterial?.id || ""}
              onValueChange={value => {
                const material = materials.find(m => m.id === value);
                setSelectedMaterial(material || null);
                setFromUnit("");
                setToUnit("");
                setConversionResult(null);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select material" />
              </SelectTrigger>
              <SelectContent>
                {materials.map(material => (
                  <SelectItem key={material.id} value={material.id}>
                    {material.name} ({material.baseUnit})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Quantity</label>
            <Input type="number" value={quantity} onChange={e => setQuantity(Number(e.target.value))} placeholder="Enter quantity" min="0" step="0.01" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">From Unit</label>
            <Select value={fromUnit} onValueChange={setFromUnit}>
              <SelectTrigger>
                <SelectValue placeholder="Select from unit" />
              </SelectTrigger>
              <SelectContent>
                {suggestedUnits.map(unit => (
                  <SelectItem key={unit} value={unit}>
                    {unit}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">To Unit</label>
            <Select value={toUnit} onValueChange={setToUnit}>
              <SelectTrigger>
                <SelectValue placeholder="Select to unit" />
              </SelectTrigger>
              <SelectContent>
                {suggestedUnits.map(unit => (
                  <SelectItem key={unit} value={unit}>
                    {unit}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <Button onClick={handleCalculate} className="w-full">
          Calculate Conversion & Cost
        </Button>
        {conversionResult && (
          <Card>
            <CardHeader>
              <CardTitle>Conversion Result</CardTitle>
            </CardHeader>
            <CardContent>
              {conversionResult.error ? (
                <p className="text-red-600">{conversionResult.error}</p>
              ) : (
                <div className="space-y-2">
                  <p>
                    <strong>Total Cost:</strong> {formatCurrency(conversionResult.cost)}
                  </p>
                  {conversionResult.warning && (
                    <p className="text-yellow-600">
                      <strong>Warning:</strong> {conversionResult.warning}
                    </p>
                  )}
                  <div>
                    <strong>Calculation Steps:</strong>
                    <ul className="list-disc list-inside mt-1 space-y-1">
                      {conversionResult.steps?.map((step: string, index: number) => (
                        <li key={index} className="text-sm text-muted-foreground">
                          {step}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
}

export function InventoryManagementPanel({ onDeleteMaterial, onDeleteStockEntry, onCreateMenuItem, onUpdateMenuItem, onDeleteMenuItem, onCreateSection, onUpdateSection, onDeleteSection }: InventoryManagementPanelProps = {}) {
  const {
    materialsWithStock,
    filteredMaterials,
    stockEntries,
    sections,
    innerSections,
    sectionAssignments,
    menuItems,
    tables,
    activeTab,
    searchTerm,
    categoryFilter,
    lowStockFilter,
    setSearchTerm,
    setCategoryFilter,
    setLowStockFilter,
    showMaterialForm,
    showStockForm,
    showSectionForm,
    selectedMaterial,
    selectedStockEntry,
    selectedSection,
    setShowMaterialForm,
    setShowStockForm,
    setShowSectionForm,
    setSelectedMaterial,
    setSelectedStockEntry,
    setSelectedSection,
    tabLoading,
    handleTabChange,
    handleMaterialSubmit,
    handleStockSubmit,
    handleEditMaterial,
    handleAddStock,
    handleDeleteMaterial,
    handleCreateMenuItem,
    handleUpdateMenuItem,
    handleDeleteMenuItem,
    handleAddStockOperation,
    handleRecordWasteOperation,
    handleAddToSpecificEntryOperation,
    handleWasteFromSpecificEntryOperation,
    fetchTabData
  } = useInventoryStore();

  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<SelectedItem | null>(null);

  const handleSectionSubmit = async (data: { name: string; description?: string }) => {
    try {
      if (selectedSection) {
        if (onUpdateSection) {
          await onUpdateSection(selectedSection.id, data);
        }
      } else {
        if (onCreateSection) {
          await onCreateSection(data);
        }
      }
      setShowSectionForm(false);
      setSelectedSection(null);
    } catch (error) {
      console.error("Failed to submit section:", error);
    }
  };

  const handleDeleteSection = async (sectionId: string) => {
    try {
      if (onDeleteSection) {
        await onDeleteSection(sectionId);
      }
      await fetchTabData("sections");
    } catch (error) {
      console.error("Failed to delete section:", error);
    }
  };

  const handleDataRefresh = async () => {
    try {
      await fetchTabData("sections");
    } catch (error) {
      console.error("Failed to refresh data:", error);
    }
  };

  const sectionsWithAssignments = sections.map(section => ({
    ...section,
    assignments: sectionAssignments.filter(assignment => assignment.sectionId === section.id),
    innerSections: innerSections.filter(is => is.sectionId === section.id),
    totalValue: sectionAssignments
      .filter(assignment => assignment.sectionId === section.id)
      .reduce((total, assignment) => {
        const cost = assignment.stockEntry?.costPerPurchasedUnit || 0;
        const quantity = assignment.assignedQuantity || 0;
        return total + cost * quantity;
      }, 0)
  }));

  return (
    <div className="space-y-6">
      <DetailModal isOpen={isDetailModalOpen} onClose={() => setIsDetailModalOpen(false)} selectedItem={selectedItem} />
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList>
          <TabsTrigger value="material" className="relative">
            Material
            {tabLoading.material && <span className="ml-2">...</span>}
          </TabsTrigger>
          <TabsTrigger value="stock" className="relative">
            Stock Entries
            {tabLoading.stock && <span className="ml-2">...</span>}
          </TabsTrigger>
          <TabsTrigger value="sections" className="relative">
            Sections
            {tabLoading.sections && <span className="ml-2">...</span>}
          </TabsTrigger>
          <TabsTrigger value="menu" className="relative">
            Menu Builder
            {tabLoading.menu && <span className="ml-2">...</span>}
          </TabsTrigger>
          <TabsTrigger value="tables" className="relative">
            Tables
            {tabLoading.tables && <span className="ml-2">...</span>}
          </TabsTrigger>
          <TabsTrigger value="conversions" className="relative">
            Unit Conversions
            {tabLoading.conversions && <span className="ml-2">...</span>}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="material">
          <MaterialTable filteredMaterials={filteredMaterials} onEditMaterial={handleEditMaterial} onAddStock={handleAddStock} onDeleteMaterial={handleDeleteMaterial} />
        </TabsContent>
        <TabsContent value="stock">
          <StockEntriesTable />
        </TabsContent>
        <TabsContent value="sections">
          <SectionsManagementPanel innerSections={innerSections} sections={sections} sectionAssignments={sectionAssignments} materials={materialsWithStock} stockEntries={stockEntries} menuItems={menuItems} onDataRefresh={handleDataRefresh} />
        </TabsContent>
        <TabsContent value="menu">
          <MenuItemBuilder stockEntries={stockEntries} materials={filteredMaterials} sections={sections} menuItems={menuItems} onCreateMenuItem={handleCreateMenuItem} onUpdateMenuItem={handleUpdateMenuItem} onDeleteMenuItem={handleDeleteMenuItem} innerSections={innerSections} tables={tables} />
        </TabsContent>
        <TabsContent value="tables">
          <TablesManagementPanel sections={sections} innerSections={innerSections} setSelectedItem={setSelectedItem} setIsDetailModalOpen={setIsDetailModalOpen} />
        </TabsContent>
        <TabsContent value="conversions">
          <UnitConversionCalculator materials={materialsWithStock} />
        </TabsContent>
      </Tabs>
      {showMaterialForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <MaterialForm
              material={selectedMaterial || undefined}
              onSubmit={handleMaterialSubmit}
              onCancel={() => {
                setShowMaterialForm(false);
                setSelectedMaterial(null);
              }}
            />
          </div>
        </div>
      )}
      {showStockForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <StockForm
              materials={materialsWithStock}
              stockEntry={selectedStockEntry || undefined}
              selectedMaterialId={selectedMaterial?.id}
              onSubmit={handleStockSubmit}
              onAddStock={handleAddStockOperation}
              onRecordWaste={handleRecordWasteOperation}
              onAddToSpecificEntry={handleAddToSpecificEntryOperation}
              onWasteFromSpecificEntry={handleWasteFromSpecificEntryOperation}
              onCancel={() => {
                setShowStockForm(false);
                setSelectedMaterial(null);
                setSelectedStockEntry(null);
              }}
            />
          </div>
        </div>
      )}
      <Dialog open={showSectionForm} onOpenChange={setShowSectionForm}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0">
          <DialogHeader className="px-6 py-4 border-b">
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Building2 className="h-5 w-5" />
              {selectedSection ? "Edit Section" : "Create New Section"}
            </DialogTitle>
            <DialogDescription>{selectedSection ? "Update the section details below" : "Create a new section to organize your inventory items"}</DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[calc(90vh-120px)]">
            <div className="px-6 py-4">
              <SectionForm
                section={selectedSection || undefined}
                onSubmit={handleSectionSubmit}
                onCancel={() => {
                  setShowSectionForm(false);
                  setSelectedSection(null);
                }}
                existingSectionNames={sections.map(section => section.name)}
              />
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
