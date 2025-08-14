import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { tablesAPI } from '@/api/tables.api';
import { Circle, Square, RectangleHorizontal, Plus, Wand2 } from 'lucide-react';
import { toast } from 'sonner';

interface CreateTableModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTableCreated: () => void;
  sections: string[];
}

export const CreateTableModal: React.FC<CreateTableModalProps> = ({
  isOpen,
  onClose,
  onTableCreated,
  sections
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<'quick' | 'custom'>('quick');
  const [nextNumber, setNextNumber] = useState<number>(1);
  const [suggestedName, setSuggestedName] = useState<string>('');

  // Quick create form
  const [quickForm, setQuickForm] = useState({
    section: '',
    seats: 4,
    shape: 'square' as 'round' | 'square' | 'rectangle',
    customName: ''
  });

  // Custom create form
  const [customForm, setCustomForm] = useState({
    number: 0,
    name: '',
    seats: 4,
    shape: 'square' as 'round' | 'square' | 'rectangle',
    section: '',
    notes: ''
  });

  // Fetch next available number on open
  useEffect(() => {
    if (isOpen) {
      fetchNextNumber();
    }
  }, [isOpen]);

  const fetchNextNumber = async () => {
    try {
      const response = await tablesAPI.getNextTableNumber();
      setNextNumber(response.data.nextNumber);
      setSuggestedName(response.data.suggestedName);
      setCustomForm(prev => ({ ...prev, number: response.data.nextNumber }));
    } catch (error) {
      console.error('Failed to fetch next number:', error);
    }
  };

  const handleQuickCreate = async () => {
    setIsLoading(true);
    try {
      const response = await tablesAPI.quickCreateTable(quickForm);
      toast.success(response.data.message);
      onTableCreated();
      onClose();
      resetForms();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create table');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCustomCreate = async () => {
    setIsLoading(true);
    try {
      const response = await tablesAPI.createTable(customForm);
      toast.success('Table created successfully');
      onTableCreated();
      onClose();
      resetForms();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create table');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForms = () => {
    setQuickForm({
      section: '',
      seats: 4,
      shape: 'square',
      customName: ''
    });
    setCustomForm({
      number: nextNumber,
      name: '',
      seats: 4,
      shape: 'square',
      section: '',
      notes: ''
    });
  };

  const getShapeIcon = (shape: string) => {
    switch (shape) {
      case 'round': return <Circle className="w-4 h-4" />;
      case 'rectangle': return <RectangleHorizontal className="w-4 h-4" />;
      default: return <Square className="w-4 h-4" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Create New Table
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Mode Selection */}
          <div className="flex gap-2">
            <Button
              variant={mode === 'quick' ? 'default' : 'outline'}
              onClick={() => setMode('quick')}
              className="flex items-center gap-2"
            >
              <Wand2 className="w-4 h-4" />
              Quick Create
            </Button>
            <Button
              variant={mode === 'custom' ? 'default' : 'outline'}
              onClick={() => setMode('custom')}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Custom Create
            </Button>
          </div>

          {mode === 'quick' ? (
            <Card>
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Wand2 className="w-4 h-4 text-blue-500" />
                  <span className="font-medium">Quick Create</span>
                  <Badge variant="secondary">Auto-numbered as Table {nextNumber}</Badge>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="quick-section">Section</Label>
                    <Select
                      value={quickForm.section}
                      onValueChange={(value) => setQuickForm(prev => ({ ...prev, section: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select section" />
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

                  <div className="space-y-2">
                    <Label htmlFor="quick-seats">Seats</Label>
                    <Select
                      value={quickForm.seats.toString()}
                      onValueChange={(value) => setQuickForm(prev => ({ ...prev, seats: parseInt(value) }))}
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

                <div className="space-y-2">
                  <Label>Table Shape</Label>
                  <div className="flex gap-2">
                    {(['round', 'square', 'rectangle'] as const).map(shape => (
                      <Button
                        key={shape}
                        variant={quickForm.shape === shape ? 'default' : 'outline'}
                        onClick={() => setQuickForm(prev => ({ ...prev, shape }))}
                        className="flex items-center gap-2"
                      >
                        {getShapeIcon(shape)}
                        {shape.charAt(0).toUpperCase() + shape.slice(1)}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quick-name">Custom Name (Optional)</Label>
                  <Input
                    id="quick-name"
                    placeholder={suggestedName}
                    value={quickForm.customName}
                    onChange={(e) => setQuickForm(prev => ({ ...prev, customName: e.target.value }))}
                  />
                  <p className="text-sm text-muted-foreground">
                    Leave empty to use: {quickForm.section ? 
                      `${quickForm.section.charAt(0).toUpperCase() + quickForm.section.slice(1)} ${nextNumber}` : 
                      suggestedName}
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Plus className="w-4 h-4 text-green-500" />
                  <span className="font-medium">Custom Create</span>
                  <Badge variant="outline">Full Control</Badge>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="custom-number">Table Number</Label>
                    <Input
                      id="custom-number"
                      type="number"
                      min="1"
                      value={customForm.number}
                      onChange={(e) => setCustomForm(prev => ({ ...prev, number: parseInt(e.target.value) || 1 }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="custom-name">Table Name</Label>
                    <Input
                      id="custom-name"
                      placeholder="e.g., VIP Corner Table"
                      value={customForm.name}
                      onChange={(e) => setCustomForm(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="custom-seats">Seats</Label>
                    <Input
                      id="custom-seats"
                      type="number"
                      min="1"
                      max="20"
                      value={customForm.seats}
                      onChange={(e) => setCustomForm(prev => ({ ...prev, seats: parseInt(e.target.value) || 4 }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="custom-section">Section</Label>
                    <Select
                      value={customForm.section}
                      onValueChange={(value) => setCustomForm(prev => ({ ...prev, section: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select section" />
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
                </div>

                <div className="space-y-2">
                  <Label>Table Shape</Label>
                  <div className="flex gap-2">
                    {(['round', 'square', 'rectangle'] as const).map(shape => (
                      <Button
                        key={shape}
                        variant={customForm.shape === shape ? 'default' : 'outline'}
                        onClick={() => setCustomForm(prev => ({ ...prev, shape }))}
                        className="flex items-center gap-2"
                      >
                        {getShapeIcon(shape)}
                        {shape.charAt(0).toUpperCase() + shape.slice(1)}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="custom-notes">Notes (Optional)</Label>
                  <Textarea
                    id="custom-notes"
                    placeholder="Any special notes about this table..."
                    value={customForm.notes}
                    onChange={(e) => setCustomForm(prev => ({ ...prev, notes: e.target.value }))}
                  />
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
            onClick={mode === 'quick' ? handleQuickCreate : handleCustomCreate}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            {isLoading ? 'Creating...' : (
              <>
                <Plus className="w-4 h-4" />
                Create Table
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
