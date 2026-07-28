import { db, generateUUID } from "./database";
import type {
    Product,
    ShiftTemplate,
    ShiftRecord,
    ShiftSales,
    ShiftSummary,
    OrderingConfig,
} from "../types";

// ============ Product Operations ============

export async function getAllProducts(): Promise<Product[]> {
    return await db.products.orderBy("sortOrder").toArray();
}

export async function getProductsByBrand(brand: string): Promise<Product[]> {
    return await db.products
        .where("brandMain")
        .equals(brand)
        .sortBy("sortOrder");
}

export async function addProduct(
    product: Omit<Product, "id" | "sortOrder" | "createdAt" | "updatedAt">,
): Promise<string> {
    const id = generateUUID();
    const now = new Date().toISOString();

    // Get max sortOrder within the same brand
    const existingProducts = await db.products
        .where("brandMain")
        .equals(product.brandMain)
        .toArray();

    const maxSortOrder = existingProducts.reduce(
        (max, p) => Math.max(max, p.sortOrder),
        -1,
    );

    await db.products.add({
        ...product,
        id,
        sortOrder: maxSortOrder + 1,
        createdAt: now,
        updatedAt: now,
    });

    return id;
}

export async function updateProduct(
    id: string,
    updates: Partial<Product>,
): Promise<void> {
    await db.products.update(id, {
        ...updates,
        updatedAt: new Date().toISOString(),
    });
}

export async function deleteProduct(id: string): Promise<void> {
    await db.products.delete(id);
}

// ============ Template Operations ============

export async function getAllTemplates(): Promise<ShiftTemplate[]> {
    return await db.shiftTemplates.orderBy("sortOrder").toArray();
}

export async function getTemplate(
    templateId: string,
): Promise<ShiftTemplate | undefined> {
    return await db.shiftTemplates.get(templateId);
}

export async function addTemplate(
    template: Omit<ShiftTemplate, "templateId" | "sortOrder" | "createdAt">,
): Promise<string> {
    const templateId = generateUUID();

    // Get max sortOrder
    const allTemplates = await db.shiftTemplates.toArray();
    const maxSortOrder = allTemplates.reduce(
        (max, t) => Math.max(max, t.sortOrder),
        -1,
    );

    await db.shiftTemplates.add({
        ...template,
        templateId,
        sortOrder: maxSortOrder + 1,
        createdAt: new Date().toISOString(),
    });
    return templateId;
}

export async function deleteTemplate(templateId: string): Promise<void> {
    const shiftsUsingTemplate = await db.shiftRecords
        .where("templateId")
        .equals(templateId)
        .count();

    if (shiftsUsingTemplate > 0) {
        throw new Error(
            `Cannot delete template: ${shiftsUsingTemplate} shift(s) are using this template.`,
        );
    }

    await db.shiftTemplates.delete(templateId);
}

export async function updateTemplateSortOrder(
    templateIds: string[],
): Promise<void> {
    const templates = await db.shiftTemplates.bulkGet(templateIds);

    const updatedTemplates = templateIds
        .map((id, index) => {
            const template = templates.find((t) => t?.templateId === id);
            if (!template) return null;
            return {
                ...template,
                sortOrder: index,
            };
        })
        .filter(Boolean) as ShiftTemplate[];

    await db.shiftTemplates.bulkPut(updatedTemplates);
}

// ============ Shift Record Operations ============

export async function getAllShiftRecords(): Promise<ShiftRecord[]> {
    const records = await db.shiftRecords.toArray();
    return records.sort(
        (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
}

export async function getShiftRecord(
    shiftId: string,
): Promise<ShiftRecord | undefined> {
    return await db.shiftRecords.get(shiftId);
}

export async function createShiftRecord(
    templateId: string,
    recordDate: string,
    shiftTimeStart: string,
    shiftTimeEnd: string,
): Promise<string> {
    const shiftId = generateUUID();
    const template = await db.shiftTemplates.get(templateId);

    if (!template) {
        throw new Error("Template not found");
    }

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
        createdAt: new Date().toISOString(),
    });

    return shiftId;
}

export async function updateShiftRecord(
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
}

export async function deleteShiftRecord(shiftId: string): Promise<void> {
    await db.shiftSales.where("shiftId").equals(shiftId).delete();
    await db.shiftRecords.delete(shiftId);
}

// ============ Shift Sales Operations ============

export async function adjustSalesCount(
    shiftId: string,
    productId: string,
    delta: number,
): Promise<void> {
    const existingRecord = await db.shiftSales
        .where({ shiftId, productId })
        .first();

    if (existingRecord) {
        const newCount = Math.max(0, existingRecord.sellCount + delta);
        if (newCount === 0) {
            await db.shiftSales.delete(existingRecord.id);
        } else {
            await db.shiftSales.update(existingRecord.id, {
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
}

export async function getShiftSales(shiftId: string): Promise<ShiftSales[]> {
    return await db.shiftSales.where("shiftId").equals(shiftId).toArray();
}

// ============ Summary ============

export async function getShiftSummary(shiftId: string): Promise<ShiftSummary> {
    const shiftRecord = await db.shiftRecords.get(shiftId);
    if (!shiftRecord) {
        throw new Error("Shift record not found");
    }

    const template = await db.shiftTemplates.get(shiftRecord.templateId);
    if (!template) {
        throw new Error("Template not found");
    }

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

        if (!summary.brandSummaries[brandMain]) {
            continue;
        }

        const brandSummary = summary.brandSummaries[brandMain];

        if (!brandSummary.subCategories[subCategory]) {
            brandSummary.subCategories[subCategory] = {
                subCount: 0,
                subRevenue: 0,
            };
        }

        brandSummary.subCategories[subCategory].subCount += count;
        brandSummary.subCategories[subCategory].subRevenue += revenue;

        brandSummary.brandTotalCount += count;
        brandSummary.brandTotalRevenue += revenue;

        summary.totalCount += count;
        summary.totalRevenue += revenue;
    }

    return summary;
}

// ============ Helper Functions ============

function formatShiftDisplayName(
    recordDate: string,
    shiftTimeStart: string,
    shiftTimeEnd: string,
): string {
    const [year, month, day] = recordDate.split("-");
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const dayName = days[date.getDay()];
    // Use DD/MM/YYYY format with padded month
    return `${parseInt(day)}/${month}/${year} ${dayName} ${shiftTimeStart}-${shiftTimeEnd}`;
}

export function getDistinctValues(products: Product[]): {
    brands: string[];
    subCategories: string[];
} {
    const brandSet = new Set<string>();
    const subCatSet = new Set<string>();

    for (const product of products) {
        brandSet.add(product.brandMain);
        subCatSet.add(product.subCategory);
    }

    return {
        brands: Array.from(brandSet).sort(),
        subCategories: Array.from(subCatSet).sort(),
    };
}

// ============ Ordering Config Operations ============

export async function getOrderingConfig(): Promise<OrderingConfig> {
    let config = await db.orderingConfig.get("global");
    if (!config) {
        config = {
            id: "global",
            brandOrder: [],
            subCategoryOrders: {},
            updatedAt: new Date().toISOString(),
        };
        await db.orderingConfig.put(config);
    }
    return config;
}

export async function updateBrandOrder(brandOrder: string[]): Promise<void> {
    const config = await getOrderingConfig();
    config.brandOrder = brandOrder;
    config.updatedAt = new Date().toISOString();
    await db.orderingConfig.put(config);
}

export async function updateSubCategoryOrder(
    brand: string,
    subCategoryOrder: string[],
): Promise<void> {
    const config = await getOrderingConfig();
    config.subCategoryOrders[brand] = subCategoryOrder;
    config.updatedAt = new Date().toISOString();
    await db.orderingConfig.put(config);
}

// Update sort orders for products within a subCategory
export async function updateProductSortOrder(
    brandMain: string,
    subCategory: string,
    productIds: string[],
): Promise<void> {
    for (let i = 0; i < productIds.length; i++) {
        await db.products.update(productIds[i], {
            sortOrder: i,
            updatedAt: new Date().toISOString(),
        });
    }
}

export async function getProductsSorted(): Promise<Product[]> {
    const products = await db.products.toArray();
    const config = await getOrderingConfig();

    // Group products by brand
    const byBrand: Record<string, Product[]> = {};
    for (const p of products) {
        if (!byBrand[p.brandMain]) byBrand[p.brandMain] = [];
        byBrand[p.brandMain].push(p);
    }

    // Sort each brand's products
    for (const brand of Object.keys(byBrand)) {
        const subCatOrder = config.subCategoryOrders[brand] || [];

        // Group by subCategory
        const bySubCat: Record<string, Product[]> = {};
        for (const p of byBrand[brand]) {
            if (!bySubCat[p.subCategory]) bySubCat[p.subCategory] = [];
            bySubCat[p.subCategory].push(p);
        }

        // Sort products within each subCategory by sortOrder
        for (const subCat of Object.keys(bySubCat)) {
            bySubCat[subCat].sort((a, b) => a.sortOrder - b.sortOrder);
        }

        // Flatten subcategories in configured order
        const sorted: Product[] = [];
        for (const subCat of subCatOrder) {
            if (bySubCat[subCat]) {
                sorted.push(...bySubCat[subCat]);
            }
        }
        // Add any subcategories not in the order config
        for (const subCat of Object.keys(bySubCat)) {
            if (!subCatOrder.includes(subCat)) {
                sorted.push(...bySubCat[subCat]);
            }
        }

        byBrand[brand] = sorted;
    }

    // Flatten brands in configured order
    const brandOrder =
        config.brandOrder.length > 0
            ? [...config.brandOrder]
            : Object.keys(byBrand);

    const result: Product[] = [];

    // Add brands in configured order
    for (const brand of brandOrder) {
        if (byBrand[brand]) {
            result.push(...byBrand[brand]);
        }
    }
    // Add any brands not in order config
    for (const brand of Object.keys(byBrand)) {
        if (!brandOrder.includes(brand)) {
            result.push(...byBrand[brand]);
        }
    }

    return result;
}
