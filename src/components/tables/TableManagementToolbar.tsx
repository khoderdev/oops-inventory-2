import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Plus, Package, Search, Filter, Grid, List } from 'lucide-react';

interface TableManagementToolbarProps {
  totalTables: number;
  availableTables: number;
  occupiedTables: number;
  sections: string[];
  selectedSection: string;
  onSectionChange: (section: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
  onCreateTable: () => void;
  onBulkCreate: () => void;
}

export const TableManagementToolbar: React.FC<TableManagementToolbarProps> = ({
  totalTables,
  availableTables,
  occupiedTables,
  sections,
  selectedSection,
  onSectionChange,
  searchQuery,
  onSearchChange,
  viewMode,
  onViewModeChange,
  onCreateTable,
  onBulkCreate
}) => {
  return (
    <div className="space-y-4">
      {/* Stats Row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold">Table Management</h2>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="flex items-center gap-1">
              <Grid className="w-3 h-3" />
              {totalTables} Total
            </Badge>
            <Badge variant="default" className="bg-green-500">
              {availableTables} Available
            </Badge>
            <Badge variant="destructive">
              {occupiedTables} Occupied
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex border rounded-md">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onViewModeChange('grid')}
              className="rounded-r-none"
            >
              <Grid className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onViewModeChange('list')}
              className="rounded-l-none"
            >
              <List className="w-4 h-4" />
            </Button>
          </div>

          {/* Create Actions */}
          <Button onClick={onCreateTable} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Create Table
          </Button>
          <Button onClick={onBulkCreate} variant="outline" className="flex items-center gap-2">
            <Package className="w-4 h-4" />
            Bulk Create
          </Button>
        </div>
      </div>

      {/* Filters Row */}
      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search tables..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Section Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <Select value={selectedSection} onValueChange={onSectionChange}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All Sections" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sections</SelectItem>
              {sections.map(section => (
                <SelectItem key={section} value={section}>
                  {section.charAt(0).toUpperCase() + section.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Status Filter */}
        <Select defaultValue="all">
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="available">Available</SelectItem>
            <SelectItem value="opened">Occupied</SelectItem>
            <SelectItem value="reserved">Reserved</SelectItem>
            <SelectItem value="cleaning">Cleaning</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};
