import React, { useState, useCallback, useMemo } from "react";
import { useSuppliersContext } from "@/context/SuppliersContext";
import { Supplier, SuppliersTableProps } from "@/types/suppliers";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, MoreHorizontal, Edit, Trash2, Eye, Search, Plus } from "lucide-react";
import { formatDate } from "@/utils/formatDate";

export const SuppliersTable: React.FC<SuppliersTableProps> = ({ onEdit, onDelete, onView, onAdd }) => {
  const { 
    filteredSuppliers, 
    loading, 
    searchTerm, 
    updateSearch, 
  } = useSuppliersContext();

  const [sortConfig, setSortConfig] = useState<{
    key: keyof Supplier;
    direction: "asc" | "desc";
  }>({ key: "name", direction: "asc" });

  // Handle sort with useCallback to prevent unnecessary re-renders
  const handleSort = useCallback((key: keyof Supplier) => {
    setSortConfig(prevConfig => ({
      key,
      direction: prevConfig.key === key && prevConfig.direction === "asc" ? "desc" : "asc"
    }));
  }, []);

  // Sort suppliers with optimized memoization
  const sortedSuppliers = useMemo(() => {
    // Early return if no suppliers or loading
    if (!filteredSuppliers || filteredSuppliers.length === 0) {
      return [];
    }

    return [...filteredSuppliers].sort((a, b) => {
      // Handle null values safely
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      // Compare values based on sort direction
      if (aValue < bValue) {
        return sortConfig.direction === "asc" ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === "asc" ? 1 : -1;
      }
      return 0;
    });
  }, [filteredSuppliers, sortConfig]);

  // Debounce search input to prevent excessive filtering
  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      // Use setTimeout to debounce search input
      const timeoutId = setTimeout(() => {
        updateSearch(value);
      }, 300);

      return () => clearTimeout(timeoutId);
    },
    [updateSearch]
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search suppliers..." defaultValue={searchTerm} onChange={handleSearchChange} className="pl-8" />
        </div>

        <div className="flex items-center gap-4">
          {onAdd && (
            <Button onClick={onAdd}>
              <Plus className="mr-2 h-4 w-4" /> Add Supplier
            </Button>
          )}
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="cursor-pointer" onClick={() => handleSort("name")}>
                Name {sortConfig.key === "name" && <ChevronDown className={`inline h-4 w-4 transition-transform ${sortConfig.direction === "desc" ? "rotate-180" : ""}`} />}
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort("contactPerson")}>
                Contact Person {sortConfig.key === "contactPerson" && <ChevronDown className={`inline h-4 w-4 transition-transform ${sortConfig.direction === "desc" ? "rotate-180" : ""}`} />}
              </TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort("createdAt")}>
                Created {sortConfig.key === "createdAt" && <ChevronDown className={`inline h-4 w-4 transition-transform ${sortConfig.direction === "desc" ? "rotate-180" : ""}`} />}
              </TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  Loading suppliers...
                </TableCell>
              </TableRow>
            ) : sortedSuppliers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  No suppliers found.
                </TableCell>
              </TableRow>
            ) : (
              // Use React.memo for the supplier row component to prevent unnecessary re-renders
              sortedSuppliers.map(supplier => <SupplierRow key={supplier.id} supplier={supplier} onView={onView} onEdit={onEdit} onDelete={onDelete} />)
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

// Memoized row component to prevent unnecessary re-renders
const SupplierRow = React.memo(({ supplier, onToggleStatus, onView, onEdit, onDelete }: { supplier: Supplier; onToggleStatus?: (supplier: Supplier) => Promise<void>; onView?: (supplier: Supplier) => void; onEdit?: (supplier: Supplier) => void; onDelete?: (supplier: Supplier) => void }) => {
  return (
    <TableRow>
      <TableCell className="font-medium">{supplier.name}</TableCell>
      <TableCell>{supplier.contactPerson || "-"}</TableCell>
      <TableCell>
        {supplier.email && <div>{supplier.email}</div>}
        {supplier.phone && <div>{supplier.phone}</div>}
      </TableCell>
      <TableCell>
        <Badge variant={supplier.isActive ? "default" : "outline"} className={onToggleStatus ? "cursor-pointer" : ""} onClick={onToggleStatus ? () => onToggleStatus(supplier) : undefined}>
          {supplier.isActive ? "Active" : "Inactive"}
        </Badge>
      </TableCell>
      <TableCell>{formatDate(supplier.createdAt, "MMM d, yyyy")}</TableCell>
      <TableCell className="text-right">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {onView && (
              <DropdownMenuItem onClick={() => onView(supplier)}>
                <Eye className="mr-2 h-4 w-4" /> View Details
              </DropdownMenuItem>
            )}
            {onEdit && (
              <DropdownMenuItem onClick={() => onEdit(supplier)}>
                <Edit className="mr-2 h-4 w-4" /> Edit
              </DropdownMenuItem>
            )}
            {onDelete && (
              <DropdownMenuItem onClick={() => onDelete(supplier)} className="text-destructive">
                <Trash2 className="mr-2 h-4 w-4" /> Delete
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
});

export default SuppliersTable;
