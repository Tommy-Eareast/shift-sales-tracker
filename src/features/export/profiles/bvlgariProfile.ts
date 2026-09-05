import type { ExportProfile, ProfileInput } from './types';

export const bvlgariProfile: ExportProfile = {
    profileId: 'bvlgari',
    displayName: 'Bvlgari',
    templateName: 'Bvlgari',

    generate(input: ProfileInput): string {
        const lines: string[] = [];
        const esc = (s: string) => `"${s.replace(/"/g, '""')}"`;

        // Header
        lines.push('BVLGARI');
        lines.push('DEPARTURE B');
        lines.push(`Week Ending,${input.endDate}`);
        lines.push('');

        // Table header
        lines.push(
            [
                'Day',
                'Date',
                'Promoter',
                'Shift',
                'HRS',
                'WOMEN Units',
                'WOMEN $',
                'MEN Units',
                'MEN $',
                'LE GEMME Units',
                'LE GEMME $',
                'OTHER Units',
                'OTHER $',
                'Total Units',
                'Total $',
                'NOTES',
            ].join(',')
        );

        // Group submitted shifts by date
        const shiftsByDate = new Map<string, typeof input.submittedShifts>();
        for (const shift of input.submittedShifts) {
            const existing = shiftsByDate.get(shift.recordDate) || [];
            existing.push(shift);
            shiftsByDate.set(shift.recordDate, existing);
        }

        // Generate rows for each day
        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        const start = new Date(input.startDate);
        const end = new Date(input.endDate);

        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            const dateStr = d.toISOString().split('T')[0];
            const dayIndex = d.getDay() === 0 ? 6 : d.getDay() - 1;
            const dayName = days[dayIndex];
            const shifts = shiftsByDate.get(dateStr) || [];

            if (shifts.length === 0) {
                lines.push(`${dayName},${dateStr},,,,,,,,,,,,,,,""`);
                continue;
            }

            const allItems = shifts.flatMap(s => s.items);

            const womenUnits = allItems.filter(i => i.exportCategory === 'WOMEN').reduce((sum, i) => sum + i.count, 0);
            const womenRev = allItems.filter(i => i.exportCategory === 'WOMEN').reduce((sum, i) => sum + i.revenue, 0);
            const menUnits = allItems.filter(i => i.exportCategory === 'MEN').reduce((sum, i) => sum + i.count, 0);
            const menRev = allItems.filter(i => i.exportCategory === 'MEN').reduce((sum, i) => sum + i.revenue, 0);
            const leGemmeUnits = allItems
                .filter(i => i.exportCategory === 'LE GEMME')
                .reduce((sum, i) => sum + i.count, 0);
            const leGemmeRev = allItems
                .filter(i => i.exportCategory === 'LE GEMME')
                .reduce((sum, i) => sum + i.revenue, 0);
            const otherUnits = allItems
                .filter(i => i.exportCategory === 'OTHER' || !i.exportCategory)
                .reduce((sum, i) => sum + i.count, 0);
            const otherRev = allItems
                .filter(i => i.exportCategory === 'OTHER' || !i.exportCategory)
                .reduce((sum, i) => sum + i.revenue, 0);

            const promoterNames = shifts.map(s => s.promoterName).join(' / ');
            const shiftTimes = shifts.map(s => `${s.shiftTimeStart}-${s.shiftTimeEnd}`).join(' / ');
            const notes = shifts
                .map(s => s.note)
                .filter(Boolean)
                .join('; ');

            const totalUnits = womenUnits + menUnits + leGemmeUnits + otherUnits;
            const totalRev = womenRev + menRev + leGemmeRev + otherRev;

            lines.push(
                [
                    esc(dayName),
                    dateStr,
                    esc(promoterNames),
                    esc(shiftTimes),
                    '',
                    womenUnits,
                    womenRev.toFixed(2),
                    menUnits,
                    menRev.toFixed(2),
                    leGemmeUnits,
                    leGemmeRev.toFixed(2),
                    otherUnits,
                    otherRev.toFixed(2),
                    totalUnits,
                    totalRev.toFixed(2),
                    esc(notes),
                ].join(',')
            );
        }

        // Totals row
        const allShifts = input.submittedShifts;
        const allItems = allShifts.flatMap(s => s.items);
        const tWomenUnits = allItems.filter(i => i.exportCategory === 'WOMEN').reduce((sum, i) => sum + i.count, 0);
        const tWomenRev = allItems.filter(i => i.exportCategory === 'WOMEN').reduce((sum, i) => sum + i.revenue, 0);
        const tMenUnits = allItems.filter(i => i.exportCategory === 'MEN').reduce((sum, i) => sum + i.count, 0);
        const tMenRev = allItems.filter(i => i.exportCategory === 'MEN').reduce((sum, i) => sum + i.revenue, 0);
        const tLeGemmeUnits = allItems
            .filter(i => i.exportCategory === 'LE GEMME')
            .reduce((sum, i) => sum + i.count, 0);
        const tLeGemmeRev = allItems
            .filter(i => i.exportCategory === 'LE GEMME')
            .reduce((sum, i) => sum + i.revenue, 0);
        const tOtherUnits = allItems
            .filter(i => i.exportCategory === 'OTHER' || !i.exportCategory)
            .reduce((sum, i) => sum + i.count, 0);
        const tOtherRev = allItems
            .filter(i => i.exportCategory === 'OTHER' || !i.exportCategory)
            .reduce((sum, i) => sum + i.revenue, 0);
        const tTotalUnits = tWomenUnits + tMenUnits + tLeGemmeUnits + tOtherUnits;
        const tTotalRev = tWomenRev + tMenRev + tLeGemmeRev + tOtherRev;

        lines.push(
            [
                'TOTAL',
                '',
                '',
                '',
                '',
                tWomenUnits,
                tWomenRev.toFixed(2),
                tMenUnits,
                tMenRev.toFixed(2),
                tLeGemmeUnits,
                tLeGemmeRev.toFixed(2),
                tOtherUnits,
                tOtherRev.toFixed(2),
                tTotalUnits,
                tTotalRev.toFixed(2),
                '',
            ].join(',')
        );

        return lines.join('\n');
    },
};
