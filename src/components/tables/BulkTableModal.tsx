import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { tablesAPI } from '@/api/tables.api';
import { Plus, Trash2, Copy, Circle, Square, RectangleHorizontal, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface BulkTableModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTablesCreated: () => void;
  sections: string[];
}

interface TableTemplate {
  id: string;
  name: string;
  seats: number;
  shape: 'round' | 'square' | 'rectangle';
  section: string;
  notes?: string;
}

export const BulkTableModal: React.FC<BulkTableModalProps> = ({
  isOpen,
  onClose,
  onTablesCreated,
  sections
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [globalSection, setGlobalSection] = useState('');
  const [tables, setTables] = useState<TableTemplate[]>([
    { id: '1', name: '', seats: 4, shape: 'square', section: '', notes: '' }
  ]);

  const addTable = () => {
    const newTable: TableTemplate = {
      id: Date.now().toString(),
      name: '',
      seats: 4,
      shape: 'square',
      section: globalSection,
      notes: ''
    };
    setTables(prev => [...prev, newTable]);
  };

  const removeTable = (id: string) => {
    if (tables.length > 1) {
      setTables(prev => prev.filter(table => table.id !== id));
    }
  };

  const updateTable = (id: string, updates: Partial<TableTemplate>) => {
    setTables(prev => prev.map(table => 
      table.id === id ? { ...table, ...updates } : table
    ));
  };

  const duplicateTable = (id: string) => {
    const tableToClone = tables.find(t => t.id === id);
    if (tableToClone) {
      const newTable: TableTemplate = {
        ...tableToClone,
        id: Date.now().toString(),
        name: `${tableToClone.name} Copy`
      };
      setTables(prev => [...prev, newTable]);
    }
  };

  const handleGlobalSectionChange = (section: string) => {
    setGlobalSection(section);
    // Apply to all tables that don't have a section set
    setTables(prev => prev.map(table => 
      !table.section ? { ...table, section } : table
    ));
  };

  const handleBulkCreate = async () => {
    // Validation
    const validTables = tables.filter(table => table.name.trim());
    if (validTables.length === 0) {
      toast.error('Please provide names for at least one table');
      return;
    }

    setIsLoading(true);
    try {
      const tableData = validTables.map(table => ({
        name: table.name.trim(),
        seats: table.seats,
        shape: table.shape,
        section: table.section || globalSection || 'main',
        notes: table.notes?.trim() || undefined
      }));

      const response = await tablesAPI.bulkCreateTables({
        tables: tableData,
        section: globalSection
      });

      const { created, errors, errorDetails } = response.data;
      
      if (created > 0) {
        toast.success(`Successfully created ${created} table${created > 1 ? 's' : ''}`);
      }
      
      if (errors > 0) {
        toast.error(`${errors} error${errors > 1 ? 's' : ''} occurred: ${errorDetails.join(', ')}`);
      }

      if (created > 0) {
        onTablesCreated();
        onClose();
        resetForm();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create tables');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setGlobalSection('');
    setTables([
      { id: '1', name: '', seats: 4, shape: 'square', section: '', notes: '' }
    ]);
  };

  const getShapeIcon = (shape: string) => {
    switch (shape) {
      case 'round': return <Circle className="w-4 h-4" />;
      case 'rectangle': return <RectangleHorizontal className="w-4 h-4" />;
      default: return <Square className="w-4 h-4" />;
    }
  };

  const validTableCount = tables.filter(table => table.name.trim()).length;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Bulk Create Tables
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Global Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Global Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Default Section (applies to all tables)</Label>
                <Select value={globalSection} onValueChange={handleGlobalSectionChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select default section" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.isArray(sections) && sections.map(section => (
                      <SelectItem key={section} value={section}>
                        {section.charAt(0).toUpperCase() + section.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{tables.length} table{tables.length > 1 ? 's' : ''} defined</Badge>
                  <Badge variant={validTableCount > 0 ? 'default' : 'destructive'}>
                    {validTableCount} ready to create
                  </Badge>
                </div>
                <Button onClick={addTable} variant="outline" size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Table
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Table List */}
          <div className="space-y-4">
            {tables.map((table, index) => (
              <Card key={table.id} className="relative">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium">Table {index + 1}</h4>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => duplicateTable(table.id)}
                        variant="outline"
                        size="sm"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                      {tables.length > 1 && (
                        <Button
                          onClick={() => removeTable(table.id)}
                          variant="outline"
                          size="sm"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Table Name *</Label>
                      <Input
                        placeholder="e.g., Window Table 1"
                        value={table.name}
                        onChange={(e) => updateTable(table.id, { name: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Seats</Label>
                      <Select
                        value={table.seats.toString()}
                        onValueChange={(value) => updateTable(table.id, { seats: parseInt(value) })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {[2, 4, 6, 8, 10, 12].map(num => (
                            <SelectItem key={num} value={num.toString()}>{num} seats</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div className="space-y-2">
                      <Label>Shape</Label>
                      <div className="flex gap-2">
                        {(['round', 'square', 'rectangle'] as const).map(shape => (
                          <Button
                            key={shape}
                            variant={table.shape === shape ? 'default' : 'outline'}
                            onClick={() => updateTable(table.id, { shape })}
                            size="sm"
                            className="flex items-center gap-1"
                          >
                            {getShapeIcon(shape)}
                            {shape.charAt(0).toUpperCase()}
                          </Button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Section Override</Label>
                      <Select
                        value={table.section}
                        onValueChange={(value) => updateTable(table.id, { section: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={globalSection || "Use global section"} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Use global section</SelectItem>
                          {Array.isArray(sections) && sections.map(section => (
                            <SelectItem key={section} value={section}>
                              {section.charAt(0).toUpperCase() + section.slice(1)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
                    <Label>Notes (Optional)</Label>
                    <Input
                      placeholder="Any special notes..."
                      value={table.notes || ''}
                      onChange={(e) => updateTable(table.id, { notes: e.target.value })}
                    />
                  </div>

                  {!table.name.trim() && (
                    <Alert className="mt-4">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Table name is required. This table will be skipped during creation.
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Summary */}
          {validTableCount > 0 && (
            <Card className="border-green-200 bg-green-50">
              <CardContent className="p-4">
                <h4 className="font-medium text-green-800 mb-2">Creation Summary</h4>
                <div className="text-sm text-green-700">
                  <p>• {validTableCount} table{validTableCount > 1 ? 's' : ''} will be created</p>
                  <p>• Default section: {globalSection || 'main'}</p>
                  <p>• Table numbers will be auto-assigned</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleBulkCreate}
            disabled={isLoading || validTableCount === 0}
            className="flex items-center gap-2"
          >
            {isLoading ? 'Creating...' : (
              <>
                <Plus className="w-4 h-4" />
                Create {validTableCount} Table{validTableCount > 1 ? 's' : ''}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
