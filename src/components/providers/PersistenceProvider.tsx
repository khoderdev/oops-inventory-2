import React from 'react';
import { PersistGate } from 'redux-persist/integration/react';
import { persistor } from '@/store';

interface PersistenceProviderProps {
  children: React.ReactNode;
}

/**
 * PersistenceProvider
 * 
 * Wraps the application with Redux Persist's PersistGate to ensure
 * that the Redux store is rehydrated from localStorage before rendering
 * the application. This provides a seamless offline-first experience.
 */
export function PersistenceProvider({ children }: PersistenceProviderProps) {
  return (
    <PersistGate 
      loading={
        <div className="flex items-center justify-center h-screen">
          <div className="flex flex-col items-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-t-transparent border-primary"></div>
            <p className="text-sm text-gray-500">Loading cached data...</p>
          </div>
        </div>
      } 
      persistor={persistor}
    >
      {children}
    </PersistGate>
  );
}
