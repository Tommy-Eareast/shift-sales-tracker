import { db, generateUUID } from "./database";
import type { ShiftSales, ShiftSummary } from "../types";

export const salesRepo = {
    async getByShift(shiftId: string): Promise<ShiftSales[]> {
        return db.shiftSales.where("shiftId").equals(shiftId).toArray();
    },

    async adjust(
        shiftId: string,
        productId: string,
        delta: number,
    ): Promise<void> {
        const existing = await db.shiftSales
            .where({ shiftId, productId })
            .first();

        if (existing) {
            const newCount = Math.max(0, existing.sellCount + delta);
            if (newCount === 0) {
                await db.shiftSales.delete(existing.id);
            } else {
                await db.shiftSales.update(existing.id, {
                    sellCount: newCount,
                });
            }
        } else if (delta > 0) {
            await db.shiftSales.add({
                id: generateUUID(),
                shiftId,
                productId,
                sellCount: delta,
            });
        }
    },

    async getSummary(shiftId: string): Promise<ShiftSummary> {
        const shift = await db.shiftRecords.get(shiftId);
        if (!shift) throw new Error("Shift record not found");

        const template = await db.shiftTemplates.get(shift.templateId);
        if (!template) throw new Error("Template not found");

        const salesList = await db.shiftSales
            .where("shiftId")
            .equals(shiftId)
            .toArray();

        const summary: ShiftSummary = {
            brandSummaries: {},
            totalCount: 0,
            totalRevenue: 0,
        };

        for (const brand of template.brandList) {
            summary.brandSummaries[brand] = {
                subCategories: {},
                brandTotalCount: 0,
                brandTotalRevenue: 0,
            };
        }

        for (const sale of salesList) {
            const product = await db.products.get(sale.productId);
            if (!product) continue;

            const { brandMain, subCategory, price } = product;
            const count = sale.sellCount;
            const revenue = count * price;

            if (!summary.brandSummaries[brandMain]) continue;

            const bs = summary.brandSummaries[brandMain];
            if (!bs.subCategories[subCategory]) {
                bs.subCategories[subCategory] = { subCount: 0, subRevenue: 0 };
            }

            bs.subCategories[subCategory].subCount += count;
            bs.subCategories[subCategory].subRevenue += revenue;
            bs.brandTotalCount += count;
            bs.brandTotalRevenue += revenue;
            summary.totalCount += count;
            summary.totalRevenue += revenue;
        }

        return summary;
    },
};
