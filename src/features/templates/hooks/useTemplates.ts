import { useState, useEffect, useCallback } from 'react';
import type { ShiftTemplate } from '../../../types';
import { templateService } from '../services/templateService';

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
            setError(err instanceof Error ? err.message : 'Failed to load templates');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            load();
        }, 0);
        return () => clearTimeout(timer);
    }, [load]);

    const add = useCallback(
        async (data: { templateName: string; brandList: string[] }) => {
            await templateService.add(data);
            await load();
        },
        [load]
    );

    const update = useCallback(
        async (templateId: string, data: { templateName: string; brandList: string[] }) => {
            setTemplates(prev => prev.map(t => (t.templateId === templateId ? { ...t, ...data } : t)));
            try {
                await templateService.update(templateId, data);
            } catch (err) {
                console.error('Update failed:', err);
                await load();
            }
        },
        [load]
    );

    const remove = useCallback(
        async (templateId: string) => {
            setTemplates(prev => prev.filter(t => t.templateId !== templateId));
            try {
                await templateService.delete(templateId);
            } catch (err) {
                console.error('Delete failed:', err);
                await load();
            }
        },
        [load]
    );

    const reorder = useCallback(
        async (templateIds: string[]) => {
            setTemplates(prev => {
                const idMap = new Map(prev.map(t => [t.templateId, t]));
                return templateIds
                    .map((id, index) => {
                        const t = idMap.get(id);
                        return t ? { ...t, sortOrder: index } : null;
                    })
                    .filter(Boolean) as ShiftTemplate[];
            });
            try {
                await templateService.reorder(templateIds);
            } catch (err) {
                console.error('Reorder failed:', err);
                await load();
            }
        },
        [load]
    );

    return { templates, loading, error, add, update, remove, reorder, refresh: load };
}
