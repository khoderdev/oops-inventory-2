import { DollarSign, Printer, Settings, Users } from "lucide-react";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import Printers from "./printers/Printers";

export default function System() {
  const [activeTab, setActiveTab] = useState("general");

  return (
    <>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">System Settings</h1>
          <p className="text-muted-foreground">
            Configure system-wide settings and manage hardware devices
          </p>
        </div>

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
              <p className="text-muted-foreground">
                General system configuration options will be available here.
              </p>
            </div>
          </TabsContent>
          
          <TabsContent value="currencies" className="space-y-6">
            <div className="rounded-lg border p-6">
              <h2 className="text-xl font-semibold mb-4">Currency Management</h2>
              <p className="text-muted-foreground">
                Configure supported currencies and exchange rates.
              </p>
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
