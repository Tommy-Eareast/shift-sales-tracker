import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useShifts } from '../../features/shifts/hooks/useShifts';
import { useTemplates } from '../../features/templates/hooks/useTemplates';
import { Card } from '../../components/ui/Card';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { Button } from '../../components/ui/Button';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import { CopyButton } from '../../components/ui/CopyButton';
import { CheckboxCard } from '../../components/ui/CheckboxCard';
import { DeleteIcon } from '../../components/ui/icons';
import type { ShiftRecord } from '../../types';

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
    const { shifts, summaries, loading, error, remove, removeMany } = useShifts();
    const { templates } = useTemplates();

    const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
    const [selectMode, setSelectMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

    const archivedShifts = useMemo(() => {
        return shifts.filter(s => s.status === 'submitted' && !isWithinDays(s.recordDate, HISTORY_THRESHOLD_DAYS));
    }, [shifts]);

    const groupedByMonth = useMemo(() => {
        const grouped: Record<string, ShiftRecord[]> = {};
        for (const shift of archivedShifts) {
            const key = getMonthKey(shift.recordDate);
            if (!grouped[key]) grouped[key] = [];
            grouped[key].push(shift);
        }
        for (const key of Object.keys(grouped)) {
            grouped[key].sort((a, b) => b.recordDate.localeCompare(a.recordDate));
        }
        return Object.entries(grouped).sort((a, b) => {
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
        } catch {
            /* silent */
        }
        setDeleteTarget(null);
    };

    const toggleSelection = (id: string) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const exitSelectMode = () => {
        setSelectMode(false);
        setSelectedIds(new Set());
    };

    const handleBulkDelete = async () => {
        await removeMany([...selectedIds]);
        setBulkDeleteOpen(false);
        exitSelectMode();
    };

    const getBulkDeletePreview = (): string => {
        const selectedShifts = archivedShifts.filter(s => selectedIds.has(s.shiftId));
        selectedShifts.sort((a, b) => b.recordDate.localeCompare(a.recordDate));
        return selectedShifts
            .map(s => {
                const t = templates.find(x => x.templateId === s.templateId);
                return `[Submitted] ${s.shiftDisplayName} — ${t?.templateName || 'Unknown'}`;
            })
            .join('\n');
    };

    const renderShiftCard = (shift: ShiftRecord) => {
        const t = templates.find(x => x.templateId === shift.templateId);
        const s = summaries[shift.shiftId];
        const isSelected = selectedIds.has(shift.shiftId);

        const cardContent = (
            <div className="flex items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2.5">
                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: '#10b981' }} />
                        <h3 className="font-semibold text-stone-900 text-sm truncate">{shift.shiftDisplayName}</h3>
                    </div>
                    <p className="text-xs text-stone-400 mt-1 ml-[18px] truncate">{t?.templateName || 'Unknown'}</p>
                    {s && (
                        <div className="flex items-center gap-4 mt-2 ml-[18px]">
                            <span className="text-xs text-stone-500 whitespace-nowrap">
                                <span className="font-semibold text-stone-700">{s.totalCount}</span> sold
                            </span>
                            <span className="text-xs font-semibold whitespace-nowrap" style={{ color: '#5b8c7a' }}>
                                ${s.totalRevenue}
                            </span>
                        </div>
                    )}
                </div>
                {!selectMode && (
                    <div className="flex items-center gap-0.5 flex-shrink-0 ml-2">
                        <CopyButton shiftId={shift.shiftId} />
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
                )}
            </div>
        );

        if (selectMode) {
            return (
                <CheckboxCard key={shift.shiftId} selected={isSelected} onClick={() => toggleSelection(shift.shiftId)}>
                    <Card className="border-0 shadow-none">{cardContent}</Card>
                </CheckboxCard>
            );
        }

        return (
            <Card key={shift.shiftId} interactive onClick={() => navigate(`/shift/${shift.shiftId}`)}>
                {cardContent}
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
        <div className={selectMode ? 'pb-24' : ''}>
            <div className="mb-6 flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                    <h2 className="text-lg font-semibold text-stone-900 tracking-tight">History</h2>
                    <p className="text-xs text-stone-400 mt-1">Submissions older than {HISTORY_THRESHOLD_DAYS} days</p>
                </div>
                {archivedShifts.length > 0 &&
                    (selectMode ? (
                        <Button variant="secondary" size="md" onClick={exitSelectMode}>
                            Cancel
                        </Button>
                    ) : (
                        <Button variant="secondary" size="md" onClick={() => setSelectMode(true)}>
                            Select
                        </Button>
                    ))}
            </div>

            {archivedShifts.length === 0 ? (
                <EmptyState
                    icon="📚"
                    title="No archived shifts yet"
                    description={`Shifts older than ${HISTORY_THRESHOLD_DAYS} days will appear here`}
                />
            ) : (
                <div className="space-y-6">
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

            {/* Bulk action bar */}
            {selectMode && (
                <div
                    className="fixed bottom-[70px] left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-stone-200/60 z-10"
                    style={{ boxShadow: '0 -2px 12px rgba(0,0,0,0.04)' }}
                >
                    <div className="max-w-6xl mx-auto px-5 py-3 flex items-center justify-between gap-3">
                        <p className="text-sm text-stone-600">
                            {selectedIds.size} shift{selectedIds.size !== 1 ? 's' : ''} selected
                        </p>
                        <Button
                            variant="danger"
                            size="md"
                            onClick={() => setBulkDeleteOpen(true)}
                            disabled={selectedIds.size === 0}
                        >
                            Delete {selectedIds.size || ''} Shift{selectedIds.size !== 1 ? 's' : ''}
                        </Button>
                    </div>
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

            <ConfirmModal
                isOpen={bulkDeleteOpen}
                onCancel={() => setBulkDeleteOpen(false)}
                onConfirm={handleBulkDelete}
                title={`Delete ${selectedIds.size} Shift${selectedIds.size !== 1 ? 's' : ''}`}
                message={`${getBulkDeletePreview()}\n\nDraft shifts will be permanently lost. Submitted shifts will be removed from your history, but your manager's records are not affected.`}
                confirmLabel="Delete All"
                danger
            />
        </div>
    );
}
