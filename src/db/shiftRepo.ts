import { db, generateUUID } from "./database";
import type { ShiftRecord } from "../types";
import { formatShiftDisplayName } from "../utils/date";

export const shiftRepo = {
    async getAll(): Promise<ShiftRecord[]> {
        const records = await db.shiftRecords.toArray();
        return records.sort(
            (a, b) =>
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime(),
        );
    },

    async getById(shiftId: string): Promise<ShiftRecord | undefined> {
        return db.shiftRecords.get(shiftId);
    },

    async create(
        templateId: string,
        recordDate: string,
        shiftTimeStart: string,
        shiftTimeEnd: string,
    ): Promise<string> {
        const shiftId = generateUUID();
        const shiftDisplayName = formatShiftDisplayName(
            recordDate,
            shiftTimeStart,
            shiftTimeEnd,
        );

        await db.shiftRecords.add({
            shiftId,
            templateId,
            recordDate,
            shiftDisplayName,
            shiftTimeStart,
            shiftTimeEnd,
            status: "draft",
            note: "",
            submittedAt: "",
            createdAt: new Date().toISOString(),
        });

        return shiftId;
    },

    async update(
        shiftId: string,
        updates: Partial<
            Pick<ShiftRecord, "recordDate" | "shiftTimeStart" | "shiftTimeEnd">
        >,
    ): Promise<void> {
        const shift = await db.shiftRecords.get(shiftId);
        if (!shift) throw new Error("Shift not found");

        const recordDate = updates.recordDate ?? shift.recordDate;
        const timeStart = updates.shiftTimeStart ?? shift.shiftTimeStart;
        const timeEnd = updates.shiftTimeEnd ?? shift.shiftTimeEnd;
        const shiftDisplayName = formatShiftDisplayName(
            recordDate,
            timeStart,
            timeEnd,
        );

        await db.shiftRecords.update(shiftId, {
            ...updates,
            shiftDisplayName,
        });
    },

    async submit(shiftId: string, note: string): Promise<void> {
        const shift = await db.shiftRecords.get(shiftId);
        if (!shift) throw new Error("Shift not found");

        if (shift.status === "submitted") {
            throw new Error("Shift already submitted");
        }

        await db.shiftRecords.update(shiftId, {
            status: "submitted",
            note,
            submittedAt: new Date().toISOString(),
        });
    },

    async delete(shiftId: string): Promise<void> {
        // UI layer handles extra confirmation for recent shifts.
        await db.shiftSales.where("shiftId").equals(shiftId).delete();
        await db.shiftRecords.delete(shiftId);
    },
};
