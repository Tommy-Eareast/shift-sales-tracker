import { getSupabase } from '../../../lib/supabaseClient';
import type { ShiftSummary, ShiftSales } from '../../../types';
import type { SupabaseProductRow } from '../../../types/supabase';

const supabase = getSupabase();

export type SnapshotInput = {
    shiftId: string;
    userId: string;
    templateId: string;
    templateName: string;
    recordDate: string;
    shiftDisplayName: string;
    shiftTimeStart: string;
    shiftTimeEnd: string;
    note: string;
    summary: ShiftSummary;
    sales: ShiftSales[];
};

export type SnapshotItem = { fullName: string; subCategory: string; price: number; count: number; revenue: number };

export const shiftSubmitService = {
    async createSnapshot(input: SnapshotInput): Promise<void> {
        const { data: productsData } = await supabase.from('products').select('*');
        const productMap = new Map((productsData || []).map((p: SupabaseProductRow) => [p.id, p]));

        const salesJson = input.sales
            .filter(s => s.sellCount > 0)
            .map(s => {
                const product = productMap.get(s.productId);
                return {
                    fullName: product?.full_name || 'Unknown',
                    subCategory: product?.sub_category || '',
                    price: product?.price || 0,
                    count: s.sellCount,
                    revenue: s.sellCount * (product?.price || 0),
                } as SnapshotItem;
            });

        const { error } = await supabase
            .from('submitted_shifts')
            .insert({
                shift_id: input.shiftId,
                user_id: input.userId,
                template_id: input.templateId,
                template_name: input.templateName,
                record_date: input.recordDate,
                shift_display_name: input.shiftDisplayName,
                time_start: input.shiftTimeStart,
                time_end: input.shiftTimeEnd,
                note: input.note,
                submitted_at: new Date().toISOString(),
                total_count: input.summary.totalCount,
                total_revenue: input.summary.totalRevenue,
                sales_json: JSON.stringify(salesJson),
            });

        if (error) throw new Error(error.message);
    },
};
