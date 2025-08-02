import { useCallback, useState } from "react";
import type { Printer } from "../types/printer";

interface UsePrinterSelectorReturn {
  selectedPrinter: Printer | null;
  selectedPrinterId: number | null;
  selectPrinter: (printer: Printer | null) => void;
  clearSelection: () => void;
  isSelected: (printerId: number) => boolean;
}

/**
 * Hook for managing printer selection state
 * Provides utilities for selecting, clearing, and checking printer selection
 */
export const usePrinterSelector = (initialPrinterId?: number | null): UsePrinterSelectorReturn => {
  const [selectedPrinter, setSelectedPrinter] = useState<Printer | null>(null);
  const [selectedPrinterId, setSelectedPrinterId] = useState<number | null>(initialPrinterId || null);

  const selectPrinter = useCallback((printer: Printer | null) => {
    setSelectedPrinter(printer);
    setSelectedPrinterId(printer?.id || null);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedPrinter(null);
    setSelectedPrinterId(null);
  }, []);

  const isSelected = useCallback(
    (printerId: number) => {
      return selectedPrinterId === printerId;
    },
    [selectedPrinterId]
  );

  return {
    selectedPrinter,
    selectedPrinterId,
    selectPrinter,
    clearSelection,
    isSelected
  };
};
