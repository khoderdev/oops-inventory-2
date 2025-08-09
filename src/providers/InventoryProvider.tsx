import { Provider } from 'jotai';
import { ReactNode } from 'react';

interface InventoryProviderProps {
  children: ReactNode;
}

export function InventoryProvider({ children }: InventoryProviderProps) {
  return <Provider>{children}</Provider>;
}
