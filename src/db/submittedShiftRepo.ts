import { db, generateUUID } from "./database";
import type { SubmittedShift } from "../types";

/**
 * Repository for permanent records of submitted shifts.
 * These are snapshots that survive promoter deletion of local data.
 */
export const submittedShiftRepo = {
    async add(data: Omit<SubmittedShift, "id">): Promise<string> {
        const id = generateUUID();
        await db.submittedShifts.add({ ...data, id });
        return id;
    },

    async getByShiftId(shiftId: string): Promise<SubmittedShift | undefined> {
        return db.submittedShifts.where("shiftId").equals(shiftId).first();
    },

    async getAll(): Promise<SubmittedShift[]> {
        return db.submittedShifts.toArray();
    },

    async delete(id: string): Promise<void> {
        await db.submittedShifts.delete(id);
    },

    async count(): Promise<number> {
        return db.submittedShifts.count();
    },
};
