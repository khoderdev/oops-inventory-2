# Breadcrumb Navigation System

This system provides a dynamic and responsive breadcrumb navigation component that can be used across all pages and panels.

## Components Created

### 1. Breadcrumb Component (`src/components/navigation/Breadcrumb.tsx`)
A fully responsive breadcrumb component with:
- Dynamic navigation items with icons
- Hover effects and transitions
- Mobile-friendly truncation
- Accessibility support
- Click navigation

### 2. useBreadcrumb Hook (`src/hooks/useBreadcrumb.ts`)
Automatically generates breadcrumb items based on current route:
- Route-based breadcrumb generation
- Configurable route mappings
- Parent-child relationship support
- Dynamic route handling

### 3. PageLayout Component (`src/components/layout/PageLayout.tsx`)
A complete page wrapper that includes:
- Automatic breadcrumb integration
- Responsive sidebar spacing
- Page title and subtitle
- Header actions support
- Full-width option

### 4. InventoryNavigationTabs Component (`src/components/navigation/InventoryNavigationTabs.tsx`)
Specialized navigation tabs for multi-section pages:
- Three-tab layout (Materials, Stock Entries, Sections)
- Responsive design with mobile-friendly labels
- Smooth transitions and hover effects
- Content-specific tab management
- Icon-based navigation with proper spacing

## Usage Examples

### Basic Usage with PageLayout

```tsx
import PageLayout from "@/components/layout/PageLayout";

const MyPage = () => {
  return (
    <PageLayout 
      title="Page Title" 
      subtitle="Page description"
    >
      {/* Your page content */}
    </PageLayout>
  );
};
```

### With Header Actions

```tsx
import PageLayout from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/button";
import { Plus, RefreshCw } from "lucide-react";

const MyPage = () => {
  return (
    <PageLayout 
      title="Sales History" 
      subtitle="View and manage all completed sales"
      headerActions={
        <>
          <Button variant="outline" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Create New
          </Button>
        </>
      }
    >
      {/* Your page content */}
    </PageLayout>
  );
};
```

### Custom Breadcrumb

```tsx
import PageLayout from "@/components/layout/PageLayout";
import { useCustomBreadcrumb } from "@/hooks/useBreadcrumb";
import { Settings, Users } from "lucide-react";

const UserSettingsPage = () => {
  const customBreadcrumb = useCustomBreadcrumb([
    { label: "Administration", href: "/admin", icon: Settings },
    { label: "User Settings", isActive: true, icon: Users }
  ]);

  return (
    <PageLayout 
      title="User Settings" 
      customBreadcrumb={customBreadcrumb}
    >
      {/* Your page content */}
    </PageLayout>
  );
};
```

### Direct Breadcrumb Usage (without PageLayout)

```tsx
import Breadcrumb, { BreadcrumbItem } from "@/components/navigation/Breadcrumb";
import { Home, Package, Settings } from "lucide-react";

const MyComponent = () => {
  const breadcrumbItems: BreadcrumbItem[] = [
    { label: "Dashboard", href: "/", icon: Home },
    { label: "Inventory", href: "/inventory", icon: Package },
    { label: "Settings", isActive: true, icon: Settings }
  ];

  return (
    <div>
      <Breadcrumb items={breadcrumbItems} />
      {/* Your content */}
    </div>
  );
};
```

### InventoryNavigationTabs Usage

```tsx
import InventoryNavigationTabs from "@/components/navigation/InventoryNavigationTabs";
import { MaterialsManagement } from "@/components/inventory/MaterialsManagement";
import { StockEntriesManagement } from "@/components/inventory/StockEntriesManagement";
import { SectionsManagement } from "@/components/inventory/SectionsManagement";
import { useState } from "react";

const InventoryPage = () => {
  const [activeTab, setActiveTab] = useState("materials");

  return (
    <PageLayout title="Inventory Management">
      <InventoryNavigationTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        materialsContent={
          <MaterialsManagement 
            onDeleteMaterial={handleDeleteMaterial} 
          />
        }
        stockEntriesContent={
          <StockEntriesManagement 
            onDeleteStockEntry={handleDeleteStockEntry} 
          />
        }
        sectionsContent={
          <SectionsManagement 
            onCreateSection={handleCreateSection} 
            onUpdateSection={handleUpdateSection} 
            onDeleteSection={handleDeleteSection} 
          />
        }
      />
    </PageLayout>
  );
};
```

## Route Configuration

The breadcrumb system automatically detects routes based on the configuration in `useBreadcrumb.ts`. To add new routes:

```typescript
const routeConfigs: RouteConfig[] = [
  // Add your route
  { 
    path: "/my-new-page", 
    label: "My New Page", 
    icon: MyIcon, 
    parent: "/" 
  },
  // Nested route
  { 
    path: "/my-new-page/settings", 
    label: "Settings", 
    icon: Settings, 
    parent: "/my-new-page" 
  }
];
```

## Features

### Responsive Design
- Mobile-friendly with text truncation
- Adaptive spacing and sizing
- Touch-friendly interaction areas

### Accessibility
- Proper ARIA labels
- Keyboard navigation support
- Screen reader friendly

### Integration with Sidebar
- Automatically adjusts for sidebar state (collapsed/expanded)
- Smooth transitions
- Proper spacing calculations

### Customization
- Custom breadcrumb items
- Optional page titles and subtitles
- Header actions support
- Full-width layout option

## Implementation Status

✅ **Completed Pages:**
- DayOperationsPage - Updated with PageLayout and automatic breadcrumbs
- SalesHistoryPage - Updated with PageLayout and header actions
- InventoryManagementPage - Updated with PageLayout and InventoryNavigationTabs

✅ **Navigation Components:**
- Breadcrumb - Core breadcrumb component with responsive design
- PageLayout - Complete page wrapper with breadcrumb integration
- InventoryNavigationTabs - Specialized tabs for inventory sections

🔄 **Available for Implementation:**
- All other pages can use the PageLayout component
- Custom breadcrumbs can be added as needed
- Route configurations can be extended
- InventoryNavigationTabs can be used for other multi-section pages

## Benefits

1. **Consistent Navigation**: Uniform breadcrumb experience across all pages
2. **Automatic Generation**: No need to manually create breadcrumbs for standard routes
3. **Responsive Design**: Works perfectly on all screen sizes
4. **Easy Integration**: Simple to add to existing pages
5. **Customizable**: Supports custom breadcrumbs when needed
6. **Accessible**: Built with accessibility best practices
7. **Performance**: Optimized with proper memoization and callbacks
