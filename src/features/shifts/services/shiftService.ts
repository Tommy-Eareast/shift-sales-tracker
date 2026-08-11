import { shiftRepo } from "../../../db/shiftRepo";
import { salesRepo } from "../../../db/salesRepo";
import { templateRepo } from "../../../db/templateRepo";
import { validateShift } from "../../../utils/validation";
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
