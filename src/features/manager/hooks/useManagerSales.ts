import { useState, useEffect, useCallback, useMemo } from "react";
import {
  managerService,
  type ManagerShiftView,
} from "../services/managerService";
import type { ShiftTemplate } from "../../../types";

export function useManagerSales() {
  const [templates, setTemplates] = useState<ShiftTemplate[]>([]);
  const [shifts, setShifts] = useState<ManagerShiftView[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>("");
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
      setError(err instanceof Error ? err.message : "Failed to load data");
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

  // Auto-select latest date when template changes — derived during render, not in effect
  const effectiveSelectedDate =
    selectedDate || (availableDates.length > 0 ? availableDates[0] : "");

  // Sync effective date back to state without a cascading effect
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
    return managerService.getShiftsForDate(
      shifts,
      selectedTemplateId,
      effectiveSelectedDate,
    );
  }, [shifts, selectedTemplateId, effectiveSelectedDate]);

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
    refresh: load,
  };
}
