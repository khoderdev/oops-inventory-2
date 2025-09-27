import { createRoot } from "react-dom/client";
import { lazy, Suspense } from "react";
import "./index.css";
import { initializeApp } from "./utils/appInitialization";
import { MenuItemsProvider } from "./contexts/MenuItemsContext";
import { addCriticalResourceHints } from "./components/common/ResourceHints";

// Lazy load the App component
const App = lazy(() => import("./App.tsx"));

// Add critical resource hints immediately
addCriticalResourceHints();

// Remove loading spinner once app is loaded
const removeLoadingSpinner = () => {
  const spinner = document.querySelector('.loading-spinner');
  if (spinner && spinner.parentNode) {
    spinner.parentNode.removeChild(spinner);
  }
};

// Initialize app with performance optimizations
const startTime = performance.now();

// Use requestIdleCallback to defer non-critical initialization
const idleCallback = window.requestIdleCallback || ((cb) => setTimeout(cb, 1));
idleCallback(() => {
  initializeApp()
    .then(() => {
      console.log(`App initialized in ${(performance.now() - startTime).toFixed(2)}ms`);
    })
    .catch(error => {
      console.error("⚠️ App initialization failed, continuing with render:", error);
    });
});

// Create a custom loading component
const AppLoading = () => (
  <div className="flex items-center justify-center h-screen bg-gray-50">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
      <p className="mt-4 text-gray-600 font-medium">Loading application...</p>
    </div>
  </div>
);

// Render app with Suspense
createRoot(document.getElementById("root")!).render(
  <MenuItemsProvider>
    <Suspense fallback={<AppLoading />}>
      <App />
    </Suspense>
  </MenuItemsProvider>
);

// Register performance metrics
if ('performance' in window && 'getEntriesByType' in performance) {
  window.addEventListener('load', () => {
    // Report performance metrics after load
    setTimeout(() => {
      const paintMetrics = performance.getEntriesByType('paint');
      const fcp = paintMetrics.find(entry => entry.name === 'first-contentful-paint');
      if (fcp) {
        console.log(`First Contentful Paint: ${fcp.startTime.toFixed(1)}ms`);
      }
      
      // Report Largest Contentful Paint
      let lcpTime = 0;
      new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        const lastEntry = entries[entries.length - 1];
        lcpTime = lastEntry.startTime;
        console.log(`Largest Contentful Paint: ${lcpTime.toFixed(1)}ms`);
      }).observe({type: 'largest-contentful-paint', buffered: true});
      
      // Remove loading spinner
      removeLoadingSpinner();
    }, 0);
  });
}
