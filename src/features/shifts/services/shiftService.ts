import { shiftRepo } from "../../../db/shiftRepo";
import { salesRepo } from "../../../db/salesRepo";
import { templateRepo } from "../../../db/templateRepo";
import { productRepo } from "../../../db/productRepo";
import { submittedShiftRepo } from "../../../db/submittedShiftRepo";
import type { ShiftRecord, ShiftSummary, ShiftSales } from "../../../types";

export const shiftService = {
    async getAll(): Promise<ShiftRecord[]> {
        return shiftRepo.getAll();
    },

    async getById(shiftId: string): Promise<ShiftRecord | undefined> {
        return shiftRepo.getById(shiftId);
    },

    async getSales(shiftId: string): Promise<ShiftSales[]> {
        return salesRepo.getByShift(shiftId);
    },

    async create(
        templateId: string,
        recordDate: string,
        shiftTimeStart: string,
        shiftTimeEnd: string,
    ): Promise<string> {
        const existing = await shiftRepo.getAll();
        const duplicate = existing.find(
            (s) =>
                s.recordDate === recordDate &&
                s.shiftTimeStart === shiftTimeStart &&
                s.shiftTimeEnd === shiftTimeEnd &&
                s.templateId === templateId,
        );
        if (duplicate) {
            throw new Error(
                "A shift with this date, time, and template already exists.",
            );
        }

        const template = await templateRepo.getById(templateId);
        if (!template) throw new Error("Template not found");

        return shiftRepo.create(
            templateId,
            recordDate,
            shiftTimeStart,
            shiftTimeEnd,
        );
    },

    async update(
        shiftId: string,
        updates: {
            recordDate?: string;
            shiftTimeStart?: string;
            shiftTimeEnd?: string;
        },
    ): Promise<void> {
        await shiftRepo.update(shiftId, updates);
    },

    async submit(shiftId: string, note: string): Promise<void> {
        // 1. Mark as submitted in local shiftRecords
        await shiftRepo.submit(shiftId, note);

        // 2. Create snapshot in submittedShifts
        const shift = await shiftRepo.getById(shiftId);
        if (!shift) throw new Error("Shift not found");

        const template = await templateRepo.getById(shift.templateId);
        const summary = await salesRepo.getSummary(shiftId);
        const salesData = await salesRepo.getByShift(shiftId);
        const products = await productRepo.getAll();

        // Build sales snapshot
        const productMap = new Map(products.map((p) => [p.id, p]));
        const salesJson = salesData
            .filter((s) => s.sellCount > 0)
            .map((s) => {
                const product = productMap.get(s.productId);
                return {
                    fullName: product?.fullName || "Unknown",
                    price: product?.price || 0,
                    count: s.sellCount,
                    revenue: s.sellCount * (product?.price || 0),
                };
            });

        await submittedShiftRepo.add({
            shiftId: shift.shiftId,
            templateId: shift.templateId,
            templateName: template?.templateName || "Unknown",
            recordDate: shift.recordDate,
            shiftDisplayName: shift.shiftDisplayName,
            shiftTimeStart: shift.shiftTimeStart,
            shiftTimeEnd: shift.shiftTimeEnd,
            note,
            submittedAt: new Date().toISOString(),
            totalCount: summary.totalCount,
            totalRevenue: summary.totalRevenue,
            salesJson: JSON.stringify(salesJson),
        });
    },

    async delete(shiftId: string): Promise<void> {
        await shiftRepo.delete(shiftId);
    },

    async getSummary(shiftId: string): Promise<ShiftSummary> {
        return salesRepo.getSummary(shiftId);
    },

    async adjustSales(
        shiftId: string,
        productId: string,
        delta: number,
    ): Promise<void> {
        await salesRepo.adjust(shiftId, productId, delta);
    },
};
