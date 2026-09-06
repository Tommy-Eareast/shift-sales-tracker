import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useShifts } from '../../features/shifts/hooks/useShifts';
import { useTemplates } from '../../features/templates/hooks/useTemplates';
import { Card, CardHeader } from '../../components/ui/Card';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { Button } from '../../components/ui/Button';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import { AlertModal } from '../../components/ui/AlertModal';
import { NewShiftModal } from '../../features/shifts/components/NewShiftModal';
import { EditShiftModal } from '../../features/shifts/components/EditShiftModal';
import { EditIcon, DeleteIcon } from '../../components/ui/icons';

export default function ShiftListPage() {
    const navigate = useNavigate();
    const { shifts, summaries, loading, error, create, update, remove } = useShifts();
    const { templates } = useTemplates();

    const [showNew, setShowNew] = useState(false);
    const [showEdit, setShowEdit] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [templateId, setTemplateId] = useState('');
    const [date, setDate] = useState('');
    const [start, setStart] = useState('07:00');
    const [end, setEnd] = useState('12:00');

    const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
    const [alertInfo, setAlertInfo] = useState<{ title: string; message: string } | null>(null);

    const openNew = () => {
        setTemplateId(templates[0]?.templateId || '');
        setDate(new Date().toISOString().split('T')[0]);
        setStart('07:00');
        setEnd('12:00');
        setShowNew(true);
    };

    const openEdit = (id: string) => {
        const s = shifts.find(x => x.shiftId === id);
        if (s) {
            setEditingId(id);
            setDate(s.recordDate);
            setStart(s.shiftTimeStart);
            setEnd(s.shiftTimeEnd);
            setShowEdit(true);
        }
    };

    const handleCreate = async () => {
        try {
            await create(templateId, date, start, end);
            setShowNew(false);
        } catch (e) {
            setAlertInfo({ title: 'Error', message: e instanceof Error ? e.message : 'Failed to create shift' });
        }
    };

    const handleUpdate = async () => {
        if (!editingId) return;
        try {
            await update(editingId, { recordDate: date, shiftTimeStart: start, shiftTimeEnd: end });
            setShowEdit(false);
        } catch (e) {
            setAlertInfo({ title: 'Error', message: e instanceof Error ? e.message : 'Failed to update shift' });
        }
    };

    const handleDeleteConfirm = async () => {
        if (!deleteTarget) return;
        try {
            await remove(deleteTarget.id);
        } catch (e) {
            setAlertInfo({ title: 'Error', message: e instanceof Error ? e.message : 'Failed' });
        }
        setDeleteTarget(null);
    };

    const submittedCount = shifts.filter(s => s.status === 'submitted').length;
    const lastShift = shifts.length > 0 ? shifts[0] : null;
    const lastShiftTemplate = lastShift ? templates.find(t => t.templateId === lastShift.templateId) : null;

    const renderShiftCard = (shift: (typeof shifts)[0]) => {
        const t = templates.find(x => x.templateId === shift.templateId);
        const s = summaries[shift.shiftId];
        const isDraft = shift.status === 'draft';
        return (
            <Card key={shift.shiftId} interactive onClick={() => navigate(`/shift/${shift.shiftId}`)}>
                <div className="flex items-center justify-between">
                    <div className="flex-1">
                        <div className="flex items-center gap-2.5">
                            <span
                                className="w-2 h-2 rounded-full flex-shrink-0"
                                style={{ backgroundColor: isDraft ? '#f59e0b' : '#10b981' }}
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
                </div>
            </Card>
        );
    };

    const draftShifts = shifts.filter(s => s.status === 'draft');
    const submittedShifts = shifts.filter(s => s.status === 'submitted');

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
            {/* Stats Cards */}
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
                <Button variant="primary" size="md" onClick={openNew}>
                    + New Shift
                </Button>
            </CardHeader>

            {shifts.length === 0 ? (
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

                    {submittedShifts.length > 0 && (
                        <div>
                            <p className="text-xs font-medium text-emerald-600 uppercase tracking-wider mb-2">
                                Submitted ({submittedShifts.length})
                            </p>
                            <div className="space-y-3">{submittedShifts.map(renderShiftCard)}</div>
                        </div>
                    )}
                </>
            )}

            <NewShiftModal
                isOpen={showNew}
                onClose={() => setShowNew(false)}
                templates={templates}
                selectedTemplate={templateId}
                recordDate={date}
                timeStart={start}
                timeEnd={end}
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

            <AlertModal
                isOpen={alertInfo !== null}
                title={alertInfo?.title || ''}
                message={alertInfo?.message || ''}
                onClose={() => setAlertInfo(null)}
            />
        </div>
    );
}
