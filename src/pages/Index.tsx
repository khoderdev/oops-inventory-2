import { posAPI } from "@/api/pos.api";
import { salesAPI } from "@/api/sales.api.ts";
import { InventoryDashboard } from "@/components/InventoryDashboard";
import { PackageCalculator } from "@/components/PackageCalculator";
import { POSScreen } from "@/components/POSScreen";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UnitConverter } from "@/components/UnitConverter";
import { Material, SaleRecord, Section, SectionAssignment, SoldItem, StockEntry } from "@/types/inventory";
import { Calculator, Package, Warehouse } from "lucide-react";
import { useEffect, useState } from "react";

const Index = () => {
  const [salesHistory, setSalesHistory] = useState<SaleRecord[]>([]);
  const [assignments, setAssignments] = useState<SectionAssignment[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [stockEntries, setStockEntries] = useState<StockEntry[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [sectionsRes, materialsRes, assignmentsRes, stockEntriesRes, salesRes] = await Promise.all([posAPI.getSections(), posAPI.getMaterials(), posAPI.getAssignments(), posAPI.getStockEntries(), salesAPI.getSales()]);
        setSections(sectionsRes.data);
        setMaterials(materialsRes.data);
        setAssignments(assignmentsRes.data);
        setStockEntries(stockEntriesRes.data);
        setSalesHistory(salesRes.data);
      } catch (error) {
        console.error("Error loading POS data", error);
      }
    };

    fetchData();
  }, []);

  const handleUpdateAssignment = (assignmentId: string, newQuantity: number) => {
    setAssignments(prev => prev.map(assignment => (assignment.id === assignmentId ? { ...assignment, assignedQuantity: newQuantity } : assignment)));
  };

  const handleCompleteSale = async (soldItems: SoldItem[]) => {
    const payload: SaleRecord = {
      id: Date.now().toString(),
      saleDate: new Date().toISOString(),
      totalAmount: soldItems.reduce((sum, item) => sum + item.totalPrice, 0),
      sectionId: soldItems[0]?.sectionId || "",
      items: soldItems,
      menuItems: [], // optionally populated
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      const response = await salesAPI.createSale(payload);
      setSalesHistory(prev => [...prev, response.data]);
    } catch (error) {
      console.error("Sale creation failed", error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-accent/20">
      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="inventory" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="pos" className="flex items-center gap-2">
              <Calculator className="h-4 w-4" />
              POS
            </TabsTrigger>
            <TabsTrigger value="converter" className="flex items-center gap-2">
              <Calculator className="h-4 w-4" />
              Unit Converter
            </TabsTrigger>
            <TabsTrigger value="packages" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Package Calculator
            </TabsTrigger>
            <TabsTrigger value="inventory" className="flex items-center gap-2">
              <Warehouse className="h-4 w-4" />
              Inventory Manager
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pos" className="space-y-6">
            <POSScreen sections={sections} assignments={assignments} materials={materials} stockEntries={stockEntries} onUpdateAssignment={handleUpdateAssignment} onCompleteSale={handleCompleteSale} />
          </TabsContent>

          <TabsContent value="converter" className="space-y-6">
            <UnitConverter />
          </TabsContent>

          <TabsContent value="packages" className="space-y-6">
            <PackageCalculator />
          </TabsContent>

          <TabsContent value="inventory" className="space-y-6">
            <InventoryDashboard />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
