import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initializeApp } from "./utils/appInitialization";
import { MenuItemsProvider } from "./contexts/MenuItemsContext";

// Initialize app with performance optimizations
initializeApp()
  .then(() => {})
  .catch(error => {
    console.error("⚠️ App initialization failed, continuing with render:", error);
  });

// Render app immediately (don't wait for initialization)
createRoot(document.getElementById("root")!).render(
  <MenuItemsProvider>
    <App />
  </MenuItemsProvider>
);
