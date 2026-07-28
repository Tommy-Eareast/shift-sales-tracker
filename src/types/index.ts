export type Product = {
    id: string;
    brandMain: string;
    subCategory: string;
    fullName: string;
    price: number;
    sortOrder: number; // Sort order within subCategory
    createdAt: string;
    updatedAt: string;
};

export type ShiftTemplate = {
    templateId: string;
    templateName: string;
    brandList: string[];
    sortOrder: number;
    createdAt: string;
};

export type ShiftRecord = {
    shiftId: string;
    templateId: string;
    recordDate: string;
    shiftDisplayName: string;
    shiftTimeStart: string;
    shiftTimeEnd: string;
    createdAt: string;
};

export type ShiftSales = {
    id: string;
    shiftId: string;
    productId: string;
    sellCount: number;
};

export type SubCategorySummary = {
    subCount: number;
    subRevenue: number;
};

export type BrandSummary = {
    subCategories: Record<string, SubCategorySummary>;
    brandTotalCount: number;
    brandTotalRevenue: number;
};

export type ShiftSummary = {
    brandSummaries: Record<string, BrandSummary>;
    totalCount: number;
    totalRevenue: number;
};

// Ordering configuration stored separately
export type OrderingConfig = {
    id: string; // 'global'
    brandOrder: string[]; // Ordered list of brand names
    subCategoryOrders: Record<string, string[]>; // brand -> ordered subCategory names
    updatedAt: string;
};
