/**
 * Debounced Category Filter Hook
 * Prevents excessive filtering operations during rapid category changes
 */

import { useState, useEffect, useRef } from "react";

export function useDebouncedCategory(
  initialCategory: string = "all",
  delay: number = 150
): [string, (category: string) => void, string] {
  const [category, setCategory] = useState(initialCategory);
  const [debouncedCategory, setDebouncedCategory] = useState(initialCategory);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout
    timeoutRef.current = setTimeout(() => {
      setDebouncedCategory(category);
    }, delay);

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [category, delay]);

  return [debouncedCategory, setCategory, category];
}
