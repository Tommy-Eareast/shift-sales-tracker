import { useState, useEffect, useCallback } from "react";
import type { ShiftTemplate } from "../../../types";
import { templateService } from "../services/templateService";

/**
 * Hook for managing shift templates.
 * Used by AdminPage (template section) and ShiftListPage (template selector).
 */
export function useTemplates() {
    const [templates, setTemplates] = useState<ShiftTemplate[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await templateService.getAll();
            setTemplates(data);
        } catch (err) {
            setError(
                err instanceof Error ? err.message : "Failed to load templates",
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    const add = useCallback(
        async (data: { templateName: string; brandList: string[] }) => {
            await templateService.add(data);
            await load();
        },
        [load],
    );

    const remove = useCallback(
        async (templateId: string) => {
            await templateService.delete(templateId);
            await load();
        },
        [load],
    );

    const reorder = useCallback(
        async (templateIds: string[]) => {
            await templateService.reorder(templateIds);
            await load();
        },
        [load],
    );

    return { templates, loading, error, add, remove, reorder, refresh: load };
}
