# Bulk Selection Toolbar Component

The `BulkSelectionToolbar` component provides a reusable solution for implementing bulk selection and actions in tables and lists throughout the application.

## Features

- Selection state management (select all, individual selection)
- Dynamic bulk action buttons (Edit, Delete, etc.)
- Confirmation dialogs for destructive actions
- Bulk edit dialog with custom form content
- Responsive design for mobile and desktop
- Flexible positioning options

## Installation

The component is already installed in the project. Import it from:

```tsx
import { BulkSelectionToolbar, BulkEditDialog } from "@/components/ui/BulkSelectionToolbar";
```

## Basic Usage

```tsx
import { useState } from "react";
import { BulkSelectionToolbar } from "@/components/ui/BulkSelectionToolbar";
import { Trash2 } from "lucide-react";

function MyTable({ items }) {
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItems(new Set(items.map(item => item.id)));
    } else {
      setSelectedItems(new Set());
    }
  };
  
  const handleItemSelect = (id: number, checked: boolean) => {
    const newSelected = new Set(selectedItems);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedItems(newSelected);
  };
  
  const handleBulkDelete = async () => {
    // Implement your bulk delete logic here
    console.log("Deleting items:", Array.from(selectedItems));
    setSelectedItems(new Set());
  };
  
  const handleClearSelection = () => {
    setSelectedItems(new Set());
  };
  
  return (
    <div>
      <BulkSelectionToolbar
        selectedItems={selectedItems}
        totalItems={items.length}
        selectionLabel="item"
        onSelectAll={handleSelectAll}
        onClearSelection={handleClearSelection}
        bulkActions={[
          {
            id: 'delete',
            label: 'Delete',
            icon: <Trash2 className="h-4 w-4" />,
            variant: 'destructive',
            onClick: handleBulkDelete,
            requiresConfirmation: true,
            confirmationTitle: 'Delete Items',
            confirmationDescription: `Are you sure you want to delete ${selectedItems.size} selected item(s)?`,
            confirmationActionText: 'Delete'
          }
        ]}
      />
      
      {/* Your table implementation */}
      <table>
        <thead>
          <tr>
            <th>
              {/* Individual row selection checkbox */}
            </th>
            <th>Name</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map(item => (
            <tr key={item.id}>
              <td>
                <input
                  type="checkbox"
                  checked={selectedItems.has(item.id)}
                  onChange={e => handleItemSelect(item.id, e.target.checked)}
                />
              </td>
              <td>{item.name}</td>
              <td>{/* Individual item actions */}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

## With Bulk Edit Dialog

```tsx
import { useState } from "react";
import { BulkSelectionToolbar } from "@/components/ui/BulkSelectionToolbar";
import { Label } from "@/components/ui/label";

function MyTableWithBulkEdit({ items }) {
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [showBulkEditDialog, setShowBulkEditDialog] = useState(false);
  const [bulkEditData, setBulkEditData] = useState({});
  const [bulkEditLoading, setBulkEditLoading] = useState(false);
  
  // Selection handlers (same as basic example)
  
  const handleBulkEditOpen = () => {
    // Initialize form with common values or defaults
    setBulkEditData({});
    setShowBulkEditDialog(true);
  };
  
  const handleBulkEditSubmit = async () => {
    try {
      setBulkEditLoading(true);
      // Implement your bulk edit logic here
      console.log("Updating items:", Array.from(selectedItems), "with data:", bulkEditData);
      
      // Close dialog and clear selection on success
      setShowBulkEditDialog(false);
      setSelectedItems(new Set());
    } catch (error) {
      console.error("Error updating items:", error);
    } finally {
      setBulkEditLoading(false);
    }
  };
  
  return (
    <div>
      <BulkSelectionToolbar
        selectedItems={selectedItems}
        totalItems={items.length}
        selectionLabel="item"
        onSelectAll={handleSelectAll}
        onClearSelection={handleClearSelection}
        bulkEditDialog={{
          isOpen: showBulkEditDialog,
          onOpen: handleBulkEditOpen,
          onClose: () => setShowBulkEditDialog(false),
          title: 'Bulk Edit Items',
          description: `Edit ${selectedItems.size} selected item(s)`,
          children: (
            <>
              {/* Your bulk edit form fields */}
              <div className="space-y-2">
                <Label>Status</Label>
                <select
                  value={bulkEditData.status || ''}
                  onChange={e => setBulkEditData(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full p-2 border rounded"
                >
                  <option value="">Select status...</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </>
          ),
          onSubmit: handleBulkEditSubmit,
          isLoading: bulkEditLoading,
          submitText: 'Update Items'
        }}
      />
      
      {/* Your table implementation */}
    </div>
  );
}
```

## Props

### BulkSelectionToolbarProps

| Prop | Type | Description | Default |
|------|------|-------------|---------|
| `selectedItems` | `Set<T>` | Set of selected item IDs | Required |
| `totalItems` | `number` | Total number of items | Required |
| `selectionLabel` | `string` | Label for selected items (e.g., "category", "material") | `"item"` |
| `onSelectAll` | `(checked: boolean) => void` | Handler for select all checkbox | Optional |
| `onClearSelection` | `() => void` | Handler to clear selection | Optional |
| `bulkActions` | `BulkAction[]` | Array of bulk action configurations | `[]` |
| `bulkEditDialog` | `object` | Configuration for bulk edit dialog | Optional |
| `className` | `string` | Additional CSS classes | `""` |
| `position` | `"top" \| "bottom" \| "inline"` | Position of the toolbar | `"top"` |
| `showSelectAll` | `boolean` | Whether to show select all checkbox | `true` |

### BulkAction

| Prop | Type | Description | Default |
|------|------|-------------|---------|
| `id` | `string` | Unique identifier for the action | Required |
| `label` | `string` | Button label | Required |
| `icon` | `React.ReactNode` | Icon component | Optional |
| `onClick` | `() => void` | Click handler | Required |
| `variant` | `"default" \| "destructive" \| "outline" \| "secondary" \| "ghost" \| "link"` | Button variant | `"default"` |
| `requiresConfirmation` | `boolean` | Whether to show confirmation dialog | `false` |
| `confirmationTitle` | `string` | Title for confirmation dialog | `"Confirm Action"` |
| `confirmationDescription` | `string` | Description for confirmation dialog | Auto-generated |
| `confirmationActionText` | `string` | Text for confirm button | `"Continue"` |

### BulkEditDialog Props

| Prop | Type | Description | Default |
|------|------|-------------|---------|
| `isOpen` | `boolean` | Whether dialog is open | Required |
| `onOpen` | `() => void` | Handler to open dialog | Required |
| `onClose` | `() => void` | Handler to close dialog | Required |
| `title` | `string` | Dialog title | Required |
| `description` | `string` | Dialog description | Required |
| `children` | `React.ReactNode` | Dialog content (form fields) | Required |
| `onSubmit` | `() => void` | Form submit handler | Required |
| `isLoading` | `boolean` | Loading state for submit button | `false` |
| `submitText` | `string` | Text for submit button | `"Update"` |
| `cancelText` | `string` | Text for cancel button | `"Cancel"` |

## Best Practices

1. **State Management**: Keep the selected items state in the parent component.
2. **Type Safety**: Use the generic type parameter for proper type safety with your item IDs.
3. **Confirmation Dialogs**: Always use confirmation dialogs for destructive actions.
4. **Responsive Design**: The component handles mobile and desktop views automatically.
5. **Clear Selection**: Always provide a way to clear selection after bulk actions.
6. **Positioning**: Use the `position` prop to place the toolbar appropriately in your layout.

## Example Integration

See `CategoryTable.tsx` for a complete example of how to integrate the BulkSelectionToolbar component with an existing table component.
