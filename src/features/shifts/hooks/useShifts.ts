import { useState, useEffect, useCallback } from 'react';
import type { ShiftRecord, ShiftSummary } from '../../../types';
import { shiftService } from '../services/shiftService';
import { readCache, writeCache } from '../../../utils/cache';

const CACHE_KEY_SHIFTS = 'shifts_list';

export function useShifts() {
    const [shifts, setShifts] = useState<ShiftRecord[]>([]);
    const [summaries, setSummaries] = useState<Record<string, ShiftSummary>>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async (isBackground = false) => {
        // Phase 1: Show cached data instantly (only on initial mount)
        if (!isBackground) {
            const cached = readCache<ShiftRecord[]>(CACHE_KEY_SHIFTS);
            if (cached) {
                setShifts(cached.data);
                setLoading(false);
            }
        }

        // Phase 2: Fetch fresh data
        try {
            const data = await shiftService.getAll();
            setShifts(data);
            writeCache(CACHE_KEY_SHIFTS, data);
            setError(null);

            // Fetch summaries
            const summaryMap: Record<string, ShiftSummary> = {};
            for (const shift of data) {
                try {
                    summaryMap[shift.shiftId] = await shiftService.getSummary(shift.shiftId);
                } catch {
                    // Skip
                }
            }
            setSummaries(summaryMap);
        } catch (err) {
            if (!isBackground) {
                setError(err instanceof Error ? err.message : 'Failed to load shifts');
            }
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

    const create = useCallback(
        async (templateId: string, recordDate: string, timeStart: string, timeEnd: string) => {
            await shiftService.create(templateId, recordDate, timeStart, timeEnd);
            await load(true);
        },
        [load]
    );

    const update = useCallback(
        async (shiftId: string, updates: { recordDate?: string; shiftTimeStart?: string; shiftTimeEnd?: string }) => {
            await shiftService.update(shiftId, updates);
            await load(true);
        },
        [load]
    );

    const submit = useCallback(
        async (shiftId: string, note: string) => {
            await shiftService.submit(shiftId, note);
            await load(true);
        },
        [load]
    );

    const remove = useCallback(
        async (shiftId: string) => {
            await shiftService.delete(shiftId);
            await load(true);
        },
        [load]
    );

    const removeMany = useCallback(
        async (shiftIds: string[]) => {
            if (shiftIds.length === 0) return;
            await shiftService.deleteMany(shiftIds);
            await load(true);
        },
        [load]
    );

    return {
        shifts,
        summaries,
        loading,
        error,
        create,
        update,
        submit,
        remove,
        removeMany, // ← NEW
        refresh: load,
    };
}
