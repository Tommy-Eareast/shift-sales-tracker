import Dexie from "dexie";
import type {
    Product,
    ShiftTemplate,
    ShiftRecord,
    ShiftSales,
    OrderingConfig,
} from "../types";

export function generateUUID(): string {
    return crypto.randomUUID();
}

class PerfumeDatabase extends Dexie {
    products!: Dexie.Table<Product, string>;
    shiftTemplates!: Dexie.Table<ShiftTemplate, string>;
    shiftRecords!: Dexie.Table<ShiftRecord, string>;
    shiftSales!: Dexie.Table<ShiftSales, string>;
    orderingConfig!: Dexie.Table<OrderingConfig, string>;

    constructor() {
        super("PerfumeShiftTrackerDB");

        this.version(4).stores({
            products: "id, brandMain, subCategory, sortOrder",
            shiftTemplates: "templateId, sortOrder",
            shiftRecords: "shiftId, recordDate, templateId",
            shiftSales: "id, shiftId, productId, [shiftId+productId]",
            orderingConfig: "id",
        });
    }

    async clearAllData() {
        await this.products.clear();
        await this.shiftTemplates.clear();
        await this.shiftRecords.clear();
        await this.shiftSales.clear();
        await this.orderingConfig.clear();
    }
}

export const db = new PerfumeDatabase();

/**
 * Opens the database and seeds default data if empty.
 * Called once on app startup from main.tsx.
 */
export async function initializeDatabase() {
    try {
        await db.open();
        console.log("Database initialized successfully");

        const templateCount = await db.shiftTemplates.count();
        if (templateCount === 0) {
            console.log("No templates found, adding default templates...");
            await addDefaultTemplates();
        }

        return true;
    } catch (error) {
        console.error("Failed to initialize database:", error);
        return false;
    }
}

async function addDefaultTemplates() {
    const defaultTemplates: ShiftTemplate[] = [
        {
            templateId: generateUUID(),
            templateName: "Interparfum",
            brandList: ["Montblanc", "Coach", "Lacoste", "Jimmy Choo"],
            sortOrder: 0,
            createdAt: new Date().toISOString(),
        },
        {
            templateId: generateUUID(),
            templateName: "Bvlgari Single Brand",
            brandList: ["Bvlgari"],
            sortOrder: 1,
            createdAt: new Date().toISOString(),
        },
        {
            templateId: generateUUID(),
            templateName: "Montblanc Single Brand",
            brandList: ["Montblanc"],
            sortOrder: 2,
            createdAt: new Date().toISOString(),
        },
    ];

    await db.shiftTemplates.bulkAdd(defaultTemplates);
    console.log("Default templates added");
}

export async function addSampleProducts() {
    const sampleProducts: Product[] = [
        {
            id: generateUUID(),
            brandMain: "Montblanc",
            subCategory: "Explorer Series",
            fullName: "Explorer Extreme PF 100ml",
            price: 185,
            sortOrder: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        },
        {
            id: generateUUID(),
            brandMain: "Montblanc",
            subCategory: "Explorer Series",
            fullName: "Explorer Ultra Blue 100ml",
            price: 165,
            sortOrder: 1,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        },
        {
            id: generateUUID(),
            brandMain: "Montblanc",
            subCategory: "Legend Series",
            fullName: "Legend EDP 100ml",
            price: 145,
            sortOrder: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        },
        {
            id: generateUUID(),
            brandMain: "Montblanc",
            subCategory: "Legend Series",
            fullName: "Legend Night EDP 100ml",
            price: 145,
            sortOrder: 1,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        },
        {
            id: generateUUID(),
            brandMain: "Coach",
            subCategory: "Coach For Men",
            fullName: "Coach For Men EDT 100ml",
            price: 135,
            sortOrder: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        },
        {
            id: generateUUID(),
            brandMain: "Coach",
            subCategory: "Coach Floral",
            fullName: "Coach Floral EDP 90ml",
            price: 155,
            sortOrder: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        },
        {
            id: generateUUID(),
            brandMain: "Lacoste",
            subCategory: "L.12.12 Series",
            fullName: "L.12.12 Blanc EDT 100ml",
            price: 115,
            sortOrder: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        },
        {
            id: generateUUID(),
            brandMain: "Lacoste",
            subCategory: "L.12.12 Series",
            fullName: "L.12.12 Noir EDT 100ml",
            price: 125,
            sortOrder: 1,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        },
        {
            id: generateUUID(),
            brandMain: "Jimmy Choo",
            subCategory: "Man Series",
            fullName: "Jimmy Choo Man EDT 100ml",
            price: 140,
            sortOrder: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        },
        {
            id: generateUUID(),
            brandMain: "Bvlgari",
            subCategory: "Man In Black",
            fullName: "Man In Black EDP 100ml",
            price: 175,
            sortOrder: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        },
    ];

    await db.products.bulkAdd(sampleProducts);
    console.log("Sample products added");
}
