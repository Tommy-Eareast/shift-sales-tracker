import { useState, useMemo, useEffect } from 'react';
import { useManagerSales } from '../../features/manager/hooks/useManagerSales';
import { Card } from '../../components/ui/Card';
import { Skeleton } from '../../components/ui/Skeleton';
import { ErrorState } from '../../components/ui/ErrorState';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import { Button } from '../../components/ui/Button';
import { formatDateForDisplay } from '../../utils/date';

const MIN_DATES_VISIBLE = 3;

export default function SalesPage() {
    const {
        templates,
        shifts,
        selectedTemplateId,
        setSelectedTemplateId,
        selectedDate,
        setSelectedDate,
        availableDates,
        selectedShifts,
        loading,
        error,
        deleteShifts,
    } = useManagerSales();

    const [showAllDates, setShowAllDates] = useState(false);
    const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

    const [selectMode, setSelectMode] = useState(false);
    const [selectedDatesForDelete, setSelectedDatesForDelete] = useState<Set<string>>(new Set());

    type DeleteTarget =
        | { type: 'shift'; submittedShiftIds: string[]; preview: string }
        | { type: 'date'; date: string; submittedShiftIds: string[]; preview: string }
        | { type: 'multi'; dates: string[]; submittedShiftIds: string[]; preview: string };
    const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (!loading && selectedTemplateId) setHasLoadedOnce(true);
        }, 0);
        return () => clearTimeout(timer);
    }, [loading, selectedTemplateId]);

    const showSkeleton = loading && !hasLoadedOnce;
    const isSwitching = loading && hasLoadedOnce;

    const { recentDates, olderDates } = useMemo(() => {
        const fourteenDaysAgo = new Date();
        fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
        const cutoff = fourteenDaysAgo.toISOString().split('T')[0];
        return {
            recentDates: availableDates.filter(date => date >= cutoff),
            olderDates: availableDates.filter(date => date < cutoff),
        };
    }, [availableDates]);

    const defaultVisibleDates = useMemo(() => {
        const result = [...recentDates];
        if (result.length < MIN_DATES_VISIBLE) {
            result.push(...olderDates.slice(0, MIN_DATES_VISIBLE - result.length));
        }
        return result;
    }, [recentDates, olderDates]);

    useEffect(() => {
        if (selectedDate) return;
        const timer = setTimeout(() => {
            if (recentDates.length > 0) setSelectedDate(recentDates[0]);
            else if (olderDates.length > 0) setSelectedDate(olderDates[0]);
        }, 0);
        return () => clearTimeout(timer);
    }, [recentDates, olderDates, selectedDate, setSelectedDate]);

    useEffect(() => {
        const timer = setTimeout(() => {
            setSelectMode(false);
            setSelectedDatesForDelete(new Set());
        }, 0);
        return () => clearTimeout(timer);
    }, [selectedTemplateId]);

    const visibleDates = showAllDates ? availableDates : defaultVisibleDates;
    const remainingCount = availableDates.length - defaultVisibleDates.length;
    const showToggle = remainingCount > 0;

    if (error) return <ErrorState message={error} />;

    const groupItemsBySubCategory = (
        items: { fullName: string; subCategory: string; price: number; count: number; revenue: number }[]
    ) => {
        const grouped: Record<string, typeof items> = {};
        for (const item of items) {
            if (!grouped[item.subCategory]) grouped[item.subCategory] = [];
            grouped[item.subCategory].push(item);
        }
        return grouped;
    };

    const requestDeleteShift = (shift: (typeof selectedShifts)[0]) => {
        const preview = `${shift.promoterName} - ${formatDateForDisplay(shift.recordDate)} ${shift.templateName} ${shift.shiftTimeStart}-${shift.shiftTimeEnd}`;
        setDeleteTarget({ type: 'shift', submittedShiftIds: [shift.submittedShiftId], preview });
    };

    const requestDeleteDate = (date: string) => {
        const dateShifts = shifts.filter(s => s.templateId === selectedTemplateId && s.recordDate === date);
        if (dateShifts.length === 0) return;
        const preview = [
            formatDateForDisplay(date),
            ...dateShifts.map(s => `-- ${s.promoterName} - ${s.shiftTimeStart}-${s.shiftTimeEnd}`),
        ].join('\n');
        setDeleteTarget({ type: 'date', date, submittedShiftIds: dateShifts.map(s => s.submittedShiftId), preview });
    };

    const requestDeleteMultipleDates = () => {
        if (selectedDatesForDelete.size === 0) return;
        const dates = [...selectedDatesForDelete].sort().reverse();
        const allIds: string[] = [];
        const previewLines: string[] = [];

        for (const date of dates) {
            const dateShifts = shifts.filter(s => s.templateId === selectedTemplateId && s.recordDate === date);
            if (dateShifts.length === 0) continue;
            previewLines.push(formatDateForDisplay(date));
            for (const s of dateShifts) {
                previewLines.push(`-- ${s.promoterName} - ${s.shiftTimeStart}-${s.shiftTimeEnd}`);
                allIds.push(s.submittedShiftId);
            }
            previewLines.push('');
        }

        setDeleteTarget({ type: 'multi', dates, submittedShiftIds: allIds, preview: previewLines.join('\n').trim() });
    };

    const confirmDelete = async () => {
        if (!deleteTarget) return;
        await deleteShifts(deleteTarget.submittedShiftIds);
        setDeleteTarget(null);
        if (deleteTarget.type === 'multi') {
            setSelectMode(false);
            setSelectedDatesForDelete(new Set());
        }
    };

    const toggleDateSelection = (date: string) => {
        setSelectedDatesForDelete(prev => {
            const next = new Set(prev);
            if (next.has(date)) next.delete(date);
            else next.add(date);
            return next;
        });
    };

    const getDeleteTitle = () => {
        if (!deleteTarget) return '';
        if (deleteTarget.type === 'shift') return 'Delete Submission';
        if (deleteTarget.type === 'date') return `Delete All Submissions on ${formatDateForDisplay(deleteTarget.date)}`;
        return `Delete ${deleteTarget.dates.length} Date${deleteTarget.dates.length !== 1 ? 's' : ''}`;
    };

    return (
        <div className="flex gap-4 min-h-[70vh]">
            {/* Template Sidebar */}
            <div className="w-48 flex-shrink-0">
                <Card noPadding className="overflow-hidden">
                    <div className="p-3 border-b border-stone-200">
                        <p className="text-xs font-medium text-stone-500 uppercase tracking-wider">Templates</p>
                    </div>
                    <div className="max-h-[60vh] overflow-y-auto">
                        {templates.map(template => (
                            <button
                                key={template.templateId}
                                onClick={() => {
                                    setSelectedTemplateId(template.templateId);
                                    setSelectedDate('');
                                    setShowAllDates(false);
                                }}
                                className={`w-full text-left px-4 py-2.5 text-sm transition-colors truncate ${
                                    selectedTemplateId === template.templateId
                                        ? 'bg-stone-100 text-stone-900 font-semibold'
                                        : 'text-stone-600 hover:bg-stone-50'
                                }`}
                            >
                                {template.templateName}
                            </button>
                        ))}
                    </div>
                </Card>
            </div>

            {/* Detail Area */}
            <div className="flex-1 min-w-0">
                {showSkeleton ? (
                    <Card className="p-5">
                        <Skeleton rows={4} height="h-8" />
                    </Card>
                ) : selectedTemplateId ? (
                    <Card
                        className={`p-5 transition-opacity duration-150 ${isSwitching ? 'opacity-40' : 'opacity-100'}`}
                    >
                        <div className="flex items-center justify-between gap-3 mb-4">
                            <h3 className="font-semibold text-stone-900 text-lg tracking-tight truncate min-w-0">
                                {templates.find(t => t.templateId === selectedTemplateId)?.templateName}
                            </h3>
                            {availableDates.length > 0 &&
                                (selectMode ? (
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        onClick={() => {
                                            setSelectMode(false);
                                            setSelectedDatesForDelete(new Set());
                                        }}
                                        className="flex-shrink-0"
                                    >
                                        Cancel
                                    </Button>
                                ) : (
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        onClick={() => setSelectMode(true)}
                                        className="flex-shrink-0"
                                    >
                                        Select Dates
                                    </Button>
                                ))}
                        </div>

                        {availableDates.length === 0 && !loading ? (
                            <p className="text-stone-400 text-sm">No submissions for this template yet.</p>
                        ) : (
                            <>
                                {/* Date Tabs — wrap on multiple lines */}
                                <div className="flex flex-wrap gap-2 mb-3">
                                    {visibleDates.map(date => {
                                        const isDateSelected = selectedDatesForDelete.has(date);
                                        const isCurrentDate = selectedDate === date;

                                        if (selectMode) {
                                            return (
                                                <button
                                                    key={date}
                                                    onClick={() => toggleDateSelection(date)}
                                                    className={`px-3 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all flex items-center gap-2 ${
                                                        isDateSelected
                                                            ? 'bg-stone-900 text-white'
                                                            : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                                                    }`}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={isDateSelected}
                                                        readOnly
                                                        className="w-3.5 h-3.5 rounded"
                                                        style={{ accentColor: '#5b8c7a' }}
                                                    />
                                                    {formatDateForDisplay(date)}
                                                </button>
                                            );
                                        }

                                        return (
                                            <div
                                                key={date}
                                                className={`group flex items-center rounded-xl transition-colors duration-200 ${
                                                    isCurrentDate ? 'bg-stone-900' : 'bg-stone-100 hover:bg-stone-200'
                                                }`}
                                            >
                                                <button
                                                    onClick={() => setSelectedDate(date)}
                                                    className={`py-2 pl-4 pr-4 group-hover:pr-1 text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                                                        isCurrentDate ? 'text-white' : 'text-stone-600'
                                                    }`}
                                                >
                                                    {formatDateForDisplay(date)}
                                                </button>
                                                <button
                                                    onClick={e => {
                                                        e.stopPropagation();
                                                        requestDeleteDate(date);
                                                    }}
                                                    className={`date-pill-x ${
                                                        isCurrentDate
                                                            ? 'text-red-400 hover:text-red-300'
                                                            : 'text-red-500 hover:text-red-600'
                                                    }`}
                                                    title={`Delete all shifts on ${formatDateForDisplay(date)}`}
                                                    aria-label={`Delete all shifts on ${formatDateForDisplay(date)}`}
                                                >
                                                    <svg
                                                        className="w-3.5 h-3.5 flex-shrink-0"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        viewBox="0 0 24 24"
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth={2.5}
                                                            d="M6 18L18 6M6 6l12 12"
                                                        />
                                                    </svg>
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>

                                {showToggle && (
                                    <button
                                        onClick={() => setShowAllDates(!showAllDates)}
                                        className="text-xs text-stone-400 hover:text-stone-600 mb-4"
                                    >
                                        {showAllDates ? 'Hide older dates' : `Show all dates (${remainingCount} more)`}
                                    </button>
                                )}

                                {selectMode && (
                                    <div className="mt-4 flex items-center justify-between gap-3 p-3 bg-stone-50 rounded-xl">
                                        <p className="text-sm text-stone-600">
                                            {selectedDatesForDelete.size} date
                                            {selectedDatesForDelete.size !== 1 ? 's' : ''} selected
                                        </p>
                                        <Button
                                            variant="danger"
                                            size="md"
                                            onClick={requestDeleteMultipleDates}
                                            disabled={selectedDatesForDelete.size === 0}
                                        >
                                            Delete {selectedDatesForDelete.size || ''} Date
                                            {selectedDatesForDelete.size !== 1 ? 's' : ''}
                                        </Button>
                                    </div>
                                )}

                                {!selectMode && (
                                    <div className="space-y-3 mt-4">
                                        {selectedShifts.length === 0 && !loading ? (
                                            <p className="text-stone-400 text-sm">No shifts submitted for this date.</p>
                                        ) : (
                                            selectedShifts.map(shift => (
                                                <div
                                                    key={`${shift.shiftId}-${shift.submittedAt}`}
                                                    className="bg-stone-50 rounded-xl p-4 border border-stone-200/60"
                                                >
                                                    <div className="flex items-center justify-between gap-3 mb-3">
                                                        <div className="flex items-center gap-3 min-w-0 flex-1">
                                                            <span className="text-sm font-semibold text-stone-900 whitespace-nowrap">
                                                                {shift.shiftTimeStart}-{shift.shiftTimeEnd}
                                                            </span>
                                                            <span className="text-sm text-stone-600 truncate">
                                                                {shift.promoterName}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-2 flex-shrink-0">
                                                            <div className="text-right whitespace-nowrap">
                                                                <span className="text-sm text-stone-500">
                                                                    {shift.totalCount} units ·{' '}
                                                                </span>
                                                                <span className="text-sm font-semibold text-emerald-600">
                                                                    ${shift.totalRevenue}
                                                                </span>
                                                            </div>
                                                            <button
                                                                onClick={() => requestDeleteShift(shift)}
                                                                className="p-1.5 rounded-lg text-stone-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                                                                title="Delete this submission"
                                                            >
                                                                <svg
                                                                    className="w-4 h-4"
                                                                    fill="none"
                                                                    stroke="currentColor"
                                                                    viewBox="0 0 24 24"
                                                                >
                                                                    <path
                                                                        strokeLinecap="round"
                                                                        strokeLinejoin="round"
                                                                        strokeWidth={1.5}
                                                                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                                                    />
                                                                </svg>
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {Object.entries(groupItemsBySubCategory(shift.items)).map(
                                                        ([subCat, items]) => (
                                                            <div key={subCat} className="mb-3">
                                                                <p className="text-xs font-medium text-stone-500 uppercase tracking-wider mb-1 px-2">
                                                                    {subCat || 'Uncategorised'}
                                                                </p>
                                                                <div className="space-y-0.5">
                                                                    {items.map((item, idx) => (
                                                                        <div
                                                                            key={idx}
                                                                            className="grid grid-cols-[1fr_auto_auto] gap-3 text-sm px-2 py-1 rounded-lg hover:bg-stone-100"
                                                                        >
                                                                            <span className="text-stone-700 truncate">
                                                                                {item.fullName}
                                                                            </span>
                                                                            <span className="text-stone-600 text-right whitespace-nowrap">
                                                                                {item.count}
                                                                            </span>
                                                                            <span className="text-stone-600 text-right font-medium whitespace-nowrap">
                                                                                ${item.revenue.toFixed(2)}
                                                                            </span>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )
                                                    )}

                                                    {shift.note && (
                                                        <p className="text-xs text-stone-400 mt-3">📝 {shift.note}</p>
                                                    )}
                                                </div>
                                            ))
                                        )}
                                    </div>
                                )}

                                {selectMode && (
                                    <div className="mt-4 p-6 text-center bg-stone-50 rounded-xl border border-stone-200/60">
                                        <p className="text-sm text-stone-500">
                                            Select dates above to delete all submissions for those dates.
                                        </p>
                                    </div>
                                )}
                            </>
                        )}
                    </Card>
                ) : (
                    <Card className="p-8 text-center">
                        <p className="text-stone-400 text-sm">Select a template to view submissions</p>
                    </Card>
                )}
            </div>

            <ConfirmModal
                isOpen={deleteTarget !== null}
                onCancel={() => setDeleteTarget(null)}
                onConfirm={confirmDelete}
                title={getDeleteTitle()}
                message={`${deleteTarget?.preview || ''}\n\nThis will not affect the promoter's history.`}
                confirmLabel="Delete"
                danger
            />
        </div>
    );
}
