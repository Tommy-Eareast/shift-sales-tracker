import { getSupabase } from '../../../lib/supabaseClient';
import type { ShiftTemplate } from '../../../types';
import type { SupabaseTemplateRow, SupabaseProductRow, GroupedSaleItem } from '../../../types/supabase';
import type { ProfileInput } from '../../export/profiles/types';

const supabase = getSupabase();

export type ManagerShiftView = {
    shiftId: string;
    templateId: string;
    templateName: string;
    recordDate: string;
    shiftDisplayName: string;
    shiftTimeStart: string;
    shiftTimeEnd: string;
    promoterName: string;
    note: string;
    submittedAt: string;
    totalCount: number;
    totalRevenue: number;
    items: GroupedSaleItem[];
};

export type ExportRow = {
    promoterName: string;
    shiftDate: string;
    shiftTime: string;
    items: GroupedSaleItem[];
    totalCount: number;
    totalRevenue: number;
};

type SubmittedShiftRow = {
    id: string;
    shift_id: string;
    user_id: string;
    template_id: string;
    template_name: string;
    record_date: string;
    shift_display_name: string;
    time_start: string;
    time_end: string;
    note: string;
    submitted_at: string;
    total_count: number;
    total_revenue: number;
    sales_json: string;
};

type ProfileSummary = { id: string; display_name: string };

export const managerService = {
    async getAllTemplates(): Promise<ShiftTemplate[]> {
        const { data, error } = await supabase.from('templates').select('*').order('sort_order');
        if (error) throw new Error(error.message);
        return (data || []).map((t: SupabaseTemplateRow) => ({
            templateId: t.id,
            templateName: t.name,
            brandList: t.brand_list || [],
            sortOrder: t.sort_order,
            exportProfile: t.export_profile || 'default',
            createdAt: t.created_at,
        }));
    },

    async getSubmittedShifts(): Promise<ManagerShiftView[]> {
        const { data, error } = await supabase
            .from('submitted_shifts')
            .select('*')
            .order('record_date', { ascending: false });

        if (error) {
            console.error('getSubmittedShifts error:', error.message);
            throw new Error(error.message);
        }

        const shifts = (data || []) as SubmittedShiftRow[];

        const { data: profilesData } = await supabase.from('profiles').select('id, display_name');

        const profileMap = new Map<string, string>();
        for (const p of (profilesData || []) as ProfileSummary[]) {
            profileMap.set(p.id, p.display_name);
        }

        return shifts.map(shift => ({
            shiftId: shift.shift_id,
            templateId: shift.template_id,
            templateName: shift.template_name,
            recordDate: shift.record_date,
            shiftDisplayName: shift.shift_display_name,
            shiftTimeStart: shift.time_start,
            shiftTimeEnd: shift.time_end,
            promoterName: profileMap.get(shift.user_id) || 'Unknown',
            note: shift.note || '',
            submittedAt: shift.submitted_at || '',
            totalCount: shift.total_count,
            totalRevenue: shift.total_revenue,
            items: JSON.parse(shift.sales_json || '[]') as GroupedSaleItem[],
        }));
    },

    getDistinctDates(shifts: ManagerShiftView[], templateId: string): string[] {
        return [...new Set(shifts.filter(s => s.templateId === templateId).map(s => s.recordDate))].sort().reverse();
    },

    getShiftsForDate(shifts: ManagerShiftView[], templateId: string, date: string): ManagerShiftView[] {
        return shifts
            .filter(s => s.templateId === templateId && s.recordDate === date)
            .sort((a, b) => a.shiftTimeStart.localeCompare(b.shiftTimeStart));
    },

    /**
     * Get all data needed for export profiles.
     * Fetches submitted shifts + products for a template within a date range.
     */
    async getExportInput(templateId: string, startDate: string, endDate: string): Promise<ProfileInput> {
        // Fetch submitted shifts for this template + date range
        const { data: shiftsData, error: shiftsError } = await supabase
            .from('submitted_shifts')
            .select('*')
            .eq('template_id', templateId)
            .gte('record_date', startDate)
            .lte('record_date', endDate)
            .order('record_date');

        if (shiftsError) throw new Error(shiftsError.message);

        // Fetch profiles for promoter names
        const { data: profilesData } = await supabase.from('profiles').select('id, display_name');

        const profileMap = new Map<string, string>();
        for (const p of (profilesData || []) as ProfileSummary[]) {
            profileMap.set(p.id, p.display_name);
        }

        // Fetch template brand list
        const { data: templateData } = await supabase
            .from('templates')
            .select('brand_list')
            .eq('id', templateId)
            .maybeSingle();

        const brandList = (templateData as { brand_list: string[] } | null)?.brand_list || [];

        let products: ProfileInput['products'] = [];

        if (brandList.length > 0) {
            const { data: productsData } = await supabase
                .from('products')
                .select('*')
                .in('brand_main', brandList)
                .order('sort_order');

            products = (productsData || []).map((p: SupabaseProductRow & { export_category?: string }) => ({
                fullName: p.full_name,
                subCategory: p.sub_category,
                price: p.price,
                exportCategory: p.export_category,
            }));
        }

        // Build submitted shifts with items
        const submittedShifts: ProfileInput['submittedShifts'] = [];

        for (const shift of (shiftsData || []) as SubmittedShiftRow[]) {
            // Parse sales_json — it contains { fullName, subCategory, price, count, revenue }
            const rawItems = JSON.parse(shift.sales_json || '[]') as {
                fullName: string;
                subCategory: string;
                price: number;
                count: number;
                revenue: number;
            }[];

            // Attach export_category
            const productMap = new Map(products.map(p => [p.fullName, p]));
            const enrichedItems = rawItems.map(item => ({
                fullName: item.fullName,
                subCategory: item.subCategory || '',
                price: item.price,
                count: item.count,
                revenue: item.revenue,
                exportCategory: productMap.get(item.fullName)?.exportCategory,
            }));

            submittedShifts.push({
                recordDate: shift.record_date,
                shiftTimeStart: shift.time_start,
                shiftTimeEnd: shift.time_end,
                promoterName: profileMap.get(shift.user_id) || 'Unknown',
                note: shift.note || '',
                items: enrichedItems,
                totalCount: shift.total_count,
                totalRevenue: shift.total_revenue,
            });
        }

        return { startDate, endDate, submittedShifts, products };
    },

    async getExportData(templateId: string, startDate: string, endDate: string): Promise<ExportRow[]> {
        const { data: shiftsData, error: shiftsError } = await supabase
            .from('submitted_shifts')
            .select('*')
            .eq('template_id', templateId)
            .gte('record_date', startDate)
            .lte('record_date', endDate)
            .order('record_date');

        if (shiftsError) throw new Error(shiftsError.message);

        const shifts = (shiftsData || []) as SubmittedShiftRow[];

        const { data: profilesData } = await supabase.from('profiles').select('id, display_name');

        const profileMap = new Map<string, string>();
        for (const p of (profilesData || []) as ProfileSummary[]) {
            profileMap.set(p.id, p.display_name);
        }

        const rows: ExportRow[] = [];

        for (const shift of shifts) {
            const salesJson = JSON.parse(shift.sales_json || '[]') as GroupedSaleItem[];

            rows.push({
                promoterName: profileMap.get(shift.user_id) || 'Unknown',
                shiftDate: shift.record_date,
                shiftTime: `${shift.time_start}-${shift.time_end}`,
                items: salesJson,
                totalCount: shift.total_count,
                totalRevenue: shift.total_revenue,
            });
        }

        return rows;
    },
};
