import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { initializeApp } from './utils/appInitialization';

// Initialize app with performance optimizations
initializeApp().then(() => {
  console.log('🎯 App initialization completed, rendering React app...');
}).catch((error) => {
  console.error('⚠️ App initialization failed, continuing with render:', error);
});

// Render app immediately (don't wait for initialization)
createRoot(document.getElementById("root")!).render(<App />);
