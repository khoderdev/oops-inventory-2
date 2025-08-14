// loader.js (ESM-compatible wrapper)
import('./index.js').then((module) => {
    const app = module.default || module;
    // Export for iisnode (if needed)
    if (typeof module.exports === 'object') {
      module.exports = app;
    }
    return app;
  }).catch((err) => {
    console.error('Failed to load module:', err);
    process.exit(1);
  });