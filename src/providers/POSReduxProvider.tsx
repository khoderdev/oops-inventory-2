import React from 'react';
import { Provider } from 'react-redux';
import { store } from '@/store/';
import { PersistenceProvider } from '@/components/providers/PersistenceProvider';

interface POSReduxProviderProps {
  children: React.ReactNode;
}

export const POSReduxProvider: React.FC<POSReduxProviderProps> = ({ children }) => {
  return (
    <Provider store={store}>
      <PersistenceProvider>
        {children}
      </PersistenceProvider>
    </Provider>
  );
};
