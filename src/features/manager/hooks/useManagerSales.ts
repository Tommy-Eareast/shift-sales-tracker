import { useState, useEffect, useCallback, useMemo } from 'react';
import { managerService, type ManagerShiftView } from '../services/managerService';
import type { ShiftTemplate } from '../../../types';

export function useManagerSales() {
    const [templates, setTemplates] = useState<ShiftTemplate[]>([]);
    const [shifts, setShifts] = useState<ManagerShiftView[]>([]);
    const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
    const [selectedDate, setSelectedDate] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [templateData, shiftData] = await Promise.all([
                managerService.getAllTemplates(),
                managerService.getSubmittedShifts(),
            ]);
            setTemplates(templateData);
            setShifts(shiftData);

            if (templateData.length > 0 && !selectedTemplateId) {
                setSelectedTemplateId(templateData[0].templateId);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load data');
        } finally {
            setLoading(false);
        }
    }, [selectedTemplateId]);

    useEffect(() => {
        const timer = setTimeout(() => {
            load();
        }, 0);
        return () => clearTimeout(timer);
    }, [load]);

    const availableDates = useMemo(() => {
        if (!selectedTemplateId) return [];
        return managerService.getDistinctDates(shifts, selectedTemplateId);
    }, [shifts, selectedTemplateId]);

    const effectiveSelectedDate = selectedDate || (availableDates.length > 0 ? availableDates[0] : '');

    useEffect(() => {
        if (!selectedDate && availableDates.length > 0) {
            const timer = setTimeout(() => {
                setSelectedDate(availableDates[0]);
            }, 0);
            return () => clearTimeout(timer);
        }
    }, [availableDates, selectedDate]);

    const selectedShifts = useMemo(() => {
        if (!selectedTemplateId || !effectiveSelectedDate) return [];
        return managerService.getShiftsForDate(shifts, selectedTemplateId, effectiveSelectedDate);
    }, [shifts, selectedTemplateId, effectiveSelectedDate]);

    /**
     * Soft-delete a set of submitted shifts.
     * After deletion, if the currently selected date no longer exists, auto-select next available.
     */
    const deleteShifts = useCallback(
        async (submittedShiftIds: string[]) => {
            await managerService.softDeleteShifts(submittedShiftIds);
            // Reload data
            const shiftData = await managerService.getSubmittedShifts();
            setShifts(shiftData);

            // If current selected date no longer exists, pick next available
            const remainingDates = managerService.getDistinctDates(shiftData, selectedTemplateId);
            if (remainingDates.length > 0 && !remainingDates.includes(effectiveSelectedDate)) {
                setSelectedDate(remainingDates[0]);
            } else if (remainingDates.length === 0) {
                setSelectedDate('');
            }
        },
        [selectedTemplateId, effectiveSelectedDate]
    );

    return {
        templates,
        shifts,
        selectedTemplateId,
        setSelectedTemplateId,
        selectedDate: effectiveSelectedDate,
        setSelectedDate,
        availableDates,
        selectedShifts,
        loading,
        error,
        deleteShifts,
        refresh: load,
    };
}
