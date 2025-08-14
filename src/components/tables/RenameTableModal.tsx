import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { tablesAPI } from "@/api/tables.api";
import { Edit3, AlertTriangle, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { RenameTableModalProps } from "@/types/orders";

export const RenameTableModal: React.FC<RenameTableModalProps> = ({ isOpen, onClose, onTableRenamed, table }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    number: 0
  });
  const [hasActiveOrders, setHasActiveOrders] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (table && isOpen) {
      setForm({
        name: table.name || "",
        number: table.number
      });
      // Check if table has active orders (assuming this info is available)
      setHasActiveOrders(table.status === "opened");
      // Clear any previous error messages
      setErrorMessage("");
    }
  }, [table, isOpen]);

  const handleRename = async () => {
    if (!table) return;

    // Validation
    if (!form.name.trim() && (!form.number || form.number <= 0)) {
      toast.error("Please provide either a new name or valid number");
      return;
    }

    if (form.name.trim() === table.name && form.number === table.number) {
      toast.error("No changes detected");
      return;
    }

    setIsLoading(true);
    try {
      const updateData: { name?: string; number?: number } = {};

      if (form.name.trim() !== table.name) {
        updateData.name = form.name.trim();
      }

      if (form.number && form.number !== table.number) {
        updateData.number = form.number;
      }

      const response = await tablesAPI.renameTable(table.id.toString(), updateData);

      const { changes, table: updatedTable } = response.data;
      toast.success(`Table renamed from "${changes.oldName || "Table " + changes.oldNumber}" to "${changes.newName}"${changes.oldNumber !== changes.newNumber ? ` (${changes.oldNumber} → ${changes.newNumber})` : ""}`);

      // Pass the updated table data to parent
      onTableRenamed(updatedTable);
      onClose();
    } catch (error: any) {
      // Debug log to see the full error structure
      console.log("Full Error Object:", error);
      console.log("Error Response:", error.response);
      console.log("Error Response Data:", error.response?.data);
      
      const apiErrorMessage = error.response?.data?.message || error.response?.data || error.message || "Failed to rename table";
      console.log("Final API Error Message:", apiErrorMessage);
      
      // Handle specific error cases with friendly messages
      if (typeof apiErrorMessage === 'string' && apiErrorMessage.toLowerCase().includes("already exists")) {
        if (apiErrorMessage.toLowerCase().includes("table number")) {
          setErrorMessage(`Table number ${form.number} is already exist. Please choose a different number.`);
        } else if (apiErrorMessage.toLowerCase().includes("table name")) {
          setErrorMessage(`Table name "${form.name}" is already taken. Please choose a different name.`);
        } else {
          setErrorMessage("A table with this information already exists. Please use different details.");
        }
      } else {
        // If we can't parse the specific error, show a user-friendly message based on what we're trying to do
        if (form.number !== table.number) {
          setErrorMessage(`Table number ${form.number} might already be taken. Please try a different number.`);
        } else {
          setErrorMessage(typeof apiErrorMessage === 'string' ? apiErrorMessage : "Failed to rename table. Please try again.");
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const hasChanges = form.name !== table?.name || form.number !== table?.number;

  if (!table) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit3 className="w-5 h-5" />
            Rename Table
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current Table Info */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Current Table</span>
                <Badge variant={table.status === "opened" ? "destructive" : "secondary"}>{table.status}</Badge>
              </div>
              <div className="text-lg font-semibold">
                Table {table.number}: {table.name}
              </div>
              <div className="text-sm text-muted-foreground">
                {table.seats} seats • {table.shape} table
              </div>
            </CardContent>
          </Card>

          {/* Warning for active orders */}
          {hasActiveOrders && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>This table has active orders. Complete all orders before renaming to avoid confusion.</AlertDescription>
            </Alert>
          )}

          {/* Error Message */}
          {errorMessage && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}

          {/* Rename Form */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="table-name">Table Name</Label>
              <Input id="table-name" placeholder="Enter new table name" value={form.name} onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))} disabled={hasActiveOrders} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="table-number">Table Number</Label>
              <Input id="table-number" type="number" min="1" placeholder="Enter new table number" value={form.number || ""} onChange={e => setForm(prev => ({ ...prev, number: parseInt(e.target.value) || undefined }))} disabled={hasActiveOrders} />
            </div>
          </div>

          {/* Preview Changes */}
          {hasChanges && !hasActiveOrders && (
            <Card className="border-green-200 bg-green-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium text-green-800">Preview Changes</span>
                </div>
                <div className="text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Name:</span>
                    <span>
                      {table.name} → <strong>{form.name || table.name}</strong>
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Number:</span>
                    <span>
                      {table.number} → <strong>{form.number || table.number}</strong>
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleRename} disabled={isLoading || !hasChanges || hasActiveOrders} className="flex items-center gap-2">
            {isLoading ? (
              "Renaming..."
            ) : (
              <>
                <Edit3 className="w-4 h-4" />
                Rename Table
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
