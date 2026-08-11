import { db, generateUUID } from "./database";
import type { ShiftTemplate } from "../types";

export const templateRepo = {
    async getAll(): Promise<ShiftTemplate[]> {
        return db.shiftTemplates.orderBy("sortOrder").toArray();
    },

    async getById(templateId: string): Promise<ShiftTemplate | undefined> {
        return db.shiftTemplates.get(templateId);
    },

    async add(
        data: Omit<ShiftTemplate, "templateId" | "sortOrder" | "createdAt">,
    ): Promise<string> {
        const templateId = generateUUID();
        const all = await db.shiftTemplates.toArray();
        const maxSortOrder = all.reduce(
            (max, t) => Math.max(max, t.sortOrder),
            -1,
        );

        await db.shiftTemplates.add({
            ...data,
            templateId,
            sortOrder: maxSortOrder + 1,
            createdAt: new Date().toISOString(),
        });
        return templateId;
    },

    async delete(templateId: string): Promise<void> {
        await db.shiftTemplates.delete(templateId);
    },

    async updateSortOrders(
        items: { templateId: string; sortOrder: number }[],
    ): Promise<void> {
        const ids = items.map((i) => i.templateId);
        const templates = await db.shiftTemplates.bulkGet(ids);

        const updated = ids
            .map((id, index) => {
                const t = templates.find((t) => t?.templateId === id);
                if (!t) return null;
                return { ...t, sortOrder: index };
            })
            .filter(Boolean) as ShiftTemplate[];

        await db.shiftTemplates.bulkPut(updated);
    },

    async countShiftsUsing(templateId: string): Promise<number> {
        return db.shiftRecords.where("templateId").equals(templateId).count();
    },
};
