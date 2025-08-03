import React, { createContext, useContext, useState, ReactNode } from 'react';

interface HeaderActionsContextType {
  headerActions: ReactNode | null;
  setHeaderActions: (actions: ReactNode | null) => void;
  pageTitle: string | null;
  setPageTitle: (title: string | null) => void;
}

const HeaderActionsContext = createContext<HeaderActionsContextType | undefined>(undefined);

interface HeaderActionsProviderProps {
  children: ReactNode;
}

export const HeaderActionsProvider: React.FC<HeaderActionsProviderProps> = ({ children }) => {
  const [headerActions, setHeaderActions] = useState<ReactNode | null>(null);
  const [pageTitle, setPageTitle] = useState<string | null>(null);

  return (
    <HeaderActionsContext.Provider value={{ headerActions, setHeaderActions, pageTitle, setPageTitle }}>
      {children}
    </HeaderActionsContext.Provider>
  );
};

export const useHeaderActions = () => {
  const context = useContext(HeaderActionsContext);
  if (context === undefined) {
    throw new Error('useHeaderActions must be used within a HeaderActionsProvider');
  }
  return context;
};
