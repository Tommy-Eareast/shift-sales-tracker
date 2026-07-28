import {
    getShiftRecord,
    getTemplate,
    getShiftSummary,
    getShiftSales,
    getAllProducts,
} from "../db/operations";

export async function exportShiftToCsv(shiftId: string): Promise<string> {
    const shift = await getShiftRecord(shiftId);
    if (!shift) throw new Error("Shift not found");

    const template = await getTemplate(shift.templateId);
    if (!template) throw new Error("Template not found");

    const summary = await getShiftSummary(shiftId);
    const salesData = await getShiftSales(shiftId);
    const allProducts = await getAllProducts();

    // Build sales map
    const salesMap = new Map<string, number>();
    salesData.forEach((sale) => {
        salesMap.set(sale.productId, sale.sellCount);
    });

    const SEP = ",";
    const fmt = (num: number) => `$${num.toFixed(2)}`;

    const csvRows: string[] = [];

    // Header info
    csvRows.push(`"${shift.shiftDisplayName}"`);
    csvRows.push(`"Template: ${template.templateName}"`);
    csvRows.push("");

    // Column headers
    csvRows.push(
        [
            "Product Name",
            "Revenue (AUD)",
            "Unit Price (AUD)",
            "Units Sold",
        ].join(SEP),
    );

    // Filter products for this template's brands
    const templateProducts = allProducts.filter((p) =>
        template.brandList.includes(p.brandMain),
    );

    // Group by brand
    const brandGroups: Record<string, typeof templateProducts> = {};
    for (const product of templateProducts) {
        if (!brandGroups[product.brandMain]) {
            brandGroups[product.brandMain] = [];
        }
        brandGroups[product.brandMain].push(product);
    }

    const orderedBrands = template.brandList.filter((b) => brandGroups[b]);

    for (const brand of orderedBrands) {
        const brandProducts = brandGroups[brand];

        // Group by subCategory
        const subCatGroups: Record<string, typeof brandProducts> = {};
        for (const product of brandProducts) {
            if (!subCatGroups[product.subCategory]) {
                subCatGroups[product.subCategory] = [];
            }
            subCatGroups[product.subCategory].push(product);
        }

        for (const subCat of Object.keys(subCatGroups)) {
            const products = subCatGroups[subCat];
            let subCatRevenue = 0;
            let subCatUnits = 0;

            csvRows.push("");
            csvRows.push(`"--- ${subCat} ---"`);

            for (const product of products) {
                const count = salesMap.get(product.id) || 0;
                const revenue = count * product.price;

                subCatRevenue += revenue;
                subCatUnits += count;

                csvRows.push(
                    [
                        `"${product.fullName}"`,
                        fmt(revenue),
                        fmt(product.price),
                        count,
                    ].join(SEP),
                );
            }

            // Sub category summary row
            csvRows.push(
                [`"${subCat} Total"`, fmt(subCatRevenue), "", subCatUnits].join(
                    SEP,
                ),
            );
        }
    }

    // Grand total
    csvRows.push("");
    csvRows.push("----------------------------------------");
    csvRows.push(
        [
            `"GRAND TOTAL"`,
            fmt(summary.totalRevenue),
            "",
            summary.totalCount,
        ].join(SEP),
    );

    return csvRows.join("\n");
}

export function downloadCsv(content: string, filename: string) {
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
}
