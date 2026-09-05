import { useState, useEffect, useCallback, useMemo } from 'react';
import type { Product } from '../../../types';
import { productService } from '../services/productService';

type ProductFormData = { brandMain: string; subCategory: string; fullName: string; price: number };

export function useProducts() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await productService.getAll();
            setProducts(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load products');
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
            await load();
        },
        [load]
    );

    const update = useCallback(
        async (id: string, data: Partial<Product>) => {
            // Optimistic update
            setProducts(prev => prev.map(p => (p.id === id ? { ...p, ...data } : p)));
            try {
                await productService.update(id, data);
            } catch (err) {
                console.error(err);
                await load(); // Revert on error
            }
        },
        [load]
    );

    const remove = useCallback(
        async (id: string) => {
            // Optimistic update
            setProducts(prev => prev.filter(p => p.id !== id));
            try {
                await productService.delete(id);
            } catch (err) {
                console.error(err);
                await load(); // Revert on error
            }
        },
        [load]
    );

    const reorder = useCallback(
        async (productIds: string[]) => {
            // Optimistic update: immediately reorder local state
            setProducts(prev => {
                const idMap = new Map(prev.map(p => [p.id, p]));
                return productIds
                    .map((id, index) => {
                        const p = idMap.get(id);
                        return p ? { ...p, sortOrder: index } : null;
                    })
                    .filter(Boolean) as Product[];
            });

            try {
                await productService.reorder(productIds);
            } catch (err) {
                console.error(err);
                await load(); // Revert on error
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
