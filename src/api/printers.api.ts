// Alias file to fix import issues - exports from printer.api.ts
export * from './printer.api';
export { printerAPI } from './printer.api';

// Re-export as printersAPI for backward compatibility
export { printerAPI as printersAPI } from './printer.api';
