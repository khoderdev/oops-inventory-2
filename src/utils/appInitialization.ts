/**
 * App Initialization Utilities
 * Handles logo preloading and other startup optimizations
 */

import { preloadAllLogos } from "./logoCache";

/**
 * Initialize application with performance optimizations
 */
export const initializeApp = async (): Promise<void> => {
  try {
    // Start logo preloading immediately
    const logoPreloadPromise = preloadAllLogos();

    // Add other initialization tasks here
    const initTasks = [
      logoPreloadPromise
      // Add more initialization tasks as needed
      // preloadCriticalAssets(),
      // initializeServiceWorker(),
      // setupPerformanceMonitoring(),
    ];

    // Wait for all initialization tasks
    await Promise.allSettled(initTasks);
  } catch (error) {
    console.error("❌ Application initialization failed:", error);
    // Don't throw - allow app to continue even if some optimizations fail
  }
};

/**
 * Performance monitoring utilities
 */
export const performanceUtils = {
  /**
   * Measure and log component render time
   */
  measureRenderTime: (componentName: string, startTime: number) => {
    const endTime = performance.now();
    const renderTime = endTime - startTime;

    if (process.env.NODE_ENV === "development") {
      console.log(`⏱️ ${componentName} render time: ${renderTime.toFixed(2)}ms`);
    }

    return renderTime;
  },

  /**
   * Log memory usage (development only)
   */
  logMemoryUsage: () => {
    if (process.env.NODE_ENV === "development" && "memory" in performance) {
      const memory = (
        performance as Performance & {
          memory?: {
            usedJSHeapSize: number;
            totalJSHeapSize: number;
            jsHeapSizeLimit: number;
          };
        }
      ).memory;

      if (memory) {
        console.log("🧠 Memory usage:", {
          used: `${Math.round(memory.usedJSHeapSize / 1024 / 1024)} MB`,
          total: `${Math.round(memory.totalJSHeapSize / 1024 / 1024)} MB`,
          limit: `${Math.round(memory.jsHeapSizeLimit / 1024 / 1024)} MB`
        });
      }
    }
  },

  /**
   * Monitor largest contentful paint
   */
  monitorLCP: () => {
    if ("PerformanceObserver" in window) {
      const observer = new PerformanceObserver(list => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        console.log("🎨 Largest Contentful Paint:", lastEntry.startTime.toFixed(2) + "ms");
      });

      observer.observe({ entryTypes: ["largest-contentful-paint"] });
    }
  }
};

export default initializeApp;
