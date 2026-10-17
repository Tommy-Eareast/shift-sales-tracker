import { useState, useCallback } from 'react';

/**
 * Hook for managing expandable/collapsible items using a Set.
 * Multiple items can be expanded simultaneously.
 */
export function useExpandable(initialExpanded: string[] = []) {
    const [expanded, setExpanded] = useState<Set<string>>(() => new Set(initialExpanded));

    const toggle = useCallback((key: string) => {
        setExpanded(prev => {
            const next = new Set(prev);
            if (next.has(key)) {
                next.delete(key);
            } else {
                next.add(key);
            }
            return next;
        });
    }, []);

    const expand = useCallback((key: string) => {
        setExpanded(prev => {
            if (prev.has(key)) return prev;
            const next = new Set(prev);
            next.add(key);
            return next;
        });
    }, []);

    const collapse = useCallback((key: string) => {
        setExpanded(prev => {
            if (!prev.has(key)) return prev;
            const next = new Set(prev);
            next.delete(key);
            return next;
        });
    }, []);

    const isExpanded = useCallback((key: string) => expanded.has(key), [expanded]);

    return { expanded, isExpanded, toggle, expand, collapse };
}
