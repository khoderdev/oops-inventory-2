/// <reference types="vite/client" />

// Global window extensions
declare global {
  interface Window {
    invalidateMaterialsCache?: () => void;
  }
}
