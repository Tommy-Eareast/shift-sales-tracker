import { useMemo } from "react";
import type { Product, ShiftTemplate } from "../../../types";

/**
 * Derives display-ready data from raw shift products.
 * Returns brand order, grouped products, and template-filtered list.
 */
export function useShiftDisplay(
    products: Product[],
    template: ShiftTemplate | null,
) {
    const templateProducts = useMemo(
        () => products.filter((p) => template?.brandList.includes(p.brandMain)),
        [products, template],
    );

    const displayBrandOrder = useMemo(() => {
        const seen = new Set<string>();
        return templateProducts.reduce((order: string[], p) => {
            if (!seen.has(p.brandMain)) {
                seen.add(p.brandMain);
                order.push(p.brandMain);
            }
            return order;
        }, []);
    }, [templateProducts]);

    const groupedProducts = useMemo(() => {
        const grouped: Record<string, Record<string, Product[]>> = {};
        for (const p of templateProducts) {
            if (!grouped[p.brandMain]) grouped[p.brandMain] = {};
            if (!grouped[p.brandMain][p.subCategory])
                grouped[p.brandMain][p.subCategory] = [];
            grouped[p.brandMain][p.subCategory].push(p);
        }
        return grouped;
    }, [templateProducts]);

    return { templateProducts, displayBrandOrder, groupedProducts };
}
