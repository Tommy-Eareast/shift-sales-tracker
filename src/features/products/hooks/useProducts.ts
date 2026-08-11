import { useState, useEffect, useCallback, useMemo } from "react";
import type { Product } from "../../../types";
import { productService } from "../services/productService";

type ProductFormData = {
    brandMain: string;
    subCategory: string;
    fullName: string;
    price: number;
};

/**
 * Hook for managing the product list and CRUD operations.
 * Used by AdminPage.
 */
export function useProducts() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await productService.getSorted();
            setProducts(data);
        } catch (err) {
            setError(
                err instanceof Error ? err.message : "Failed to load products",
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    const distinctValues = useMemo(
        () => productService.getDistinctValues(products),
        [products],
    );

    const getSubCategorySuggestions = useCallback(
        (brandMain: string): string[] =>
            productService.getSubCategorySuggestions(products, brandMain),
        [products],
    );

    const add = useCallback(
        async (data: ProductFormData) => {
            await productService.add(data);
            await load();
        },
        [load],
    );

    const update = useCallback(
        async (id: string, data: Partial<Product>) => {
            await productService.update(id, data);
            await load();
        },
        [load],
    );

    const remove = useCallback(
        async (id: string) => {
            await productService.delete(id);
            await load();
        },
        [load],
    );

    const reorderProducts = useCallback(
        async (
            brandMain: string,
            subCategory: string,
            productIds: string[],
        ) => {
            await productService.reorder(brandMain, subCategory, productIds);
            await load();
        },
        [load],
    );

    const reorderBrands = useCallback(
        async (brandOrder: string[]) => {
            await productService.reorderBrands(brandOrder);
            await load();
        },
        [load],
    );

    const reorderSubCategories = useCallback(
        async (brand: string, subCategoryOrder: string[]) => {
            await productService.reorderSubCategories(brand, subCategoryOrder);
            await load();
        },
        [load],
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
        reorderProducts,
        reorderBrands,
        reorderSubCategories,
        refresh: load,
    };
}
