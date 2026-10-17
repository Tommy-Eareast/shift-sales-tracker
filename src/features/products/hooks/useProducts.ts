import { useState, useEffect, useCallback, useMemo } from 'react';
import type { Product } from '../../../types';
import { productService } from '../services/productService';
import { readCache, writeCache } from '../../../utils/cache';

const CACHE_KEY_PRODUCTS = 'products_list';

type ProductFormData = { brandMain: string; subCategory: string; fullName: string; price: number };

export function useProducts() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async (isBackground = false) => {
        if (!isBackground) {
            const cached = readCache<Product[]>(CACHE_KEY_PRODUCTS);
            if (cached) {
                setProducts(cached.data);
                setLoading(false);
            }
        }

        try {
            const data = await productService.getAll();
            setProducts(data);
            writeCache(CACHE_KEY_PRODUCTS, data);
            setError(null);
        } catch (err) {
            if (!isBackground) {
                setError(err instanceof Error ? err.message : 'Failed to load products');
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
    const distinctValues = useMemo(() => productService.getDistinctValues(products), [products]);

    const getSubCategorySuggestions = useCallback(
        (brandMain: string): string[] => productService.getSubCategorySuggestions(products, brandMain),
        [products]
    );

    const add = useCallback(
        async (data: ProductFormData) => {
            await productService.add(data);
            await load(true);
        },
        [load]
    );

    const update = useCallback(
        async (id: string, data: Partial<Product>) => {
            setProducts(prev => prev.map(p => (p.id === id ? { ...p, ...data } : p)));
            try {
                await productService.update(id, data);
            } catch (err) {
                console.error('Update failed:', err);
                await load(true);
            }
        },
        [load]
    );

    const remove = useCallback(
        async (id: string) => {
            setProducts(prev => prev.filter(p => p.id !== id));
            try {
                await productService.delete(id);
            } catch (err) {
                console.error('Delete failed:', err);
                await load(true);
            }
        },
        [load]
    );

    const reorder = useCallback(
        async (productIds: string[]) => {
            setProducts(prev => {
                const idMap = new Map(prev.map(p => [p.id, p]));
                return productIds
                    .map((id, i) => {
                        const p = idMap.get(id);
                        return p ? { ...p, sortOrder: i } : null;
                    })
                    .filter(Boolean) as Product[];
            });
            try {
                await productService.reorder(productIds);
            } catch (err) {
                console.error('Reorder failed:', err);
                await load(true);
            }
        },
        [load]
    );

    return {
        products,
        loading,
        error,
        distinctValues,
        getSubCategorySuggestions,
        add,
        update,
        remove,
        reorder,
        refresh: load,
    };
}
