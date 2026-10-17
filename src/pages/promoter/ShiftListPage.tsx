import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useShifts } from '../../features/shifts/hooks/useShifts';
import { useTemplates } from '../../features/templates/hooks/useTemplates';
import { Card, CardHeader } from '../../components/ui/Card';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { Button } from '../../components/ui/Button';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import { CopyButton } from '../../components/ui/CopyButton';
import { CheckboxCard } from '../../components/ui/CheckboxCard';
import { EditIcon, DeleteIcon } from '../../components/ui/icons';
import { NewShiftModal } from '../../features/shifts/components/NewShiftModal';
import { EditShiftModal } from '../../features/shifts/components/EditShiftModal';
import type { ShiftRecord } from '../../types';

const HISTORY_THRESHOLD_DAYS = 14;

function isWithinDays(dateString: string, days: number): boolean {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    const cutoffStr = cutoff.toISOString().split('T')[0];
    return dateString >= cutoffStr;
}

export default function ShiftListPage() {
    const navigate = useNavigate();
    const { shifts, summaries, loading, error, create, update, remove, removeMany } = useShifts();
    const { templates } = useTemplates();

    const [showNew, setShowNew] = useState(false);
    const [showEdit, setShowEdit] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [templateId, setTemplateId] = useState('');
    const [date, setDate] = useState('');
    const [start, setStart] = useState('07:00');
    const [end, setEnd] = useState('12:00');
    const [newShiftError, setNewShiftError] = useState('');
    const [editShiftError, setEditShiftError] = useState('');

    // Delete states
    const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
    const [selectMode, setSelectMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

    const openNew = () => {
        setTemplateId(templates[0]?.templateId || '');
        setDate(new Date().toISOString().split('T')[0]);
        setStart('07:00');
        setEnd('12:00');
        setNewShiftError('');
        setShowNew(true);
    };

    const openEdit = (id: string) => {
        const s = shifts.find(x => x.shiftId === id);
        if (s) {
            setEditingId(id);
            setDate(s.recordDate);
            setStart(s.shiftTimeStart);
            setEnd(s.shiftTimeEnd);
            setEditShiftError('');
            setShowEdit(true);
        }
    };

    const handleCreate = async () => {
        setNewShiftError('');
        try {
            await create(templateId, date, start, end);
            setShowNew(false);
        } catch (e) {
            setNewShiftError(e instanceof Error ? e.message : 'Failed to create shift');
        }
    };

    const handleUpdate = async () => {
        if (!editingId) return;
        setEditShiftError('');
        try {
            await update(editingId, { recordDate: date, shiftTimeStart: start, shiftTimeEnd: end });
            setShowEdit(false);
        } catch (e) {
            setEditShiftError(e instanceof Error ? e.message : 'Failed to update shift');
        }
    };

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
        const ids = [...selectedIds];
        await removeMany(ids);
        setBulkDeleteOpen(false);
        exitSelectMode();
    };

    // Bulk delete preview — list all selected shifts
    const getBulkDeletePreview = (): string => {
        const selectedShifts = shifts.filter(s => selectedIds.has(s.shiftId));
        // Sort by date descending
        selectedShifts.sort((a, b) => b.recordDate.localeCompare(a.recordDate));
        return selectedShifts
            .map(s => {
                const t = templates.find(x => x.templateId === s.templateId);
                const status = s.status === 'draft' ? '[Draft]' : '[Submitted]';
                return `${status} ${s.shiftDisplayName} — ${t?.templateName || 'Unknown'}`;
            })
            .join('\n');
    };

    const draftShifts = shifts.filter(s => s.status === 'draft');
    const recentSubmittedShifts = shifts.filter(
        s => s.status === 'submitted' && isWithinDays(s.recordDate, HISTORY_THRESHOLD_DAYS)
    );

    const submittedCount = shifts.filter(s => s.status === 'submitted').length;
    const lastShift = shifts.length > 0 ? shifts[0] : null;
    const lastShiftTemplate = lastShift ? templates.find(t => t.templateId === lastShift.templateId) : null;

    const renderShiftCard = (shift: ShiftRecord) => {
        const t = templates.find(x => x.templateId === shift.templateId);
        const s = summaries[shift.shiftId];
        const isDraft = shift.status === 'draft';
        const isSelected = selectedIds.has(shift.shiftId);

        const cardContent = (
            <div className="flex items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2.5">
                        <span
                            className="w-2 h-2 rounded-full flex-shrink-0"
                            style={{ backgroundColor: isDraft ? '#f59e0b' : '#10b981' }}
                        />
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
                        {isDraft && (
                            <button
                                onClick={e => {
                                    e.stopPropagation();
                                    openEdit(shift.shiftId);
                                }}
                                className="p-1.5 rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-50"
                            >
                                <EditIcon className="w-4 h-4" />
                            </button>
                        )}
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
            <div className="grid grid-cols-2 gap-3 mb-6">
                <Card>
                    <p className="text-xs font-medium text-stone-400 uppercase tracking-wider">Submitted / Total</p>
                    <p className="text-2xl font-bold text-stone-900 mt-1 tracking-tight">
                        {submittedCount}
                        <span className="text-stone-300 text-lg">/{shifts.length}</span>
                    </p>
                    <p className="text-xs text-stone-400 mt-1">Shifts</p>
                </Card>
                <Card>
                    <p className="text-xs font-medium text-stone-400 uppercase tracking-wider">Last Shift</p>
                    <p className="text-sm font-bold text-stone-900 mt-1 tracking-tight truncate">
                        {lastShift ? lastShift.shiftDisplayName : '—'}
                    </p>
                    <p className="text-xs text-stone-400 mt-1 truncate">{lastShiftTemplate?.templateName || ''}</p>
                </Card>
            </div>

            <CardHeader>
                <h2 className="text-lg font-semibold text-stone-900 tracking-tight">Shifts</h2>
                <div className="flex items-center gap-2">
                    {selectMode ? (
                        <Button variant="secondary" size="md" onClick={exitSelectMode}>
                            Cancel
                        </Button>
                    ) : (
                        <>
                            {shifts.length > 0 && (
                                <Button variant="secondary" size="md" onClick={() => setSelectMode(true)}>
                                    Select
                                </Button>
                            )}
                            <Button variant="primary" size="md" onClick={openNew}>
                                + New Shift
                            </Button>
                        </>
                    )}
                </div>
            </CardHeader>

            {draftShifts.length === 0 && recentSubmittedShifts.length === 0 ? (
                <EmptyState
                    icon="⚱️"
                    title="No shifts recorded yet"
                    description="Create your first shift to start tracking sales"
                />
            ) : (
                <>
                    {draftShifts.length > 0 && (
                        <div className="mb-6">
                            <p className="text-xs font-medium text-amber-600 uppercase tracking-wider mb-2">
                                Draft ({draftShifts.length})
                            </p>
                            <div className="space-y-3">{draftShifts.map(renderShiftCard)}</div>
                        </div>
                    )}

                    {recentSubmittedShifts.length > 0 && (
                        <div>
                            <p className="text-xs font-medium text-emerald-600 uppercase tracking-wider mb-2">
                                Submitted ({recentSubmittedShifts.length})
                            </p>
                            <div className="space-y-3">{recentSubmittedShifts.map(renderShiftCard)}</div>
                        </div>
                    )}

                    <p className="text-xs text-stone-400 text-center mt-6">
                        Older submissions are in the{' '}
                        <button onClick={() => navigate('/history')} className="underline hover:text-stone-600">
                            History
                        </button>{' '}
                        tab
                    </p>
                </>
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

            <NewShiftModal
                isOpen={showNew}
                onClose={() => setShowNew(false)}
                templates={templates}
                selectedTemplate={templateId}
                recordDate={date}
                timeStart={start}
                timeEnd={end}
                error={newShiftError}
                onTemplateChange={setTemplateId}
                onDateChange={setDate}
                onTimeStartChange={setStart}
                onTimeEndChange={setEnd}
                onCreate={handleCreate}
            />

            <EditShiftModal
                isOpen={showEdit}
                onClose={() => setShowEdit(false)}
                templateName={
                    templates.find(t => t.templateId === shifts.find(s => s.shiftId === editingId)?.templateId)
                        ?.templateName || ''
                }
                recordDate={date}
                timeStart={start}
                timeEnd={end}
                error={editShiftError}
                onDateChange={setDate}
                onTimeStartChange={setStart}
                onTimeEndChange={setEnd}
                onUpdate={handleUpdate}
            />

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
