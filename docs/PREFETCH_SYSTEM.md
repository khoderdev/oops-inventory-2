# Inventory Prefetch System

A comprehensive API prefetch mechanism for the OOPS Inventory application using Jotai for state management and React best practices.

## Overview

The prefetch system provides:
- **Automatic data caching** with configurable TTL
- **Parallel/sequential prefetching** for optimal performance
- **Cache invalidation** and refresh mechanisms
- **Error handling** and retry logic
- **React hooks** for easy integration
- **Provider pattern** for app-level management

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Prefetch System                          │
├─────────────────────────────────────────────────────────────┤
│  PrefetchProvider (App Level)                               │
│  ├── Auto-fetch on mount                                    │
│  ├── Window focus refresh                                   │
│  ├── Network reconnect refresh                              │
│  └── Interval refresh                                       │
├─────────────────────────────────────────────────────────────┤
│  Prefetch Atoms (Jotai State)                              │
│  ├── Cache Storage (localStorage)                           │
│  ├── Cache Metadata                                         │
│  ├── Loading States                                         │
│  └── Error States                                           │
├─────────────────────────────────────────────────────────────┤
│  Hooks (React Integration)                                  │
│  ├── usePrefetch                                            │
│  ├── usePrefetchMaterials                                   │
│  ├── usePrefetchStock                                       │
│  ├── usePrefetchMenu                                        │
│  └── useCachedInventoryData                                 │
├─────────────────────────────────────────────────────────────┤
│  Enhanced APIs (Cache Integration)                          │
│  ├── inventoryAPIWithPrefetch                               │
│  ├── Auto cache invalidation                                │
│  └── Optimistic updates                                     │
└─────────────────────────────────────────────────────────────┘
```

## Files Structure

```
src/
├── store/
│   └── prefetchAtoms.ts          # Jotai atoms for prefetch state
├── hooks/
│   └── usePrefetch.ts            # React hooks for prefetch
├── components/
│   ├── providers/
│   │   └── PrefetchProvider.tsx  # App-level provider
│   └── examples/
│       └── PrefetchExample.tsx   # Usage examples
├── utils/
│   └── prefetchUtils.tsx         # Utility functions
├── api/
│   └── inventory.api.ts          # Enhanced API with cache
└── docs/
    └── PREFETCH_SYSTEM.md        # This documentation
```

## Quick Start

### 1. Setup Provider

Wrap your app with the `PrefetchProvider`:

```tsx
import { PrefetchProvider } from "@/components/providers/PrefetchProvider";

function App() {
  return (
    <PrefetchProvider
      autoFetch={true}
      parallel={true}
      refreshOnFocus={true}
      refreshOnReconnect={true}
    >
      <YourAppComponents />
    </PrefetchProvider>
  );
}
```

### 2. Use in Components

```tsx
import { usePrefetch } from "@/hooks/usePrefetch";

function InventoryComponent() {
  const {
    materials,
    stock,
    menu,
    status,
    prefetchAll,
    refresh,
  } = usePrefetch();

  if (status.isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h2>Materials: {materials.length}</h2>
      <h2>Stock: {stock.length}</h2>
      <h2>Menu: {menu.length}</h2>
      
      <button onClick={() => refresh('all')}>
        Refresh All Data
      </button>
    </div>
  );
}
```

## API Reference

### PrefetchProvider Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `autoFetch` | `boolean` | `true` | Auto-prefetch on mount |
| `parallel` | `boolean` | `true` | Prefetch in parallel |
| `refreshInterval` | `number` | `0` | Auto-refresh interval (ms) |
| `refreshOnFocus` | `boolean` | `true` | Refresh on window focus |
| `refreshOnReconnect` | `boolean` | `true` | Refresh on network reconnect |
| `onInitialized` | `() => void` | - | Callback when initialized |
| `onError` | `(error: Error) => void` | - | Error callback |

### usePrefetch Hook

```tsx
const {
  // Data
  materials,      // MaterialWithStock[]
  stock,          // StockEntryWithMaterial[]
  menu,           // MenuItem[]
  
  // Status
  status: {
    isLoading,    // boolean
    hasError,     // boolean
    lastUpdated,  // Date | null
    errors: {
      materials,  // string | null
      stock,      // string | null
      menu,       // string | null
    }
  },
  
  // Actions
  prefetchAll,         // (options?) => Promise
  prefetchMaterials,   // (options?) => Promise
  prefetchStock,       // (options?) => Promise
  prefetchMenu,        // (options?) => Promise
  refresh,             // (cacheType?) => Promise
  invalidateCache,     // (cacheType?) => void
  
  // Utilities
  isCacheValid,        // (cacheType) => boolean
  getCacheAge,         // (cacheType) => number
} = usePrefetch(options);
```

### Hook Options

```tsx
interface UsePrefetchOptions {
  autoFetch?: boolean;           // Auto-fetch on mount
  parallel?: boolean;            // Parallel vs sequential
  force?: boolean;               // Force refresh
  dataTypes?: string[];          // Which data to fetch
  onSuccess?: (data) => void;    // Success callback
  onError?: (error) => void;     // Error callback
}
```

### Specialized Hooks

```tsx
// Only materials
const { materials, status } = usePrefetchMaterials();

// Only stock
const { stock, status } = usePrefetchStock();

// Only menu
const { menu, status } = usePrefetchMenu();

// Cached data without prefetching
const { materials, stock, menu } = useCachedInventoryData();
```

## Enhanced API Usage

Use the enhanced API for automatic cache management:

```tsx
import { inventoryAPIWithPrefetch } from "@/api/inventory.api";

// These methods automatically update the cache
await inventoryAPIWithPrefetch.materials.createMaterialWithCache(data);
await inventoryAPIWithPrefetch.stock.updateStockEntryWithCache(id, data);
await inventoryAPIWithPrefetch.menu.deleteMenuItemWithCache(id);

// Direct prefetch control
await inventoryAPIWithPrefetch.prefetch.all({ force: true });
await inventoryAPIWithPrefetch.prefetch.materials();

// Cache management
inventoryAPIWithPrefetch.cache.invalidate('all');
```

## Configuration

### Cache Duration

Default cache duration is 5 minutes. Modify in `prefetchAtoms.ts`:

```tsx
export const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
```

### Prefetch Delay

Delay between parallel requests to prevent API overload:

```tsx
export const PREFETCH_DELAY = 100; // 100ms
```

## Best Practices

### 1. Use Appropriate Hooks

```tsx
// ✅ Good: Use specific hooks when you only need one data type
const { materials } = usePrefetchMaterials();

// ❌ Avoid: Fetching all data when you only need materials
const { materials } = usePrefetch(); // Fetches stock and menu too
```

### 2. Handle Loading States

```tsx
const { materials, status } = usePrefetch();

if (status.isLoading) {
  return <LoadingSpinner />;
}

if (status.hasError) {
  return <ErrorMessage onRetry={() => refresh('all')} />;
}

return <MaterialsList materials={materials} />;
```

### 3. Optimize Re-renders

```tsx
// ✅ Good: Use cached data hook when you don't need prefetch actions
const { materials } = useCachedInventoryData();

// ❌ Avoid: Using full prefetch hook when you only need data
const { materials } = usePrefetch({ autoFetch: false });
```

### 4. Cache Management

```tsx
// Invalidate cache after mutations
const handleCreateMaterial = async (data) => {
  await materialsAPI.createMaterial(data);
  invalidateCache('materials'); // Clear stale cache
  await prefetchMaterials({ force: true }); // Refresh
};

// Or use enhanced API that handles this automatically
const handleCreateMaterial = async (data) => {
  await inventoryAPIWithPrefetch.materials.createMaterialWithCache(data);
  // Cache is automatically invalidated and refreshed
};
```

## Error Handling

The system provides multiple levels of error handling:

### 1. Individual Data Type Errors

```tsx
const { status } = usePrefetch();

if (status.errors.materials) {
  console.error('Materials fetch failed:', status.errors.materials);
}
```

### 2. Global Error Handling

```tsx
<PrefetchProvider
  onError={(error) => {
    console.error('Prefetch error:', error);
    // Send to error reporting service
  }}
>
```

### 3. Component Level Error Handling

```tsx
const { prefetchAll } = usePrefetch({
  onError: (error) => {
    toast.error(`Failed to load data: ${error.message}`);
  }
});
```

## Performance Considerations

### 1. Parallel vs Sequential

```tsx
// Parallel (faster but more API load)
usePrefetch({ parallel: true });

// Sequential (slower but gentler on API)
usePrefetch({ parallel: false });
```

### 2. Selective Prefetching

```tsx
// Only fetch what you need
usePrefetch({ dataTypes: ['materials', 'stock'] });
```

### 3. Cache Validation

```tsx
// Check if cache is still valid before fetching
const isValid = isCacheValid('materials');
if (!isValid) {
  await prefetchMaterials();
}
```

## Troubleshooting

### Common Issues

1. **Data not loading**: Check if `PrefetchProvider` is properly wrapped around your app
2. **Stale data**: Verify cache duration and invalidation logic
3. **Performance issues**: Consider using selective prefetching or sequential mode
4. **Memory usage**: Monitor cache size and implement cleanup if needed

### Debug Mode

Enable debug logging:

```tsx
const { status } = usePrefetch({
  onSuccess: (data) => console.log('Prefetch success:', data),
  onError: (error) => console.error('Prefetch error:', error),
});
```

## Migration Guide

### From useState to Prefetch System

**Before:**
```tsx
const [materials, setMaterials] = useState([]);
const [loading, setLoading] = useState(false);

useEffect(() => {
  const fetchMaterials = async () => {
    setLoading(true);
    try {
      const response = await materialsAPI.getMaterials();
      setMaterials(response.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };
  
  fetchMaterials();
}, []);
```

**After:**
```tsx
const { materials, status } = usePrefetchMaterials();
```

### From React Query to Prefetch System

**Before:**
```tsx
const { data: materials, isLoading, error } = useQuery({
  queryKey: ['materials'],
  queryFn: () => materialsAPI.getMaterials(),
});
```

**After:**
```tsx
const { materials, status } = usePrefetchMaterials();
```

## Contributing

When adding new data types to the prefetch system:

1. Add atoms to `prefetchAtoms.ts`
2. Create prefetch action
3. Add hook to `usePrefetch.ts`
4. Update enhanced API
5. Add tests
6. Update documentation

## Examples

See `src/components/examples/PrefetchExample.tsx` for a comprehensive example demonstrating all features of the prefetch system.
