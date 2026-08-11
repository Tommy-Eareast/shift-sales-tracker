import { productRepo } from "../../../db/productRepo";
import { configRepo } from "../../../db/configRepo";
import { validateProduct } from "../../../utils/validation";
import type { Product } from "../../../types";

export const productService = {
    /**
     * Get all products sorted by the user's configured brand/sub-category order.
     */
    async getSorted(): Promise<Product[]> {
        const products = await productRepo.getAll();
        const config = await configRepo.get();

        // Group products by brand
        const byBrand: Record<string, Product[]> = {};
        for (const p of products) {
            if (!byBrand[p.brandMain]) byBrand[p.brandMain] = [];
            byBrand[p.brandMain].push(p);
        }

        // Sort each brand's products by subCategory order then sortOrder
        for (const brand of Object.keys(byBrand)) {
            const subCatOrder = config.subCategoryOrders[brand] || [];

            const bySubCat: Record<string, Product[]> = {};
            for (const p of byBrand[brand]) {
                if (!bySubCat[p.subCategory]) bySubCat[p.subCategory] = [];
                bySubCat[p.subCategory].push(p);
            }

            for (const subCat of Object.keys(bySubCat)) {
                bySubCat[subCat].sort((a, b) => a.sortOrder - b.sortOrder);
            }

            const sorted: Product[] = [];
            for (const subCat of subCatOrder) {
                if (bySubCat[subCat]) sorted.push(...bySubCat[subCat]);
            }
            for (const subCat of Object.keys(bySubCat)) {
                if (!subCatOrder.includes(subCat))
                    sorted.push(...bySubCat[subCat]);
            }

            byBrand[brand] = sorted;
        }

        // Flatten in brand order
        const brandOrder =
            config.brandOrder.length > 0
                ? [...config.brandOrder]
                : Object.keys(byBrand);

        const result: Product[] = [];
        for (const brand of brandOrder) {
            if (byBrand[brand]) result.push(...byBrand[brand]);
        }
        for (const brand of Object.keys(byBrand)) {
            if (!brandOrder.includes(brand)) result.push(...byBrand[brand]);
        }

        return result;
    },

    /**
     * Get distinct brands and sub-categories from existing products.
     */
    getDistinctValues(products: Product[]): {
        brands: string[];
        subCategories: string[];
    } {
        const brandSet = new Set<string>();
        const subCatSet = new Set<string>();
        for (const p of products) {
            brandSet.add(p.brandMain);
            subCatSet.add(p.subCategory);
        }
        return {
            brands: Array.from(brandSet).sort(),
            subCategories: Array.from(subCatSet).sort(),
        };
    },

    /**
     * Get sub-category suggestions filtered by brand.
     */
    getSubCategorySuggestions(
        products: Product[],
        brandMain: string,
    ): string[] {
        if (!brandMain) return [];
        const brandProducts = products.filter((p) => p.brandMain === brandMain);
        return [...new Set(brandProducts.map((p) => p.subCategory))].sort();
    },

    /**
     * Add a new product after validation.
     */
    async add(data: {
        brandMain: string;
        subCategory: string;
        fullName: string;
        price: number;
    }): Promise<string> {
        const allProducts = await productRepo.getAll();
        const validation = validateProduct(data, allProducts);
        if (!validation.valid) throw new Error(validation.error);

        return productRepo.add(data);
    },

    /**
     * Update an existing product after validation.
     */
    async update(id: string, data: Partial<Product>): Promise<void> {
        if (data.fullName || data.brandMain) {
            const allProducts = await productRepo.getAll();
            const validation = validateProduct(
                {
                    brandMain: data.brandMain ?? "",
                    subCategory: data.subCategory ?? "",
                    fullName: data.fullName ?? "",
                    price: data.price ?? 0,
                },
                allProducts,
                id,
            );
            if (!validation.valid) throw new Error(validation.error);
        }

        await productRepo.update(id, data);
    },

    /**
     * Delete a product.
     */
    async delete(id: string): Promise<void> {
        await productRepo.delete(id);
    },

    /**
     * Reorder products within a sub-category.
     */
    async reorder(
        _brandMain: string,
        _subCategory: string,
        productIds: string[],
    ): Promise<void> {
        const items = productIds.map((id, i) => ({ id, sortOrder: i }));
        await productRepo.updateSortOrders(items);
    },

    /**
     * Reorder brands globally.
     */
    async reorderBrands(brandOrder: string[]): Promise<void> {
        await configRepo.updateBrandOrder(brandOrder);
    },

    /**
     * Reorder sub-categories within a brand.
     */
    async reorderSubCategories(
        brand: string,
        subCategoryOrder: string[],
    ): Promise<void> {
        await configRepo.updateSubCategoryOrder(brand, subCategoryOrder);
    },
};
