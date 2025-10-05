import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { tablesAPI } from "@/api/tables.api";
import { Table } from "@/types/inventory";
import { Eye, EyeOff, Circle, Square, RectangleHorizontal, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface TablesManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTableActivated?: () => void;
}

interface ExtendedTable extends Table {
  isActive?: boolean;
}

export const InactiveTablesModal: React.FC<TablesManagementModalProps> = ({ isOpen, onClose, onTableActivated }) => {
  const [allTables, setAllTables] = useState<ExtendedTable[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [updatingTableId, setUpdatingTableId] = useState<string | null>(null);

  // Fetch all tables when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchAllTables();
    }
  }, [isOpen]);

  const fetchAllTables = async () => {
    setIsRefreshing(true);
    try {
      // Fetch all tables - ApiClient returns { data: Table[], status, message }
      const response = await tablesAPI.getTables();

      console.log("📊 Raw API response:", response);

      // ApiClient wraps the response in { data: T }
      // Backend may also wrap in { data: [...] }, so check both
      let tables: ExtendedTable[] = [];

      if (Array.isArray(response.data)) {
        // Direct array: { data: Table[] }
        tables = response.data;
        console.log("✅ Found tables in response.data:", tables.length);
      } else if (response.data && typeof response.data === "object" && "data" in response.data && Array.isArray((response.data as any).data)) {
        // Double wrapped: { data: { data: Table[] } }
        tables = (response.data as any).data;
        console.log("✅ Found tables in response.data.data:", tables.length);
      } else {
        console.warn("⚠️ Unexpected response structure:", response);
      }

      setAllTables(tables);
    } catch (error) {
      console.error("❌ Failed to fetch tables:", error);
      toast.error("Failed to load tables");
      setAllTables([]);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleToggleTableStatus = async (tableId: string, currentStatus: boolean) => {
    setUpdatingTableId(tableId);
    try {
      const newStatus = !currentStatus;
      const response = await tablesAPI.updateTable(tableId, { isActive: newStatus });

      console.log("✅ Table status updated:", { tableId, newStatus, response });

      // Update the table in the local state
      setAllTables(prev => prev.map(table => (String(table.id) === String(tableId) ? { ...table, isActive: newStatus } : table)));

      toast.success(`Table ${newStatus ? "activated" : "deactivated"} successfully`);
      onTableActivated?.();
    } catch (error) {
      console.error("❌ Failed to update table status:", error);
      toast.error("Failed to update table status");
    } finally {
      setUpdatingTableId(null);
    }
  };

  const getTableIcon = (shape: string) => {
    switch (shape) {
      case "round":
        return <Circle className="w-4 h-4" />;
      case "square":
        return <Square className="w-4 h-4" />;
      case "rectangle":
        return <RectangleHorizontal className="w-4 h-4" />;
      default:
        return <Circle className="w-4 h-4" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-hidden p-0 flex flex-col z-[10000]">
        <DialogHeader className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 sm:px-6 py-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <Eye className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500" />
              <span className="truncate">Manage Tables</span>
              <Badge variant="secondary" className="ml-2">
                {allTables.length}
              </Badge>
            </DialogTitle>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={fetchAllTables} disabled={isRefreshing} className="h-8 w-8 p-0">
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
              </Button>
              <Button variant="ghost" size="sm" onClick={onClose} className="h-6 w-6 p-0 hover:bg-red-100 rounded-md">
                <svg className="h-4 w-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4">
          {isRefreshing ? (
            <div className="flex items-center justify-center py-8">
              <div className="flex items-center gap-2 text-gray-500">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Loading tables...</span>
              </div>
            </div>
          ) : allTables.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Eye className="w-12 h-12 text-gray-500 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Tables Found</h3>
              <p className="text-gray-500 max-w-sm">No tables are available in the system.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-3">
                {allTables.map(table => (
                  <Card key={table.id} className={`border ${table.isActive ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}`}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2 text-gray-600">
                            {getTableIcon(table.shape)}
                            <span className="font-medium text-gray-900">Table {table.number}</span>
                          </div>

                          {table.name && (
                            <>
                              <Separator orientation="vertical" className="h-4" />
                              <span className="text-sm text-gray-600">{table.name}</span>
                            </>
                          )}

                          <Separator orientation="vertical" className="h-4" />
                          <Badge variant="outline" className="text-xs">
                            {table.seats} seats
                          </Badge>

                          {table.section && (
                            <Badge variant="secondary" className="text-xs">
                              {table.section}
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            <Label htmlFor={`table-${table.id}-active`} className="text-sm font-medium">
                              {table.isActive ? "Active" : "Inactive"}
                            </Label>
                            <Switch id={`table-${table.id}-active`} checked={table.isActive} onCheckedChange={() => handleToggleTableStatus(String(table.id), table.isActive)} disabled={updatingTableId === String(table.id)} />
                          </div>

                          {updatingTableId === String(table.id) && (
                            <div className="flex items-center gap-2 text-blue-600">
                              <RefreshCw className="w-4 h-4 animate-spin" />
                              <span className="text-sm">Updating...</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="sticky bottom-0 z-10 bg-white border-t border-gray-200 px-4 sm:px-6 py-4 flex-shrink-0">
          <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
