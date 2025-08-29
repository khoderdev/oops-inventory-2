import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, MoreHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import type { Supplier } from "@/types/supplier";

export const columns: ColumnDef<Supplier>[] = [
  {
id: "name",
    accessorKey: "name",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="p-0 hover:bg-transparent"
        >
          Supplier Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => (
      <Link to={`/suppliers/${row.original.id}`} className="font-medium hover:underline">
        {row.getValue("name")}
      </Link>
    ),
  },
  {
id: "contactPerson",
    accessorKey: "contactPerson",
    header: "Contact Person",
  },
  {
id: "email",
    accessorKey: "email",
    header: "Email",
    cell: ({ row }) => row.getValue("email") || "-",
  },
  {
id: "phone",
    accessorKey: "phone",
    header: "Phone",
    cell: ({ row }) => row.getValue("phone") || "-",
  },
  {
id: "accountBalance",
    accessorKey: "accountBalance",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="p-0 hover:bg-transparent"
        >
          Balance
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("accountBalance") || "0");
      const formatted = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(amount);

      return <div className="font-medium">{formatted}</div>;
    },
  },
  {
id: "isActive",
    accessorKey: "isActive",
    header: "Status",
    cell: ({ row }) => {
      const isActive = row.getValue("isActive");
      return (
        <Badge variant={isActive ? "default" : "secondary"}>
          {isActive ? "Active" : "Inactive"}
        </Badge>
      );
    },
  },
  {
id: "updatedAt",
    accessorKey: "updatedAt",
    header: "Last Transaction",
    cell: ({ row }) => {
      const date = row.getValue("updatedAt");
      return date ? format(new Date(date as string), "MMM d, yyyy") : "-";
    },
  },
  {
    id: "actions",
    cell: ({ row }) => (
      <div className="flex justify-end">
        <Button variant="ghost" size="sm" asChild>
          <Link to={`/suppliers/${row.original.id}`}>
            <span className="sr-only">View supplier details</span>
            <MoreHorizontal className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    ),
  },
];
