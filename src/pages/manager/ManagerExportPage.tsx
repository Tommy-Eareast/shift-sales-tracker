import { useState, useEffect } from 'react';
import { managerService } from '../../features/manager/services/managerService';
import { getExportProfileById } from '../../features/export/profiles';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { AlertModal } from '../../components/ui/AlertModal';
import { WeekSelector } from '../../features/manager/components/WeekSelector';
import { getWeekRange, formatDate, addDays } from '../../utils/week';
import type { ShiftTemplate } from '../../types';

export default function ManagerExportPage() {
    const [templates, setTemplates] = useState<ShiftTemplate[]>([]);
    const [selectedTemplateId, setSelectedTemplateId] = useState('');
    const [weekOffset, setWeekOffset] = useState(0);
    const [customStart, setCustomStart] = useState('');
    const [customEnd, setCustomEnd] = useState('');
    const [useCustomRange, setUseCustomRange] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [alertInfo, setAlertInfo] = useState<{ title: string; message: string } | null>(null);

    useEffect(() => {
        managerService.getAllTemplates().then(data => {
            setTemplates(data);
            if (data.length > 0) setSelectedTemplateId(data[0].templateId);
        });
    }, []);

    const currentWeek = getWeekRange(addDays(new Date(), weekOffset * 7));
    const effectiveStart = useCustomRange ? customStart : formatDate(currentWeek.monday);
    const effectiveEnd = useCustomRange ? customEnd : formatDate(currentWeek.sunday);

    const selectedTemplate = templates.find(t => t.templateId === selectedTemplateId);
    const profile = selectedTemplate ? getExportProfileById(selectedTemplate.exportProfile || 'default') : null;

    const handleExport = async () => {
        if (!selectedTemplateId || !effectiveStart || !effectiveEnd) return;
        setExporting(true);
        try {
            const input = await managerService.getExportInput(selectedTemplateId, effectiveStart, effectiveEnd);

            if (input.submittedShifts.length === 0) {
                setAlertInfo({
                    title: 'No Data',
                    message: 'No submitted shifts found for this template and date range.',
                });
                return;
            }

            const content = profile
                ? profile.generate(input)
                : input.submittedShifts
                      .map(
                          s =>
                              `${s.promoterName},${s.recordDate},${s.shiftTimeStart}-${s.shiftTimeEnd},${s.totalCount},${s.totalRevenue.toFixed(2)}`
                      )
                      .join('\n');

            const BOM = '\uFEFF';
            const blob = new Blob([BOM + content], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${selectedTemplate?.templateName || 'export'}_${effectiveStart}_${effectiveEnd}.csv`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (err) {
            setAlertInfo({ title: 'Error', message: err instanceof Error ? err.message : 'Export failed' });
        } finally {
            setExporting(false);
        }
    };

    return (
        <div className="space-y-4">
            <Card className="p-6">
                <h3 className="text-lg font-semibold text-stone-900 mb-5 tracking-tight">Export</h3>

                <div className="mb-5">
                    <label className="block text-xs font-medium text-stone-500 mb-1.5 uppercase tracking-wider">
                        Template
                    </label>
                    <select
                        value={selectedTemplateId}
                        onChange={e => setSelectedTemplateId(e.target.value)}
                        className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-2.5 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-300"
                    >
                        {templates.map(t => (
                            <option key={t.templateId} value={t.templateId}>
                                {t.templateName}
                            </option>
                        ))}
                    </select>
                </div>

                <WeekSelector
                    weekOffset={weekOffset}
                    onPrevWeek={() => {
                        setWeekOffset(weekOffset - 1);
                        setUseCustomRange(false);
                    }}
                    onNextWeek={() => {
                        setWeekOffset(weekOffset + 1);
                        setUseCustomRange(false);
                    }}
                    onUseCustomRange={() => setUseCustomRange(!useCustomRange)}
                    useCustomRange={useCustomRange}
                />

                {useCustomRange && (
                    <div className="grid grid-cols-2 gap-3 mb-5">
                        <div>
                            <label className="block text-xs font-medium text-stone-500 mb-1 uppercase tracking-wider">
                                Start
                            </label>
                            <input
                                type="date"
                                value={customStart}
                                onChange={e => setCustomStart(e.target.value)}
                                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-2.5 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-300"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-stone-500 mb-1 uppercase tracking-wider">
                                End
                            </label>
                            <input
                                type="date"
                                value={customEnd}
                                onChange={e => setCustomEnd(e.target.value)}
                                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-2.5 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-300"
                            />
                        </div>
                    </div>
                )}

                <p className="text-xs text-stone-400 mb-4">
                    Exporting:{' '}
                    <span className="font-mono">
                        {effectiveStart} to {effectiveEnd}
                    </span>
                    {profile && profile.profileId !== 'default' && (
                        <span className="ml-2 text-emerald-600">({profile.displayName} format)</span>
                    )}
                </p>

                <Button
                    variant="primary"
                    size="lg"
                    fullWidth
                    onClick={handleExport}
                    disabled={exporting || !selectedTemplateId}
                >
                    {exporting ? 'Exporting...' : 'Export CSV'}
                </Button>
            </Card>

            <AlertModal
                isOpen={alertInfo !== null}
                title={alertInfo?.title || ''}
                message={alertInfo?.message || ''}
                onClose={() => setAlertInfo(null)}
            />
        </div>
    );
}
