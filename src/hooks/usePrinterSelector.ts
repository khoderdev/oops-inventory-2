import { useCallback, useEffect, useState } from "react";
import type { Printer } from "../types/printer";

interface UsePrinterSelectorReturn {
  selectedPrinter: Printer | null;
  selectedPrinterId: number | null;
  selectPrinter: (printer: Printer | null) => void;
  clearSelection: () => void;
  isSelected: (printerId: number) => boolean;
  getSavedPrinter: () => Printer | null;
  hasSavedPrinter: () => boolean;
}

const PRINTER_STORAGE_KEY = 'pos_selected_printer';

/**
 * Hook for managing printer selection state with localStorage persistence
 * Provides utilities for selecting, clearing, and checking printer selection
 */
export const usePrinterSelector = (initialPrinterId?: number | null): UsePrinterSelectorReturn => {
  // Initialize state from localStorage or provided initial value
  const [selectedPrinter, setSelectedPrinter] = useState<Printer | null>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(PRINTER_STORAGE_KEY);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          localStorage.removeItem(PRINTER_STORAGE_KEY);
        }
      }
    }
    return null;
  });
  
  const [selectedPrinterId, setSelectedPrinterId] = useState<number | null>(() => {
    if (selectedPrinter) {
      return selectedPrinter.id;
    }
    return initialPrinterId || null;
  });

  const selectPrinter = useCallback((printer: Printer | null) => {
    setSelectedPrinter(printer);
    setSelectedPrinterId(printer?.id || null);
    
    // Save to localStorage
    if (typeof window !== 'undefined') {
      if (printer) {
        localStorage.setItem(PRINTER_STORAGE_KEY, JSON.stringify(printer));
      } else {
        localStorage.removeItem(PRINTER_STORAGE_KEY);
      }
    }
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedPrinter(null);
    setSelectedPrinterId(null);
    
    // Remove from localStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem(PRINTER_STORAGE_KEY);
    }
  }, []);

  const isSelected = useCallback(
    (printerId: number) => {
      return selectedPrinterId === printerId;
    },
    [selectedPrinterId]
  );

  const getSavedPrinter = useCallback(() => {
    return selectedPrinter;
  }, [selectedPrinter]);

  const hasSavedPrinter = useCallback(() => {
    return selectedPrinter !== null;
  }, [selectedPrinter]);

  return {
    selectedPrinter,
    selectedPrinterId,
    selectPrinter,
    clearSelection,
    isSelected,
    getSavedPrinter,
    hasSavedPrinter
  };
};
