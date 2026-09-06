import { useState, useMemo, useEffect } from 'react';
import { useManagerSales } from '../../features/manager/hooks/useManagerSales';
import { Card } from '../../components/ui/Card';
import { Skeleton } from '../../components/ui/Skeleton';
import { ErrorState } from '../../components/ui/ErrorState';

export default function SalesPage() {
    const {
        templates,
        selectedTemplateId,
        setSelectedTemplateId,
        selectedDate,
        setSelectedDate,
        availableDates,
        selectedShifts,
        loading,
        error,
    } = useManagerSales();

    const [showAllDates, setShowAllDates] = useState(false);
    const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (!loading && selectedTemplateId) {
                setHasLoadedOnce(true);
            }
        }, 0);
        return () => clearTimeout(timer);
    }, [loading, selectedTemplateId]);

    const showSkeleton = loading && !hasLoadedOnce;
    const isSwitching = loading && hasLoadedOnce;

    const visibleDates = useMemo(() => {
        if (showAllDates) return availableDates;
        const fourteenDaysAgo = new Date();
        fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
        const cutoff = fourteenDaysAgo.toISOString().split('T')[0];
        return availableDates.filter(date => date >= cutoff);
    }, [availableDates, showAllDates]);

    if (error) {
        return <ErrorState message={error} />;
    }

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
                                className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
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
            <div className="flex-1">
                {showSkeleton ? (
                    <Card className="p-5">
                        <Skeleton rows={4} height="h-8" />
                    </Card>
                ) : selectedTemplateId ? (
                    <Card
                        className={`p-5 transition-opacity duration-150 ${isSwitching ? 'opacity-40' : 'opacity-100'}`}
                    >
                        <h3 className="font-semibold text-stone-900 text-lg tracking-tight mb-4">
                            {templates.find(t => t.templateId === selectedTemplateId)?.templateName}
                        </h3>

                        {availableDates.length === 0 && !loading ? (
                            <p className="text-stone-400 text-sm">No submissions for this template yet.</p>
                        ) : (
                            <>
                                {/* Date Tabs */}
                                <div className="flex gap-2 mb-3 overflow-x-auto pb-2">
                                    {visibleDates.map(date => (
                                        <button
                                            key={date}
                                            onClick={() => setSelectedDate(date)}
                                            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                                                selectedDate === date
                                                    ? 'bg-stone-900 text-white'
                                                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                                            }`}
                                        >
                                            {date}
                                        </button>
                                    ))}
                                </div>

                                {/* Expand/Collapse */}
                                {availableDates.length > visibleDates.length && (
                                    <button
                                        onClick={() => setShowAllDates(!showAllDates)}
                                        className="text-xs text-stone-400 hover:text-stone-600 mb-4"
                                    >
                                        {showAllDates
                                            ? 'Show recent 14 days only'
                                            : `Show all dates (${availableDates.length - visibleDates.length} more)`}
                                    </button>
                                )}

                                {/* Shift Cards */}
                                <div className="space-y-3">
                                    {selectedShifts.length === 0 && !loading ? (
                                        <p className="text-stone-400 text-sm">No shifts submitted for this date.</p>
                                    ) : (
                                        selectedShifts.map(shift => (
                                            <div
                                                key={shift.shiftId}
                                                className="bg-stone-50 rounded-xl p-4 border border-stone-200/60"
                                            >
                                                <div className="flex items-center justify-between mb-3">
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-sm font-semibold text-stone-900">
                                                            {shift.shiftTimeStart}-{shift.shiftTimeEnd}
                                                        </span>
                                                        <span className="text-sm text-stone-600">
                                                            {shift.promoterName}
                                                        </span>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className="text-sm text-stone-500">
                                                            {shift.totalCount} units ·{' '}
                                                        </span>
                                                        <span className="text-sm font-semibold text-emerald-600">
                                                            ${shift.totalRevenue}
                                                        </span>
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
                                                                        <span className="text-stone-600 text-right">
                                                                            {item.count}
                                                                        </span>
                                                                        <span className="text-stone-600 text-right font-medium">
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
                            </>
                        )}
                    </Card>
                ) : (
                    <Card className="p-8 text-center">
                        <p className="text-stone-400 text-sm">Select a template to view submissions</p>
                    </Card>
                )}
            </div>
        </div>
    );
}
