import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useShifts } from '../../features/shifts/hooks/useShifts';
import { useTemplates } from '../../features/templates/hooks/useTemplates';
import { Card } from '../../components/ui/Card';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import { AlertModal } from '../../components/ui/AlertModal';
import { CopyButton } from '../../components/ui/CopyButton';
import { DeleteIcon } from '../../components/ui/icons';
import type { ShiftRecord } from '../../types';

/**
 * Days threshold — matches the manager's Sales page window.
 * Shifts older than this and submitted move into History.
 */
const HISTORY_THRESHOLD_DAYS = 14;

function isWithinDays(dateString: string, days: number): boolean {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    const cutoffStr = cutoff.toISOString().split('T')[0];
    return dateString >= cutoffStr;
}

function getMonthKey(dateString: string): string {
    const [year, month] = dateString.split('-');
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${monthNames[parseInt(month) - 1]} ${year}`;
}

export default function HistoryPage() {
    const navigate = useNavigate();
    const { shifts, summaries, loading, error, remove } = useShifts();
    const { templates } = useTemplates();

    const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
    const [alertInfo, setAlertInfo] = useState<{ title: string; message: string } | null>(null);

    // Filter: submitted only, older than threshold
    const archivedShifts = useMemo(() => {
        return shifts.filter(s => s.status === 'submitted' && !isWithinDays(s.recordDate, HISTORY_THRESHOLD_DAYS));
    }, [shifts]);

    // Group by month, sorted newest first
    const groupedByMonth = useMemo(() => {
        const grouped: Record<string, ShiftRecord[]> = {};
        for (const shift of archivedShifts) {
            const key = getMonthKey(shift.recordDate);
            if (!grouped[key]) grouped[key] = [];
            grouped[key].push(shift);
        }
        // Sort within each month: newest first
        for (const key of Object.keys(grouped)) {
            grouped[key].sort((a, b) => b.recordDate.localeCompare(a.recordDate));
        }
        // Return as sorted array of [monthKey, shifts]
        return Object.entries(grouped).sort((a, b) => {
            // Sort months by year then month (newest first)
            const [aMonth, aYear] = a[0].split(' ');
            const [bMonth, bYear] = b[0].split(' ');
            if (aYear !== bYear) return parseInt(bYear) - parseInt(aYear);
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            return months.indexOf(bMonth) - months.indexOf(aMonth);
        });
    }, [archivedShifts]);

    const handleDeleteConfirm = async () => {
        if (!deleteTarget) return;
        try {
            await remove(deleteTarget.id);
        } catch (e) {
            setAlertInfo({ title: 'Error', message: e instanceof Error ? e.message : 'Failed' });
        }
        setDeleteTarget(null);
    };

    const renderShiftCard = (shift: ShiftRecord) => {
        const t = templates.find(x => x.templateId === shift.templateId);
        const s = summaries[shift.shiftId];
        return (
            <Card key={shift.shiftId} interactive onClick={() => navigate(`/shift/${shift.shiftId}`)}>
                <div className="flex items-center justify-between">
                    <div className="flex-1">
                        <div className="flex items-center gap-2.5">
                            <span
                                className="w-2 h-2 rounded-full flex-shrink-0"
                                style={{ backgroundColor: '#10b981' }}
                            />
                            <h3 className="font-semibold text-stone-900 text-sm">{shift.shiftDisplayName}</h3>
                        </div>
                        <p className="text-xs text-stone-400 mt-1 ml-[18px]">{t?.templateName || 'Unknown'}</p>
                        {s && (
                            <div className="flex items-center gap-4 mt-2 ml-[18px]">
                                <span className="text-xs text-stone-500">
                                    <span className="font-semibold text-stone-700">{s.totalCount}</span> sold
                                </span>
                                <span className="text-xs font-semibold" style={{ color: '#5b8c7a' }}>
                                    ${s.totalRevenue}
                                </span>
                            </div>
                        )}
                    </div>
                    <div className="flex items-center gap-0.5 ml-2">
                        <CopyButton
                            shiftId={shift.shiftId}
                            onError={msg => setAlertInfo({ title: 'Error', message: msg })}
                        />
                        <button
                            onClick={e => {
                                e.stopPropagation();
                                setDeleteTarget({ id: shift.shiftId, name: shift.shiftDisplayName });
                            }}
                            className="p-1.5 rounded-lg text-stone-400 hover:text-red-500 hover:bg-red-50"
                        >
                            <DeleteIcon className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </Card>
        );
    };

    if (loading) {
        return (
            <div className="space-y-3">
                <Skeleton rows={2} height="h-20" />
                <Skeleton rows={3} height="h-20" />
            </div>
        );
    }

    if (error) {
        return (
            <Card className="p-6 text-center">
                <p className="text-red-500 text-sm">{error}</p>
            </Card>
        );
    }

    return (
        <div>
            <div className="mb-6">
                <h2 className="text-lg font-semibold text-stone-900 tracking-tight">History</h2>
                <p className="text-xs text-stone-400 mt-1">Submissions older than {HISTORY_THRESHOLD_DAYS} days</p>
            </div>

            {archivedShifts.length === 0 ? (
                <EmptyState
                    icon="📚"
                    title="No archived shifts yet"
                    description="Shifts older than 14 days will appear here"
                />
            ) : (
                <div className="space-y-3">
                    {groupedByMonth.map(([monthKey, shiftsInMonth], index) => (
                        <div key={monthKey}>
                            <div className={`flex items-center gap-3 mb-4 ${index > 0 ? 'pt-4' : ''}`}>
                                <p className="text-xs font-semibold text-stone-600 uppercase tracking-wider">
                                    {monthKey}
                                </p>
                                <span className="text-xs text-stone-400">
                                    {shiftsInMonth.length} shift{shiftsInMonth.length !== 1 ? 's' : ''}
                                </span>
                                <div className="flex-1 h-px bg-stone-200" />
                            </div>
                            <div className="space-y-3">{shiftsInMonth.map(renderShiftCard)}</div>
                        </div>
                    ))}
                </div>
            )}

            <ConfirmModal
                isOpen={deleteTarget !== null}
                onCancel={() => setDeleteTarget(null)}
                onConfirm={handleDeleteConfirm}
                title="Delete Shift"
                message={`Delete "${deleteTarget?.name}"? This cannot be undone.`}
                confirmLabel="Delete"
                danger
            />

            <AlertModal
                isOpen={alertInfo !== null}
                title={alertInfo?.title || ''}
                message={alertInfo?.message || ''}
                onClose={() => setAlertInfo(null)}
            />
        </div>
    );
}
