import { getSupabase } from '../../../lib/supabaseClient';
import type { ShiftRecord, ShiftSummary, ShiftSales } from '../../../types';
import type {
    SupabaseShiftRow,
    SupabaseShiftSaleRow,
    SupabaseTemplateRow,
    SupabaseProductRow,
} from '../../../types/supabase';
import { shiftSubmitService } from './shiftSubmitService';

const supabase = getSupabase();

export const shiftService = {
    async getAll(): Promise<ShiftRecord[]> {
        const { data: userData } = await supabase.auth.getUser();
        const userId = userData.user?.id;
        if (!userId) throw new Error('Not logged in');

        const { data, error } = await supabase
            .from('shifts')
            .select('*')
            .eq('user_id', userId)
            .order('record_date', { ascending: false });

        if (error) throw new Error(error.message);

        return (data || []).map((s: SupabaseShiftRow) => this.mapShiftRow(s));
    },

    async getById(shiftId: string): Promise<ShiftRecord | null> {
        const { data, error } = await supabase.from('shifts').select('*').eq('id', shiftId).maybeSingle();

        if (error) throw new Error(error.message);
        if (!data) return null;
        return this.mapShiftRow(data as SupabaseShiftRow);
    },

    mapShiftRow(s: SupabaseShiftRow): ShiftRecord {
        return {
            shiftId: s.id,
            templateId: s.template_id,
            recordDate: s.record_date,
            shiftDisplayName: s.shift_display_name,
            shiftTimeStart: s.time_start,
            shiftTimeEnd: s.time_end,
            status: s.status as ShiftRecord['status'],
            note: s.note || '',
            submittedAt: s.submitted_at || '',
            createdAt: s.created_at,
        };
    },

    async create(
        templateId: string,
        recordDate: string,
        shiftTimeStart: string,
        shiftTimeEnd: string
    ): Promise<string> {
        const { data: userData } = await supabase.auth.getUser();
        const userId = userData.user?.id;
        if (!userId) throw new Error('Not logged in');

        const { data: existing } = await supabase
            .from('shifts')
            .select('id')
            .eq('user_id', userId)
            .eq('template_id', templateId)
            .eq('record_date', recordDate)
            .eq('time_start', shiftTimeStart)
            .eq('time_end', shiftTimeEnd)
            .maybeSingle();

        if (existing) {
            throw new Error('A shift with this date, time, and template already exists.');
        }

        const shiftDisplayName = this.buildDisplayName(recordDate, shiftTimeStart, shiftTimeEnd);

        const { data, error } = await supabase
            .from('shifts')
            .insert({
                user_id: userId,
                template_id: templateId,
                record_date: recordDate,
                shift_display_name: shiftDisplayName,
                time_start: shiftTimeStart,
                time_end: shiftTimeEnd,
                status: 'draft',
                note: '',
            })
            .select('id')
            .single();

        if (error) throw new Error(error.message);
        return data.id;
    },

    buildDisplayName(recordDate: string, timeStart: string, timeEnd: string): string {
        const [year, month, day] = recordDate.split('-');
        const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const dayName = days[date.getDay()];
        return `${parseInt(day)}/${month}/${year} ${dayName} ${timeStart}-${timeEnd}`;
    },

    async update(
        shiftId: string,
        updates: { recordDate?: string; shiftTimeStart?: string; shiftTimeEnd?: string }
    ): Promise<void> {
        const shift = await this.getById(shiftId);
        if (!shift) throw new Error('Shift not found');
        if (shift.status === 'submitted') throw new Error('Cannot edit a submitted shift');

        const recordDate = updates.recordDate ?? shift.recordDate;
        const timeStart = updates.shiftTimeStart ?? shift.shiftTimeStart;
        const timeEnd = updates.shiftTimeEnd ?? shift.shiftTimeEnd;
        const shiftDisplayName = this.buildDisplayName(recordDate, timeStart, timeEnd);

        const { error } = await supabase
            .from('shifts')
            .update({
                record_date: recordDate,
                time_start: timeStart,
                time_end: timeEnd,
                shift_display_name: shiftDisplayName,
            })
            .eq('id', shiftId);

        if (error) throw new Error(error.message);
    },

    async getSales(shiftId: string): Promise<ShiftSales[]> {
        const { data, error } = await supabase.from('shift_sales').select('*').eq('shift_id', shiftId);

        if (error) throw new Error(error.message);

        return (data || []).map((s: SupabaseShiftSaleRow) => ({
            id: s.id,
            shiftId: s.shift_id,
            productId: s.product_id,
            sellCount: s.sell_count,
        }));
    },

    async adjustSales(shiftId: string, productId: string, delta: number): Promise<void> {
        const shift = await this.getById(shiftId);
        if (!shift) throw new Error('Shift not found');
        if (shift.status === 'submitted') throw new Error('Cannot adjust submitted shift');

        const { data: productData } = await supabase.from('products').select('price').eq('id', productId).maybeSingle();

        if (!productData) throw new Error('Product not found');

        const { data: existing } = await supabase
            .from('shift_sales')
            .select('*')
            .eq('shift_id', shiftId)
            .eq('product_id', productId)
            .maybeSingle();

        if (existing) {
            const existingRow = existing as SupabaseShiftSaleRow;
            const newCount = Math.max(0, existingRow.sell_count + delta);
            if (newCount === 0) {
                await supabase.from('shift_sales').delete().eq('id', existingRow.id);
            } else {
                await supabase.from('shift_sales').update({ sell_count: newCount }).eq('id', existingRow.id);
            }
        } else if (delta > 0) {
            await supabase
                .from('shift_sales')
                .insert({
                    shift_id: shiftId,
                    product_id: productId,
                    sell_count: delta,
                    price_at_submit: (productData as SupabaseProductRow).price,
                });
        }
    },

    async getSummary(shiftId: string): Promise<ShiftSummary> {
        const shift = await this.getById(shiftId);
        if (!shift) throw new Error('Shift not found');

        const { data: templateData } = await supabase
            .from('templates')
            .select('*')
            .eq('id', shift.templateId)
            .maybeSingle();

        if (!templateData) throw new Error('Template not found');
        const template = templateData as SupabaseTemplateRow;

        const { data: salesData } = await supabase
            .from('shift_sales')
            .select('sell_count, product_id')
            .eq('shift_id', shiftId);

        const summary: ShiftSummary = { brandSummaries: {}, totalCount: 0, totalRevenue: 0 };

        for (const brand of template.brand_list || []) {
            summary.brandSummaries[brand] = { subCategories: {}, brandTotalCount: 0, brandTotalRevenue: 0 };
        }

        const sales = (salesData || []) as SupabaseShiftSaleRow[];
        if (sales.length === 0) return summary;

        // Only fetch products that have sales (optimization)
        const productIds = sales.map(s => s.product_id);
        const { data: productsData } = await supabase.from('products').select('*').in('id', productIds);

        const productMap = new Map((productsData || []).map((p: SupabaseProductRow) => [p.id, p]));

        for (const sale of sales) {
            const product = productMap.get(sale.product_id);
            if (!product) continue;

            const { brand_main, sub_category, price } = product;
            const count = sale.sell_count;
            const revenue = count * price;

            if (!summary.brandSummaries[brand_main]) continue;

            const bs = summary.brandSummaries[brand_main];
            if (!bs.subCategories[sub_category]) {
                bs.subCategories[sub_category] = { subCount: 0, subRevenue: 0 };
            }

            bs.subCategories[sub_category].subCount += count;
            bs.subCategories[sub_category].subRevenue += revenue;
            bs.brandTotalCount += count;
            bs.brandTotalRevenue += revenue;
            summary.totalCount += count;
            summary.totalRevenue += revenue;
        }

        return summary;
    },

    async submit(shiftId: string, note: string): Promise<void> {
        const shift = await this.getById(shiftId);
        if (!shift) throw new Error('Shift not found');
        if (shift.status === 'submitted') throw new Error('Shift already submitted');

        const summary = await this.getSummary(shiftId);
        const sales = await this.getSales(shiftId);

        const { data: templateData } = await supabase
            .from('templates')
            .select('name')
            .eq('id', shift.templateId)
            .maybeSingle();

        const { data: userData } = await supabase.auth.getUser();
        const userId = userData.user?.id;
        if (!userId) throw new Error('Not logged in');

        await shiftSubmitService.createSnapshot({
            shiftId,
            userId,
            templateId: shift.templateId,
            templateName: (templateData as SupabaseTemplateRow | null)?.name || 'Unknown',
            recordDate: shift.recordDate,
            shiftDisplayName: shift.shiftDisplayName,
            shiftTimeStart: shift.shiftTimeStart,
            shiftTimeEnd: shift.shiftTimeEnd,
            note,
            summary,
            sales,
        });

        const { error: updateError } = await supabase
            .from('shifts')
            .update({ status: 'submitted', note, submitted_at: new Date().toISOString() })
            .eq('id', shiftId);

        if (updateError) throw new Error(updateError.message);
    },

    async delete(shiftId: string): Promise<void> {
        const { error } = await supabase.from('shifts').delete().eq('id', shiftId);
        if (error) throw new Error(error.message);
    },
};
