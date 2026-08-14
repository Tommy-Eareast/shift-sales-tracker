import { shiftRepo } from "../../../db/shiftRepo";
import { templateRepo } from "../../../db/templateRepo";
import { salesRepo } from "../../../db/salesRepo";
import { productRepo } from "../../../db/productRepo";

/**
 * Service for generating WhatsApp-friendly text summaries of shifts.
 * Used by ExportPage to copy sales reports to clipboard.
 */
export const whatsappService = {
    /**
     * Generate a human-readable summary of a shift for WhatsApp sharing.
     * Returns plain text with WhatsApp-style markdown (*bold*, _italic_).
     */
    async generateSummary(shiftId: string): Promise<string> {
        const shift = await shiftRepo.getById(shiftId);
        if (!shift) throw new Error("Shift not found");

        const template = await templateRepo.getById(shift.templateId);
        if (!template) throw new Error("Template not found");

        const summary = await salesRepo.getSummary(shiftId);
        const salesData = await salesRepo.getByShift(shiftId);
        const allProducts = await productRepo.getAll();

        const salesMap = new Map<string, number>();
        salesData.forEach((s) => salesMap.set(s.productId, s.sellCount));

        const lines: string[] = [];

        // Header
        lines.push(`📊 *Sales Report - ${shift.shiftDisplayName}*`);
        lines.push("");
        lines.push("");

        // Filter products for this template
        const templateProducts = allProducts.filter((p) =>
            template.brandList.includes(p.brandMain),
        );

        // Group by brand
        const brandGroups: Record<string, typeof templateProducts> = {};
        for (const p of templateProducts) {
            if (!brandGroups[p.brandMain]) brandGroups[p.brandMain] = [];
            brandGroups[p.brandMain].push(p);
        }

        // Iterate brands in template order
        for (const brand of template.brandList) {
            const products = brandGroups[brand];
            if (!products) continue;

            const soldProducts = products.filter(
                (p) => (salesMap.get(p.id) || 0) > 0,
            );
            if (soldProducts.length === 0) continue;

            lines.push(`*${brand}*`);

            // Group by subCategory
            const subCats: Record<string, typeof products> = {};
            for (const p of soldProducts) {
                if (!subCats[p.subCategory]) subCats[p.subCategory] = [];
                subCats[p.subCategory].push(p);
            }

            for (const subCat of Object.keys(subCats)) {
                lines.push(`_${subCat}_`);
                for (const p of subCats[subCat]) {
                    const count = salesMap.get(p.id) || 0;
                    const revenue = count * p.price;
                    lines.push(
                        `• ${p.fullName}: ${count} × $${p.price} = $${revenue}`,
                    );
                }
            }
            lines.push("");
        }

        // Grand total
        lines.push(
            `💰 *Total: $${summary.totalRevenue}* (${summary.totalCount} units)`,
        );

        return lines.join("\n");
    },

    /**
     * Copy text to clipboard with fallback for older browsers.
     * Returns true if copy succeeded.
     */
    async copyToClipboard(text: string): Promise<boolean> {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch {
            // Fallback for browsers without clipboard API
            const textarea = document.createElement("textarea");
            textarea.value = text;
            textarea.style.position = "fixed";
            textarea.style.opacity = "0";
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand("copy");
            document.body.removeChild(textarea);
            return true;
        }
    },
};
