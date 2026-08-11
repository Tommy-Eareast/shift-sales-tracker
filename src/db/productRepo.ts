import { db, generateUUID } from "./database";
import type { Product } from "../types";

/**
 * Repository for product CRUD operations.
 * Handles raw database queries only — no business logic.
 */
export const productRepo = {
    async getAll(): Promise<Product[]> {
        return db.products.orderBy("sortOrder").toArray();
    },

    async getByBrand(brand: string): Promise<Product[]> {
        return db.products.where("brandMain").equals(brand).sortBy("sortOrder");
    },

    async getById(id: string): Promise<Product | undefined> {
        return db.products.get(id);
    },

    async getByIds(ids: string[]): Promise<(Product | undefined)[]> {
        return db.products.bulkGet(ids);
    },

    async add(
        data: Omit<Product, "id" | "sortOrder" | "createdAt" | "updatedAt">,
    ): Promise<string> {
        const id = generateUUID();
        const now = new Date().toISOString();

        const existing = await db.products
            .where("brandMain")
            .equals(data.brandMain)
            .toArray();
        const maxSortOrder = existing.reduce(
            (max, p) => Math.max(max, p.sortOrder),
            -1,
        );

        await db.products.add({
            ...data,
            id,
            sortOrder: maxSortOrder + 1,
            createdAt: now,
            updatedAt: now,
        });
        return id;
    },

    async update(id: string, updates: Partial<Product>): Promise<void> {
        await db.products.update(id, {
            ...updates,
            updatedAt: new Date().toISOString(),
        });
    },

    async delete(id: string): Promise<void> {
        await db.products.delete(id);
    },

    async updateSortOrders(
        items: { id: string; sortOrder: number }[],
    ): Promise<void> {
        const ids = items.map((i) => i.id);
        const products = await db.products.bulkGet(ids);

        const updated = items
            .map(({ id, sortOrder }) => {
                const product = products.find((p) => p?.id === id);
                if (!product) return null;
                return {
                    ...product,
                    sortOrder,
                    updatedAt: new Date().toISOString(),
                };
            })
            .filter(Boolean) as Product[];

        await db.products.bulkPut(updated);
    },
};
