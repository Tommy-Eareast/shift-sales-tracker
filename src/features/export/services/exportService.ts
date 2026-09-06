import { getSupabase } from '../../../lib/supabaseClient';
import { formatExportFilename } from '../../../utils/date';
import type {
    SupabaseProductRow,
    SupabaseShiftRow,
    SupabaseShiftSaleRow,
    SupabaseTemplateRow,
    GroupedSaleItem,
} from '../../../types/supabase';

const supabase = getSupabase();

export const exportService = {
    async generateCsv(shiftId: string): Promise<{ content: string; filename: string }> {
        const { data: shiftData, error: shiftError } = await supabase
            .from('shifts')
            .select('*')
            .eq('id', shiftId)
            .maybeSingle();
        if (shiftError) throw new Error(shiftError.message);
        if (!shiftData) throw new Error('Shift not found');

        const shift = shiftData as SupabaseShiftRow;

        const { data: templateData, error: templateError } = await supabase
            .from('templates')
            .select('*')
            .eq('id', shift.template_id)
            .maybeSingle();
        if (templateError) throw new Error(templateError.message);

        const template = templateData as SupabaseTemplateRow | null;

        const { data: salesData } = await supabase
            .from('shift_sales')
            .select('sell_count, price_at_submit, product_id')
            .eq('shift_id', shiftId);

        const { data: productsData } = await supabase.from('products').select('*');
        const productMap = new Map((productsData || []).map((p: SupabaseProductRow) => [p.id, p]));

        const SEP = ',';
        const fmt = (num: number) => `$${num.toFixed(2)}`;
        const rows: string[] = [];

        rows.push(`"${shift.shift_display_name}"`);
        rows.push(`"Template: ${template?.name || 'Unknown'}"`);
        rows.push('');
        rows.push(['Product Name', 'Revenue (AUD)', 'Unit Price (AUD)', 'Units Sold'].join(SEP));

        let grandTotalRevenue = 0;
        let grandTotalUnits = 0;

        const grouped: Record<string, Record<string, GroupedSaleItem[]>> = {};

        for (const sale of (salesData || []) as SupabaseShiftSaleRow[]) {
            if (sale.sell_count <= 0) continue;
            const product = productMap.get(sale.product_id);
            if (!product) continue;

            const brand = product.brand_main;
            const subCat = product.sub_category;
            const count = sale.sell_count;
            const revenue = count * sale.price_at_submit;

            if (!grouped[brand]) grouped[brand] = {};
            if (!grouped[brand][subCat]) grouped[brand][subCat] = [];

            grouped[brand][subCat].push({
                fullName: product.full_name,
                subCategory: subCat,
                count,
                revenue,
                price: sale.price_at_submit,
            });

            grandTotalRevenue += revenue;
            grandTotalUnits += count;
        }

        for (const brand of Object.keys(grouped)) {
            for (const subCat of Object.keys(grouped[brand])) {
                rows.push('');
                rows.push(`"--- ${subCat} ---"`);
                let subCatRevenue = 0;
                let subCatUnits = 0;

                for (const item of grouped[brand][subCat]) {
                    subCatRevenue += item.revenue;
                    subCatUnits += item.count;
                    rows.push([`"${item.fullName}"`, fmt(item.revenue), fmt(item.price), item.count].join(SEP));
                }

                rows.push([`"${subCat} Total"`, fmt(subCatRevenue), '', subCatUnits].join(SEP));
            }
        }

        rows.push('');
        rows.push('----------------------------------------');
        rows.push([`"GRAND TOTAL"`, fmt(grandTotalRevenue), '', grandTotalUnits].join(SEP));

        const filename = `${formatExportFilename(
            shift.record_date,
            shift.time_start,
            shift.time_end
        )}_${(template?.name || 'export').replace(/\s+/g, '_')}.csv`;

        return { content: rows.join('\n'), filename };
    },

    downloadCsv(content: string, filename: string): void {
        const BOM = '\uFEFF';
        const blob = new Blob([BOM + content], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    },
};
