import { templateRepo } from "../../../db/templateRepo";
import { validateTemplate } from "../../../utils/validation";
import type { ShiftTemplate } from "../../../types";

export const templateService = {
    async getAll(): Promise<ShiftTemplate[]> {
        return templateRepo.getAll();
    },

    async getById(id: string): Promise<ShiftTemplate | undefined> {
        return templateRepo.getById(id);
    },

    async add(data: {
        templateName: string;
        brandList: string[];
    }): Promise<string> {
        const allTemplates = await templateRepo.getAll();
        const validation = validateTemplate(
            { templateName: data.templateName, selectedBrands: data.brandList },
            allTemplates,
        );
        if (!validation.valid) throw new Error(validation.error);

        return templateRepo.add(data);
    },

    async delete(templateId: string): Promise<void> {
        const usageCount = await templateRepo.countShiftsUsing(templateId);
        if (usageCount > 0) {
            throw new Error(
                `Cannot delete template: ${usageCount} shift(s) are using this template.`,
            );
        }
        await templateRepo.delete(templateId);
    },

    async reorder(templateIds: string[]): Promise<void> {
        const items = templateIds.map((id, i) => ({
            templateId: id,
            sortOrder: i,
        }));
        await templateRepo.updateSortOrders(items);
    },
};
