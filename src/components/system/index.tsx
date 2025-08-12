import { DollarSign, Printer, Settings, Users, Shield } from "lucide-react";
import { useState } from "react";
import { useAtom } from "jotai";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Switch } from "../ui/switch";
import { Label } from "../ui/label";
import { toast } from "../ui/use-toast";
import { dataValidationEnabledWithPersistenceAtom } from "@/store/settingsStore";
import Printers from "./printers/Printers";

export default function System() {
  const [activeTab, setActiveTab] = useState("general");
  const [dataValidationEnabled, setDataValidationEnabled] = useAtom(dataValidationEnabledWithPersistenceAtom);

  const handleDataValidationToggle = (enabled: boolean) => {
    setDataValidationEnabled(enabled);
    toast({
      title: "Settings Updated",
      description: `Auto data validation ${enabled ? 'enabled' : 'disabled'}`,
      variant: "default",
      duration: 1500
    });
  };

  return (
    <>
      <div className="space-y-6 p-4">
        <h1 className="text-3xl font-bold tracking-tight">System Settings</h1>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="general" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              General
            </TabsTrigger>
            <TabsTrigger value="currencies" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Currencies
            </TabsTrigger>
            <TabsTrigger value="printers" className="flex items-center gap-2">
              <Printer className="h-4 w-4" />
              Printers
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-6">
            <div className="rounded-lg border p-6">
              <h2 className="text-xl font-semibold mb-4">General Settings</h2>
              {/* Data Validation Settings */}
              <div className="sm:w-1/2 space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Shield className="h-5 w-5 text-blue-600" />
                    <div className="space-y-1">
                      <Label htmlFor="data-validation-toggle" className="text-base font-medium">
                        Auto Data Validation
                      </Label>
                      <p className="text-sm text-muted-foreground">Automatically validate inventory data and show warnings in Menu Builder</p>
                    </div>
                  </div>
                  <Switch
                    id="data-validation-toggle"
                    checked={dataValidationEnabled}
                    onCheckedChange={handleDataValidationToggle}
                  />
                </div>

                <div className="text-xs text-muted-foreground p-2 bg-muted/50 rounded">
                  <strong>Note:</strong> When enabled, the system will automatically check for data inconsistencies in materials, stock entries, and menu items. This helps identify potential issues like unit type mismatches, missing cost data, and inventory discrepancies.
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="currencies" className="space-y-6">
            <div className="rounded-lg border p-6">
              <h2 className="text-xl font-semibold mb-4">Currency Management</h2>
              <p className="text-muted-foreground">Configure supported currencies and exchange rates.</p>
            </div>
          </TabsContent>

          <TabsContent value="printers" className="space-y-6">
            <Printers />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
