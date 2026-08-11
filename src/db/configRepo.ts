import { db } from "./database";
import type { OrderingConfig } from "../types";

const CONFIG_ID = "global";

/**
 * Repository for the ordering configuration singleton.
 * Stores brand order and sub-category orders for product display.
 */
export const configRepo = {
    async get(): Promise<OrderingConfig> {
        const config = await db.orderingConfig.get(CONFIG_ID);
        if (config) return config;

        const initial: OrderingConfig = {
            id: CONFIG_ID,
            brandOrder: [],
            subCategoryOrders: {},
            updatedAt: new Date().toISOString(),
        };
        await db.orderingConfig.put(initial);
        return initial;
    },

    async updateBrandOrder(brandOrder: string[]): Promise<void> {
        const config = await this.get();
        config.brandOrder = brandOrder;
        config.updatedAt = new Date().toISOString();
        await db.orderingConfig.put(config);
    },

    async updateSubCategoryOrder(
        brand: string,
        subCategoryOrder: string[],
    ): Promise<void> {
        const config = await this.get();
        config.subCategoryOrders[brand] = subCategoryOrder;
        config.updatedAt = new Date().toISOString();
        await db.orderingConfig.put(config);
    },
};
