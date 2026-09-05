export type ExportProfile = {
    profileId: string;
    displayName: string;
    templateName: string;
    generate: (data: ProfileInput) => string;
};

export type ProfileInput = {
    startDate: string;
    endDate: string;
    submittedShifts: {
        recordDate: string;
        shiftTimeStart: string;
        shiftTimeEnd: string;
        promoterName: string;
        note: string;
        items: {
            fullName: string;
            subCategory: string;
            price: number;
            count: number;
            revenue: number;
            exportCategory?: string;
        }[];
        totalCount: number;
        totalRevenue: number;
    }[];
    products: { fullName: string; subCategory: string; price: number; exportCategory?: string }[];
};
