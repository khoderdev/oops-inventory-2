import React from 'react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MoreVertical, Edit3, Move, Copy, Trash2, Users, MapPin, Clock } from 'lucide-react';
import { Table } from '@/types/inventory';

interface TableActionsMenuProps {
  table: Table;
  onEdit: (table: Table) => void;
  onRename: (table: Table) => void;
  onTransfer: (table: Table) => void;
  onDuplicate: (table: Table) => void;
  onDelete: (table: Table) => void;
  disabled?: boolean;
}

export const TableActionsMenu: React.FC<TableActionsMenuProps> = ({
  table,
  onEdit,
  onRename,
  onTransfer,
  onDuplicate,
  onDelete,
  disabled = false
}) => {
  const hasActiveOrder = table.status === 'opened';
  const canTransfer = hasActiveOrder && table.currentOrder;
  const canRename = !hasActiveOrder;
  const canDelete = !hasActiveOrder;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          disabled={disabled}
          className="h-8 w-8 p-0"
        >
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {/* Table Info Header */}
        <div className="px-2 py-1.5 text-sm font-medium border-b">
          <div className="flex items-center justify-between">
            <span>Table {table.number}</span>
            <Badge variant={hasActiveOrder ? 'destructive' : 'secondary'} className="text-xs">
              {table.status}
            </Badge>
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            <div className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              {table.seats} seats
            </div>
            <div className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {table.section}
            </div>
            {hasActiveOrder && table.currentOrder && (
              <div className="flex items-center gap-1 text-orange-600">
                <Clock className="w-3 h-3" />
                {table.currentOrder.itemCount} items
              </div>
            )}
          </div>
        </div>

        <DropdownMenuSeparator />

        {/* Basic Actions */}
        <DropdownMenuItem onClick={() => onEdit(table)}>
          <Edit3 className="mr-2 h-4 w-4" />
          Edit Details
        </DropdownMenuItem>

        <DropdownMenuItem 
          onClick={() => onRename(table)}
          disabled={!canRename}
        >
          <Edit3 className="mr-2 h-4 w-4" />
          Rename Table
          {!canRename && (
            <Badge variant="outline" className="ml-auto text-xs">
              Active Order
            </Badge>
          )}
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Order Actions */}
        {canTransfer && (
          <DropdownMenuItem onClick={() => onTransfer(table)}>
            <Move className="mr-2 h-4 w-4" />
            Transfer Order
            <Badge variant="secondary" className="ml-auto text-xs">
              {table.currentOrder?.itemCount} items
            </Badge>
          </DropdownMenuItem>
        )}

        {!hasActiveOrder && (
          <DropdownMenuItem onClick={() => onTransfer(table)} disabled>
            <Move className="mr-2 h-4 w-4 opacity-50" />
            Transfer Order
            <Badge variant="outline" className="ml-auto text-xs">
              No Order
            </Badge>
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />

        {/* Management Actions */}
        <DropdownMenuItem onClick={() => onDuplicate(table)}>
          <Copy className="mr-2 h-4 w-4" />
          Duplicate Table
        </DropdownMenuItem>

        <DropdownMenuItem 
          onClick={() => onDelete(table)}
          disabled={!canDelete}
          className="text-red-600 focus:text-red-600"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete Table
          {!canDelete && (
            <Badge variant="outline" className="ml-auto text-xs">
              Active Order
            </Badge>
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
