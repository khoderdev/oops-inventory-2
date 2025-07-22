import { Button } from "@/components/ui/button";
import { TableBody, TableCell, TableHead, TableHeader, TableRow, Table as UITable } from "@/components/ui/table";
import { InnerSection, Tables } from "@/types/inventory";
import { Pencil, Trash2 } from "lucide-react";

interface TablesTableProps {
  tables: Tables[];
  innerSections: InnerSection[];
  setSelectedItem: (item: { type: string; data: Tables }) => void;
  setIsDetailModalOpen: (open: boolean) => void;
  setEditingTable: (table: Tables | undefined) => void;
  setShowTableForm: (show: boolean) => void;
  handleDeleteTable: (tableId: string) => Promise<void>;
  setSelectedInnerSectionId: (innerSectionId: string) => void;
}

export function TablesTable({ tables, innerSections, setSelectedItem, setIsDetailModalOpen, setEditingTable, setShowTableForm, handleDeleteTable, setSelectedInnerSectionId }: TablesTableProps) {
  const handleEditTable = (table: Tables) => {
    setEditingTable(table);
    setSelectedInnerSectionId(table.innerSectionId);
    setShowTableForm(true);
  };

  const handleSelectTable = (table: Tables) => {
    setSelectedItem({ type: "table", data: table });
    setIsDetailModalOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Tables</h2>
        <Button
          onClick={() => {
            setEditingTable(undefined);
            setShowTableForm(true);
          }}
          className="bg-blue-600 hover:bg-blue-700"
        >
          Add Table
        </Button>
      </div>
      <UITable>
        <TableHeader>
          <TableRow>
            <TableHead>Table Number</TableHead>
            <TableHead>Capacity</TableHead>
            <TableHead>Occupancy</TableHead>
            <TableHead>Parent Inner Section</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tables.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-gray-500">
                No tables available
              </TableCell>
            </TableRow>
          ) : (
            tables.map(table => {
              const parentInnerSection = innerSections.find(is => is.id === table.innerSectionId);
              return (
                <TableRow key={table.id} onClick={() => handleSelectTable(table)} className="cursor-pointer hover:bg-gray-50">
                  <TableCell>{table.tableNumber}</TableCell>
                  <TableCell>{table.capacity}</TableCell>
                  <TableCell>{table.isReserved ? "Reserved" : "Available"}</TableCell>
                  <TableCell>{parentInnerSection?.name || "Unknown"}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={e => {
                          e.stopPropagation();
                          handleEditTable(table);
                        }}
                        title="Edit Table"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={e => {
                          e.stopPropagation();
                          handleDeleteTable(table.id);
                        }}
                        title="Delete Table"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </UITable>
    </div>
  );
}
