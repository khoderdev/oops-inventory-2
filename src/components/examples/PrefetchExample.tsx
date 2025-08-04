import React from "react";
import { usePrefetch, useCachedInventoryData } from "@/hooks/usePrefetch";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, RefreshCw, Database, Package, Menu, AlertCircle } from "lucide-react";

/**
 * Example component demonstrating the prefetch system usage
 */
export const PrefetchExample: React.FC = () => {
  // Use the prefetch hook with custom options
  const {
    materials,
    stock,
    menu,
    status,
    prefetchAll,
    prefetchMaterials,
    prefetchStock,
    prefetchMenu,
    refresh,
    invalidateCache,
    isCacheValid,
    getCacheAge,
  } = usePrefetch({
    autoFetch: true,
    parallel: true,
    onSuccess: (data) => {
      console.log("Prefetch successful:", data);
    },
    onError: (error) => {
      console.error("Prefetch failed:", error);
    },
  });

  // Alternative: Use cached data without prefetching
  const cachedData = useCachedInventoryData();

  const formatCacheAge = (age: number): string => {
    const seconds = Math.floor(age / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) return `${hours}h ${minutes % 60}m ago`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s ago`;
    return `${seconds}s ago`;
  };

  const handleRefreshAll = async () => {
    try {
      await refresh('all');
      console.log("All data refreshed successfully");
    } catch (error) {
      console.error("Failed to refresh data:", error);
    }
  };

  const handlePrefetchSpecific = async (type: 'materials' | 'stock' | 'menu') => {
    try {
      switch (type) {
        case 'materials':
          await prefetchMaterials({ force: true });
          break;
        case 'stock':
          await prefetchStock({ force: true });
          break;
        case 'menu':
          await prefetchMenu({ force: true });
          break;
      }
      console.log(`${type} data prefetched successfully`);
    } catch (error) {
      console.error(`Failed to prefetch ${type}:`, error);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Inventory Prefetch System</h1>
          <p className="text-muted-foreground">
            Demonstration of the inventory data prefetch mechanism
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button
            onClick={handleRefreshAll}
            disabled={status.isLoading}
            variant="outline"
            size="sm"
          >
            {status.isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Refresh All
          </Button>
          
          <Button
            onClick={() => invalidateCache('all')}
            variant="outline"
            size="sm"
          >
            Clear Cache
          </Button>
        </div>
      </div>

      {/* Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            System Status
          </CardTitle>
          <CardDescription>
            Current state of the prefetch system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Loading:</span>
              <Badge variant={status.isLoading ? "destructive" : "secondary"}>
                {status.isLoading ? "Yes" : "No"}
              </Badge>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Has Errors:</span>
              <Badge variant={status.hasError ? "destructive" : "secondary"}>
                {status.hasError ? "Yes" : "No"}
              </Badge>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Last Updated:</span>
              <Badge variant="outline">
                {status.lastUpdated 
                  ? formatCacheAge(Date.now() - status.lastUpdated.getTime())
                  : "Never"
                }
              </Badge>
            </div>
          </div>

          {status.hasError && (
            <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
              <div className="flex items-center gap-2 text-destructive">
                <AlertCircle className="h-4 w-4" />
                <span className="font-medium">Errors detected:</span>
              </div>
              <ul className="mt-2 text-sm text-destructive/80">
                {status.errors.materials && (
                  <li>• Materials: {status.errors.materials}</li>
                )}
                {status.errors.stock && (
                  <li>• Stock: {status.errors.stock}</li>
                )}
                {status.errors.menu && (
                  <li>• Menu: {status.errors.menu}</li>
                )}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Data Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Materials */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Package className="h-4 w-4" />
              Materials
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Count:</span>
                <Badge variant="outline">{materials.length}</Badge>
              </div>
              
              <div className="flex justify-between text-sm">
                <span>Cache Valid:</span>
                <Badge variant={isCacheValid('materials') ? "secondary" : "destructive"}>
                  {isCacheValid('materials') ? "Yes" : "No"}
                </Badge>
              </div>
              
              <div className="flex justify-between text-sm">
                <span>Cache Age:</span>
                <Badge variant="outline">
                  {formatCacheAge(getCacheAge('materials'))}
                </Badge>
              </div>
              
              <Button
                onClick={() => handlePrefetchSpecific('materials')}
                disabled={status.individual.materials.loading}
                size="sm"
                className="w-full mt-3"
              >
                {status.individual.materials.loading ? (
                  <Loader2 className="h-3 w-3 animate-spin mr-2" />
                ) : (
                  <RefreshCw className="h-3 w-3 mr-2" />
                )}
                Refresh
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Stock */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Database className="h-4 w-4" />
              Stock
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Count:</span>
                <Badge variant="outline">{stock.length}</Badge>
              </div>
              
              <div className="flex justify-between text-sm">
                <span>Cache Valid:</span>
                <Badge variant={isCacheValid('stock') ? "secondary" : "destructive"}>
                  {isCacheValid('stock') ? "Yes" : "No"}
                </Badge>
              </div>
              
              <div className="flex justify-between text-sm">
                <span>Cache Age:</span>
                <Badge variant="outline">
                  {formatCacheAge(getCacheAge('stock'))}
                </Badge>
              </div>
              
              <Button
                onClick={() => handlePrefetchSpecific('stock')}
                disabled={status.individual.stock.loading}
                size="sm"
                className="w-full mt-3"
              >
                {status.individual.stock.loading ? (
                  <Loader2 className="h-3 w-3 animate-spin mr-2" />
                ) : (
                  <RefreshCw className="h-3 w-3 mr-2" />
                )}
                Refresh
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Menu */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Menu className="h-4 w-4" />
              Menu
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Count:</span>
                <Badge variant="outline">{menu.length}</Badge>
              </div>
              
              <div className="flex justify-between text-sm">
                <span>Cache Valid:</span>
                <Badge variant={isCacheValid('menu') ? "secondary" : "destructive"}>
                  {isCacheValid('menu') ? "Yes" : "No"}
                </Badge>
              </div>
              
              <div className="flex justify-between text-sm">
                <span>Cache Age:</span>
                <Badge variant="outline">
                  {formatCacheAge(getCacheAge('menu'))}
                </Badge>
              </div>
              
              <Button
                onClick={() => handlePrefetchSpecific('menu')}
                disabled={status.individual.menu.loading}
                size="sm"
                className="w-full mt-3"
              >
                {status.individual.menu.loading ? (
                  <Loader2 className="h-3 w-3 animate-spin mr-2" />
                ) : (
                  <RefreshCw className="h-3 w-3 mr-2" />
                )}
                Refresh
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Usage Examples */}
      <Card>
        <CardHeader>
          <CardTitle>Usage Examples</CardTitle>
          <CardDescription>
            Code examples for using the prefetch system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Basic Usage:</h4>
              <pre className="bg-muted p-3 rounded-md text-sm overflow-x-auto">
{`// Auto-fetch all data on mount
const { materials, stock, menu, status } = usePrefetch();

// Manual prefetch with options
const { prefetchAll } = usePrefetch({ autoFetch: false });
await prefetchAll({ force: true, parallel: true });`}
              </pre>
            </div>

            <div>
              <h4 className="font-medium mb-2">Specific Data Types:</h4>
              <pre className="bg-muted p-3 rounded-md text-sm overflow-x-auto">
{`// Only prefetch materials
const { materials } = usePrefetchMaterials();

// Only prefetch stock
const { stock } = usePrefetchStock();

// Only prefetch menu
const { menu } = usePrefetchMenu();`}
              </pre>
            </div>

            <div>
              <h4 className="font-medium mb-2">Cache Management:</h4>
              <pre className="bg-muted p-3 rounded-md text-sm overflow-x-auto">
{`// Check cache validity
const isValid = isCacheValid('materials');

// Get cache age
const age = getCacheAge('stock');

// Invalidate cache
invalidateCache('all'); // or 'materials', 'stock', 'menu'

// Refresh data
await refresh('materials');`}
              </pre>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
