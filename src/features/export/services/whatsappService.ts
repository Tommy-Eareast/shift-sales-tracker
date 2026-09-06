import { getSupabase } from '../../../lib/supabaseClient';
import type { GroupedSaleItem, SupabaseProductRow } from '../../../types/supabase';

const supabase = getSupabase();

export const whatsappService = {
    async generateSummary(shiftId: string): Promise<string> {
        const { data: shift } = await supabase.from('shifts').select('*').eq('id', shiftId).maybeSingle();
        if (!shift) throw new Error('Shift not found');

        const { data: template } = await supabase
            .from('templates')
            .select('*')
            .eq('id', shift.template_id)
            .maybeSingle();

        // Get sales with product_id, then look up products separately
        const { data: salesData } = await supabase
            .from('shift_sales')
            .select('sell_count, price_at_submit, product_id')
            .eq('shift_id', shiftId);

        const { data: productsData } = await supabase.from('products').select('*');
        const productMap = new Map((productsData || []).map((p: SupabaseProductRow) => [p.id, p]));

        const lines: string[] = [];
        lines.push(`📊 *Sales Report - ${shift.shift_display_name}*`);
        lines.push(`Template: ${template?.name || 'Unknown'}`);
        lines.push('');

        const grouped: Record<string, Record<string, GroupedSaleItem[]>> = {};
        let totalCount = 0;
        let totalRevenue = 0;

        for (const sale of salesData || []) {
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
                price: sale.price_at_submit,
                revenue,
            });
            totalCount += count;
            totalRevenue += revenue;
        }

        for (const brand of Object.keys(grouped)) {
            lines.push(`*${brand}*`);
            for (const subCat of Object.keys(grouped[brand])) {
                lines.push(`_${subCat}_`);
                for (const item of grouped[brand][subCat]) {
                    lines.push(`• ${item.fullName}: ${item.count} × $${item.price} = $${item.revenue}`);
                }
            }
            lines.push('');
        }

        lines.push(`💰 *Total: $${totalRevenue}* (${totalCount} units)`);
        return lines.join('\n');
    },

    async copyToClipboard(text: string): Promise<boolean> {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch {
            const textarea = document.createElement('textarea');
            textarea.value = text;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            return true;
        }
    },
};
