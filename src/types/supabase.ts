export type SupabaseTemplateRow = {
    id: string;
    name: string;
    brand_list: string[];
    sort_order: number;
    export_profile: string;
    created_at: string;
};

export type SupabaseProductRow = {
    id: string;
    brand_main: string;
    sub_category: string;
    full_name: string;
    price: number;
    sort_order: number;
    created_at: string;
    updated_at: string;
};

export type SupabaseShiftRow = {
    id: string;
    user_id: string;
    template_id: string;
    record_date: string;
    shift_display_name: string;
    time_start: string;
    time_end: string;
    status: string;
    note: string;
    submitted_at: string | null;
    created_at: string;
};

export type SupabaseShiftSaleRow = {
    id: string;
    shift_id: string;
    product_id: string;
    sell_count: number;
    price_at_submit: number;
};

export type SupabaseShiftSaleSummaryRow = { sell_count: number; price_at_submit: number };

export type SupabaseShiftSaleWithProductRow = { sell_count: number; price_at_submit: number; product_id: string };

export type SupabaseProfileRow = {
    id: string;
    email: string;
    display_name: string;
    role: 'promoter' | 'manager';
    created_at: string;
};

export type GroupedSaleItem = { fullName: string; subCategory: string; price: number; count: number; revenue: number };
