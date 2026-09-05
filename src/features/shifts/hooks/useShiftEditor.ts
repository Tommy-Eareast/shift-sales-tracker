import { useState, useEffect, useCallback } from "react";
import type {
  Product,
  ShiftRecord,
  ShiftTemplate,
  ShiftSummary,
} from "../../../types";
import { shiftService } from "../services/shiftService";
import { productService } from "../../products/services/productService";
import { templateService } from "../../templates/services/templateService";

export function useShiftEditor(shiftId: string | undefined) {
  const [shift, setShift] = useState<ShiftRecord | null>(null);
  const [template, setTemplate] = useState<ShiftTemplate | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Map<string, number>>(new Map());
  const [summary, setSummary] = useState<ShiftSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!shiftId) return;
    setLoading(true);
    setError(null);
    try {
      const shiftData = await shiftService.getById(shiftId);
      if (!shiftData) throw new Error("Shift not found");
      setShift(shiftData);

      const [templateData, allProducts, salesData, summaryData] =
        await Promise.all([
          templateService.getById(shiftData.templateId),
          productService.getAll(),
          shiftService.getSales(shiftId),
          shiftService.getSummary(shiftId),
        ]);
      setTemplate(templateData || null);
      setProducts(allProducts);
      setSummary(summaryData);

      const salesMap = new Map<string, number>();
      salesData.forEach((s) => salesMap.set(s.productId, s.sellCount));
      setSales(salesMap);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load shift");
    } finally {
      setLoading(false);
    }
  }, [shiftId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      load();
    }, 0);
    return () => clearTimeout(timer);
  }, [load]);

  const adjustSales = useCallback(
    async (productId: string, delta: number) => {
      if (!shiftId || shift?.status === "submitted") return;

      const currentCount = sales.get(productId) || 0;
      const newCount = Math.max(0, currentCount + delta);

      // Optimistic update
      setSales((prev) => {
        const next = new Map(prev);
        next.set(productId, newCount);
        return next;
      });

      try {
        await shiftService.adjustSales(shiftId, productId, delta);
        const summaryData = await shiftService.getSummary(shiftId);
        setSummary(summaryData);
      } catch {
        // Revert on error
        setSales((prev) => {
          const next = new Map(prev);
          next.set(productId, currentCount);
          return next;
        });
      }
    },
    [shiftId, shift, sales],
  );

  const submit = useCallback(
    async (note: string) => {
      if (!shiftId) return;
      await shiftService.submit(shiftId, note);
      await load();
    },
    [shiftId, load],
  );

  return {
    shift,
    template,
    products,
    sales,
    summary,
    loading,
    error,
    adjustSales,
    submit,
    refresh: load,
  };
}
