import { useMemo, useState, useEffect } from 'react';
import type { Product, ShiftTemplate } from '../../../types';
import { orderingService } from '../../products/services/orderingService';

/**
 * Derives display-ready data from raw shift products.
 * Uses the manager's brand ordering config (not template.brandList order).
 * Fetches ordering config on each mount — reflects changes when returning to this page.
 */
export function useShiftDisplay(products: Product[], template: ShiftTemplate | null) {
    const [brandOrder, setBrandOrder] = useState<string[]>([]);
    const [subCatOrders, setSubCatOrders] = useState<Record<string, string[]>>({});

    // Load ordering config on mount (refreshes when page is re-visited)
    useEffect(() => {
        orderingService.getBrandOrder().then(setBrandOrder);
    }, []);

    // Load sub-category orders whenever brand order is loaded
    useEffect(() => {
        const loadSubCatOrders = async () => {
            const orders: Record<string, string[]> = {};
            for (const brand of brandOrder) {
                const order = await orderingService.getSubCategoryOrder(brand);
                if (order.length > 0) orders[brand] = order;
            }
            setSubCatOrders(orders);
        };
        if (brandOrder.length > 0) loadSubCatOrders();
    }, [brandOrder]);

    const templateProducts = useMemo(
        () => products.filter(p => template?.brandList.includes(p.brandMain)),
        [products, template]
    );

    // Determine brand order: use config if available, else fall back to template order
    const displayBrandOrder = useMemo(() => {
        const brandsInTemplate = [...new Set(templateProducts.map(p => p.brandMain))];

        if (brandOrder.length > 0) {
            // Use configured order for brands that are in the template
            const ordered = brandOrder.filter(b => brandsInTemplate.includes(b));
            // Append any brands not in config
            const remaining = brandsInTemplate.filter(b => !brandOrder.includes(b));
            return [...ordered, ...remaining];
        }

        // Fall back to template order
        return template?.brandList.filter(b => brandsInTemplate.includes(b)) || brandsInTemplate;
    }, [templateProducts, brandOrder, template]);

    // Group products by brand, then subCategory (in configured order)
    const groupedProducts = useMemo(() => {
        const grouped: Record<string, Record<string, Product[]>> = {};

        for (const p of templateProducts) {
            if (!grouped[p.brandMain]) grouped[p.brandMain] = {};
            if (!grouped[p.brandMain][p.subCategory]) grouped[p.brandMain][p.subCategory] = [];
            grouped[p.brandMain][p.subCategory].push(p);
        }

        // Sort subcategories by configured order
        for (const brand of Object.keys(grouped)) {
            const configOrder = subCatOrders[brand] || [];
            const currentKeys = Object.keys(grouped[brand]);

            // Reorder keys based on config
            const ordered: Record<string, Product[]> = {};
            for (const key of configOrder) {
                if (grouped[brand][key]) ordered[key] = grouped[brand][key];
            }
            for (const key of currentKeys) {
                if (!ordered[key]) ordered[key] = grouped[brand][key];
            }
            grouped[brand] = ordered;
        }

        return grouped;
    }, [templateProducts, subCatOrders]);

    return { templateProducts, displayBrandOrder, groupedProducts };
}
