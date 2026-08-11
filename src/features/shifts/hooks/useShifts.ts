import { useState, useEffect, useCallback } from "react";
import type { ShiftRecord, ShiftSummary } from "../../../types";
import { shiftService } from "../services/shiftService";

/**
 * Hook for managing the shift list.
 * Used by ShiftListPage.
 */
export function useShifts() {
    const [shifts, setShifts] = useState<ShiftRecord[]>([]);
    const [summaries, setSummaries] = useState<Record<string, ShiftSummary>>(
        {},
    );
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await shiftService.getAll();
            setShifts(data);

            const summaryMap: Record<string, ShiftSummary> = {};
            for (const shift of data) {
                try {
                    summaryMap[shift.shiftId] = await shiftService.getSummary(
                        shift.shiftId,
                    );
                } catch {
                    // Skip shifts with missing templates
                }
            }
            setSummaries(summaryMap);
        } catch (err) {
            setError(
                err instanceof Error ? err.message : "Failed to load shifts",
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    const create = useCallback(
        async (
            templateId: string,
            recordDate: string,
            timeStart: string,
            timeEnd: string,
        ) => {
            await shiftService.create(
                templateId,
                recordDate,
                timeStart,
                timeEnd,
            );
            await load();
        },
        [load],
    );

    const update = useCallback(
        async (
            shiftId: string,
            updates: {
                recordDate?: string;
                shiftTimeStart?: string;
                shiftTimeEnd?: string;
            },
        ) => {
            await shiftService.update(shiftId, updates);
            await load();
        },
        [load],
    );

    const remove = useCallback(
        async (shiftId: string) => {
            await shiftService.delete(shiftId);
            await load();
        },
        [load],
    );

    return {
        shifts,
        summaries,
        loading,
        error,
        create,
        update,
        remove,
        refresh: load,
    };
}
