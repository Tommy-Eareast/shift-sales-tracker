import { useState, useCallback } from "react";

/**
 * Hook for managing expandable/collapsible items using a Set.
 * Used by Admin (brands, sub-categories) and ShiftEdit (sub-categories).
 */
export function useExpandable(initialExpanded: string[] = []) {
  const [expanded, setExpanded] = useState<Set<string>>(
    () => new Set(initialExpanded),
  );

  const toggle = useCallback((key: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }, []);

  const isExpanded = useCallback(
    (key: string) => expanded.has(key),
    [expanded],
  );

  return { expanded, isExpanded, toggle };
}
