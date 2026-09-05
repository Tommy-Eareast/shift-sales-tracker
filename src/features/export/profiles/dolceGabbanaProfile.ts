import type { ExportProfile, ProfileInput } from './types';

function extractSize(fullName: string): string {
    const lower = fullName.toLowerCase();
    if (lower.includes('100ml')) return '100ML';
    if (lower.includes('50ml')) return '50ML';
    if (lower.includes('75ml')) return '75ML';
    if (lower.includes('60ml')) return '60ML';
    if (lower.includes('125ml')) return '125ML';
    if (lower.includes('30ml')) return '30ML';
    if (lower.includes('10ml')) return '10ML';
    if (lower.includes('set')) return 'SET';
    if (lower.includes('coffret') || lower.includes('coff')) return 'COFFRET';
    return '';
}

export const dolceGabbanaProfile: ExportProfile = {
    profileId: 'dolceGabbana',
    displayName: 'Dolce & Gabbana',
    templateName: 'Dolce Gabbana',

    generate(input: ProfileInput): string {
        const lines: string[] = [];
        const esc = (s: string) => `"${s.replace(/"/g, '""')}"`;

        // Header
        lines.push('DOLCE & GABBANA');
        lines.push('SALES REPORT');
        lines.push('Sydney International');
        lines.push(`Week Ending,${input.endDate}`);
        lines.push('');

        // Column headers
        const days = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
        const headerCols = ['PRODUCT', 'SIZE', 'PRICE'];
        for (const day of days) {
            headerCols.push(`${day} UNITS`, `${day} SALES`);
        }
        lines.push(headerCols.join(','));

        // Date list
        const start = new Date(input.startDate);
        const end = new Date(input.endDate);
        const dateList: string[] = [];
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            dateList.push(d.toISOString().split('T')[0]);
        }

        // Build sales lookup
        const salesByProduct = new Map<string, Map<string, { units: number; revenue: number }>>();
        for (const shift of input.submittedShifts) {
            for (const item of shift.items) {
                if (!salesByProduct.has(item.fullName)) {
                    salesByProduct.set(item.fullName, new Map());
                }
                const dateMap = salesByProduct.get(item.fullName)!;
                const existing = dateMap.get(shift.recordDate) || { units: 0, revenue: 0 };
                dateMap.set(shift.recordDate, {
                    units: existing.units + item.count,
                    revenue: existing.revenue + item.revenue,
                });
            }
        }

        const womenProducts = input.products.filter(p => p.exportCategory === 'WOMEN');
        const menProducts = input.products.filter(p => p.exportCategory === 'MEN');

        const generateProductRows = (products: typeof input.products, sectionName: string) => {
            lines.push(esc(sectionName));
            for (const product of products) {
                const size = extractSize(product.fullName);
                const row: string[] = [esc(product.fullName), esc(size), product.price.toFixed(2)];
                const sales = salesByProduct.get(product.fullName) || new Map();
                for (const dateStr of dateList) {
                    const daySales = sales.get(dateStr) || { units: 0, revenue: 0 };
                    row.push(String(daySales.units));
                    row.push(daySales.revenue.toFixed(2));
                }
                lines.push(row.join(','));
            }
            lines.push('');
        };

        generateProductRows(womenProducts, 'WOMEN');
        generateProductRows(menProducts, 'MEN');

        return lines.join('\n');
    },
};
