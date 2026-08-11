import { shiftRepo } from "../../../db/shiftRepo";
import { templateRepo } from "../../../db/templateRepo";
import { salesRepo } from "../../../db/salesRepo";
import { productRepo } from "../../../db/productRepo";
import { formatExportFilename } from "../../../utils/date";

export const exportService = {
    /**
     * Generate CSV content for a shift.
     */
    async generateCsv(
        shiftId: string,
    ): Promise<{ content: string; filename: string }> {
        const shift = await shiftRepo.getById(shiftId);
        if (!shift) throw new Error("Shift not found");

        const template = await templateRepo.getById(shift.templateId);
        if (!template) throw new Error("Template not found");

        const summary = await salesRepo.getSummary(shiftId);
        const salesData = await salesRepo.getByShift(shiftId);
        const allProducts = await productRepo.getAll();

        const salesMap = new Map<string, number>();
        salesData.forEach((sale) =>
            salesMap.set(sale.productId, sale.sellCount),
        );

        const SEP = ",";
        const fmt = (num: number) => `$${num.toFixed(2)}`;
        const rows: string[] = [];

        rows.push(`"${shift.shiftDisplayName}"`);
        rows.push(`"Template: ${template.templateName}"`);
        rows.push("");
        rows.push(
            [
                "Product Name",
                "Revenue (AUD)",
                "Unit Price (AUD)",
                "Units Sold",
            ].join(SEP),
        );

        const templateProducts = allProducts.filter((p) =>
            template.brandList.includes(p.brandMain),
        );

        const brandGroups: Record<string, typeof templateProducts> = {};
        for (const p of templateProducts) {
            if (!brandGroups[p.brandMain]) brandGroups[p.brandMain] = [];
            brandGroups[p.brandMain].push(p);
        }

        for (const brand of template.brandList) {
            const brandProducts = brandGroups[brand];
            if (!brandProducts) continue;

            const subCatGroups: Record<string, typeof brandProducts> = {};
            for (const p of brandProducts) {
                if (!subCatGroups[p.subCategory])
                    subCatGroups[p.subCategory] = [];
                subCatGroups[p.subCategory].push(p);
            }

            for (const subCat of Object.keys(subCatGroups)) {
                rows.push("");
                rows.push(`"--- ${subCat} ---"`);

                let subCatRevenue = 0;
                let subCatUnits = 0;

                for (const product of subCatGroups[subCat]) {
                    const count = salesMap.get(product.id) || 0;
                    const revenue = count * product.price;
                    subCatRevenue += revenue;
                    subCatUnits += count;

                    rows.push(
                        [
                            `"${product.fullName}"`,
                            fmt(revenue),
                            fmt(product.price),
                            count,
                        ].join(SEP),
                    );
                }

                rows.push(
                    [
                        `"${subCat} Total"`,
                        fmt(subCatRevenue),
                        "",
                        subCatUnits,
                    ].join(SEP),
                );
            }
        }

        rows.push("");
        rows.push("----------------------------------------");
        rows.push(
            [
                `"GRAND TOTAL"`,
                fmt(summary.totalRevenue),
                "",
                summary.totalCount,
            ].join(SEP),
        );

        const filename = `${formatExportFilename(shift.recordDate, shift.shiftTimeStart)}_${template.templateName.replace(/\s+/g, "_")}.csv`;

        return { content: rows.join("\n"), filename };
    },

    /**
     * Trigger a browser download of a CSV file.
     */
    downloadCsv(content: string, filename: string): void {
        const BOM = "\uFEFF";
        const blob = new Blob([BOM + content], {
            type: "text/csv;charset=utf-8;",
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    },
};
