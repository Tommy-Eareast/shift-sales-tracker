import type { ExportProfile } from './types';

/**
 * Dior template:
 * Daily rows with 7 category columns + productivity metric.
 * Categories: MISS DIOR, JADORE, SAUVAGE, LA COLLECTION PRIVE, OTHER FRAGRANCES, MAKEUP, SKINCARE
 */
export const diorProfile: ExportProfile = {
    profileId: 'dior',
    displayName: 'Dior',
    templateName: 'Dior',

    generate(input) {
        const lines: string[] = [];
        const esc = (s: string) => `"${s.replace(/"/g, '""')}"`;

        lines.push('DIOR');
        lines.push('Sales Report');
        lines.push('DEPARTURE B');
        lines.push(`Week Ending,${input.endDate}`);
        lines.push('');

        // Header
        lines.push(
            [
                'Day',
                'Date',
                'Shift',
                'Promoter',
                'Hours',
                'MISS DIOR Units',
                'MISS DIOR $',
                'JADORE Units',
                'JADORE $',
                'SAUVAGE Units',
                'SAUVAGE $',
                'LA COLLECTION PRIVE Units',
                'LA COLLECTION PRIVE $',
                'OTHER FRAGRANCES Units',
                'OTHER FRAGRANCES $',
                'MAKEUP Units',
                'MAKEUP $',
                'SKINCARE Units',
                'SKINCARE $',
                'Total Units',
                'Total $',
                'Productivity',
                'NOTES',
            ].join(',')
        );

        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        const start = new Date(input.startDate);
        const end = new Date(input.endDate);

        // Group shifts by date
        const shiftsByDate = new Map<string, typeof input.submittedShifts>();
        for (const shift of input.submittedShifts) {
            const existing = shiftsByDate.get(shift.recordDate) || [];
            existing.push(shift);
            shiftsByDate.set(shift.recordDate, existing);
        }

        const categories = [
            'MISS DIOR',
            'JADORE',
            'SAUVAGE',
            'LA COLLECTION PRIVE',
            'OTHER FRAGRANCES',
            'MAKEUP',
            'SKINCARE',
        ];

        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            const dateStr = d.toISOString().split('T')[0];
            const dayIndex = d.getDay() === 0 ? 6 : d.getDay() - 1;
            const dayName = days[dayIndex];
            const shifts = shiftsByDate.get(dateStr) || [];

            if (shifts.length === 0) {
                lines.push(`${dayName},${dateStr},,,,,,,,,,,,,,,,,,,,,,,`);
                continue;
            }

            const allItems = shifts.flatMap(s => s.items);
            const promoterNames = shifts.map(s => s.promoterName).join(' / ');
            const shiftTimes = shifts.map(s => `${s.shiftTimeStart}-${s.shiftTimeEnd}`).join(' / ');
            const notes = shifts
                .map(s => s.note)
                .filter(Boolean)
                .join('; ');

            const row: string[] = [esc(dayName), dateStr, esc(shiftTimes), esc(promoterNames), ''];

            let totalUnits = 0;
            let totalRevenue = 0;

            for (const cat of categories) {
                const catItems = allItems.filter(i => i.exportCategory === cat);
                const catUnits = catItems.reduce((sum, i) => sum + i.count, 0);
                const catRev = catItems.reduce((sum, i) => sum + i.revenue, 0);
                row.push(String(catUnits), catRev.toFixed(2));
                totalUnits += catUnits;
                totalRevenue += catRev;
            }

            row.push(String(totalUnits), totalRevenue.toFixed(2), '', esc(notes));
            lines.push(row.join(','));
        }

        // Totals row
        lines.push(''); // Simplified — manager can add totals in Excel template
        return lines.join('\n');
    },
};
