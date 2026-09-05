export type Product = {
    id: string;
    brandMain: string;
    subCategory: string;
    fullName: string;
    price: number;
    sortOrder: number;
    createdAt: string;
    updatedAt: string;
};

export type ShiftTemplate = {
    templateId: string;
    templateName: string;
    brandList: string[];
    sortOrder: number;
    exportProfile: string;
    createdAt: string;
};

export type ShiftStatus = 'draft' | 'submitted';

export type ShiftRecord = {
    shiftId: string;
    templateId: string;
    recordDate: string;
    shiftDisplayName: string;
    shiftTimeStart: string;
    shiftTimeEnd: string;
    status: ShiftStatus;
    note: string;
    submittedAt: string;
    createdAt: string;
};

export type ShiftSales = { id: string; shiftId: string; productId: string; sellCount: number };

export type SubCategorySummary = { subCount: number; subRevenue: number };

export type BrandSummary = {
    subCategories: Record<string, SubCategorySummary>;
    brandTotalCount: number;
    brandTotalRevenue: number;
};

export type ShiftSummary = { brandSummaries: Record<string, BrandSummary>; totalCount: number; totalRevenue: number };
