import type { ExportProfile } from './types';

/**
 * Amouage template:
 * Simple daily summary + comments. No product breakdown.
 */
export const amouageProfile: ExportProfile = {
    profileId: 'amouage',
    displayName: 'Amouage',
    templateName: 'Amouage',

    generate(input) {
        const lines: string[] = [];
        const esc = (s: string) => `"${s.replace(/"/g, '""')}"`;

        lines.push('AMOUAGE SALES REPORT');
        lines.push('DEPARTURE B');
        lines.push(`Week Ending,${input.endDate}`);
        lines.push('');

        // Header
        lines.push('Day,Date,Shift,Promoter,Hours,Total Units,Total $,Comments');

        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        const start = new Date(input.startDate);
        const end = new Date(input.endDate);

        const shiftsByDate = new Map<string, typeof input.submittedShifts>();
        for (const shift of input.submittedShifts) {
            const existing = shiftsByDate.get(shift.recordDate) || [];
            existing.push(shift);
            shiftsByDate.set(shift.recordDate, existing);
        }

        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            const dateStr = d.toISOString().split('T')[0];
            const dayIndex = d.getDay() === 0 ? 6 : d.getDay() - 1;
            const dayName = days[dayIndex];
            const shifts = shiftsByDate.get(dateStr) || [];

            if (shifts.length === 0) {
                lines.push(`${dayName},${dateStr},,,,,,`);
                continue;
            }

            const promoterNames = shifts.map(s => s.promoterName).join(' / ');
            const shiftTimes = shifts.map(s => `${s.shiftTimeStart}-${s.shiftTimeEnd}`).join(' / ');
            const totalUnits = shifts.reduce((sum, s) => sum + s.totalCount, 0);
            const totalRev = shifts.reduce((sum, s) => sum + s.totalRevenue, 0);
            const comments = shifts
                .map(s => s.note)
                .filter(Boolean)
                .join('; ');

            lines.push(
                [
                    esc(dayName),
                    dateStr,
                    esc(shiftTimes),
                    esc(promoterNames),
                    '',
                    totalUnits,
                    totalRev.toFixed(2),
                    esc(comments),
                ].join(',')
            );
        }

        // Totals
        const totalUnits = input.submittedShifts.reduce((sum, s) => sum + s.totalCount, 0);
        const totalRev = input.submittedShifts.reduce((sum, s) => sum + s.totalRevenue, 0);
        lines.push(`Total,,,,,${totalUnits},${totalRev.toFixed(2)},`);

        return lines.join('\n');
    },
};
