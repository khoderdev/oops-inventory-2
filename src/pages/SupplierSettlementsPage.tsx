import React, { useEffect, useState, useMemo } from 'react';
import { supplierAPI } from '@/api/supplier.api';
import { SupplierSettlement } from '@/types/supplier';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { format } from 'date-fns';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  ColumnDef,
  flexRender,
} from '@tanstack/react-table';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const columns: ColumnDef<SupplierSettlement>[] = [
  {
    accessorKey: 'id',
    header: 'ID',
  },
  {
    accessorKey: 'supplierName',
    header: 'Supplier',
  },
  {
    accessorKey: 'amount',
    header: 'Amount',
    cell: ({ row }) => `$${parseFloat(row.getValue('amount')).toFixed(2)}`,
  },
  {
    accessorKey: 'paymentMethod',
    header: 'Payment Method',
  },
  {
    accessorKey: 'paymentDate',
    header: 'Date',
    cell: ({ row }) => format(new Date(row.getValue('paymentDate')), 'PPpp'),
  },
  {
    accessorKey: 'referenceNumber',
    header: 'Reference',
  },
  {
    accessorKey: 'notes',
    header: 'Notes',
  },
];

const SupplierSettlementsPage: React.FC = () => {
  const [settlements, setSettlements] = useState<SupplierSettlement[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchSettlements = async () => {
      try {
        setLoading(true);
        // Fetch all settlements
        const response = await supplierAPI.getSettlementsPaginated();
        setSettlements(response.data.data);
      } catch (error) {
        console.error('Error fetching settlements:', error);
        toast({
          title: 'Error',
          description: 'Failed to load settlements',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchSettlements();
  }, [toast]);

  if (loading) {
    return <div>Loading settlements...</div>;
  }

  const table = useReactTable({
    data: settlements,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">All Settlements</h2>
        <div className="flex items-center space-x-2">
          <Input
            placeholder="Filter suppliers..."
            value={(table.getColumn('supplierName')?.getFilterValue() as string) ?? ''}
            onChange={(event) =>
              table.getColumn('supplierName')?.setFilterValue(event.target.value)
            }
            className="max-w-sm"
          />
          <Button variant="outline" onClick={() => window.history.back()}>
            Back
          </Button>
        </div>
      </div>
      
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        
        <div className="flex items-center justify-end space-x-2 p-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <span className="text-sm">
            Page{' '}
            <strong>
              {table.getState().pagination.pageIndex + 1} of{' '}
              {table.getPageCount()}
            </strong>
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SupplierSettlementsPage;
