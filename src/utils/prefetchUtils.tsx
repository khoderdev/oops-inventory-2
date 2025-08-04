import React, { useContext } from "react";
import { useAtomValue } from "jotai";
import { overallPrefetchStatusAtom } from "@/store/prefetchAtoms";

// Define the context value interface
interface PrefetchContextValue {
  isInitialized: boolean;
  isLoading: boolean;
  hasError: boolean;
  lastUpdated: Date | null;
  refreshAll: () => Promise<void>;
  refreshMaterials: () => Promise<void>;
  refreshStock: () => Promise<void>;
  refreshMenu: () => Promise<void>;
  invalidateAll: () => void;
  getCacheStatus: () => {
    materials: { isValid: boolean; age: number };
    stock: { isValid: boolean; age: number };
    menu: { isValid: boolean; age: number };
  };
}

// Create a context that can be imported
export const createPrefetchContext = () => {
  return React.createContext<PrefetchContextValue | null>(null);
};

// Store the context instance
let PrefetchContextInstance: React.Context<PrefetchContextValue | null> | null = null;

// Function to set the context instance (called from provider)
export const setPrefetchContextInstance = (context: React.Context<PrefetchContextValue | null>) => {
  PrefetchContextInstance = context;
};

/**
 * Hook to access the prefetch context
 */
export const usePrefetchContext = (): PrefetchContextValue => {
  if (!PrefetchContextInstance) {
    throw new Error('PrefetchContext not initialized. Make sure PrefetchProvider is properly set up.');
  }
  
  const context = useContext(PrefetchContextInstance);
  if (!context) {
    throw new Error('usePrefetchContext must be used within a PrefetchProvider');
  }
  return context;
};

/**
 * Hook to check if the prefetch system is ready
 */
export const usePrefetchReady = (): boolean => {
  const status = useAtomValue(overallPrefetchStatusAtom);
  return !status.isLoading && !status.hasError;
};

/**
 * Higher-order component that waits for prefetch to be ready
 */
export const withPrefetch = <P extends object>(
  Component: React.ComponentType<P>,
  LoadingComponent?: React.ComponentType
) => {
  return (props: P) => {
    const isReady = usePrefetchReady();
    const status = useAtomValue(overallPrefetchStatusAtom);

    if (!isReady || status.isLoading) {
      if (LoadingComponent) {
        return <LoadingComponent />;
      }
      
      return (
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-sm text-muted-foreground">Loading inventory data...</p>
          </div>
        </div>
      );
    }

    if (status.hasError) {
      return (
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="text-center">
            <p className="text-sm text-destructive mb-2">Failed to load inventory data</p>
            <button 
              onClick={() => window.location.reload()} 
              className="text-xs text-primary hover:underline"
            >
              Retry
            </button>
          </div>
        </div>
      );
    }

    return <Component {...props} />;
  };
};
