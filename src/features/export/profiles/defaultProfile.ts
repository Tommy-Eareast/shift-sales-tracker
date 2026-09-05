import type { ExportProfile } from './types';

export const defaultProfile: ExportProfile = {
    profileId: 'default',
    displayName: 'Default (Summary)',
    templateName: 'default',

    generate(input) {
        const lines: string[] = [];
        const esc = (s: string) => `"${s.replace(/"/g, '""')}"`;

        lines.push('Template,Date,Time,Promoter,Units,Revenue');
        for (const shift of input.submittedShifts) {
            lines.push(
                [
                    esc(input.startDate),
                    shift.recordDate,
                    `${shift.shiftTimeStart}-${shift.shiftTimeEnd}`,
                    esc(shift.promoterName),
                    shift.totalCount,
                    shift.totalRevenue.toFixed(2),
                ].join(',')
            );
        }
        return lines.join('\n');
    },
};
