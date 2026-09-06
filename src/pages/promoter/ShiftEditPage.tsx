import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useShiftEditor } from '../../features/shifts/hooks/useShiftEditor';
import { useShiftDisplay } from '../../features/shifts/hooks/useShiftDisplay';
import { useExpandable } from '../../hooks/useExpandable';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/Skeleton';
import { ShiftHeader } from '../../features/shifts/components/ShiftHeader';
import { ProductSalesRow } from '../../features/shifts/components/ProductSalesRow';
import { SubmitShiftModal } from '../../features/shifts/components/SubmitShiftModal';

export default function ShiftEditPage() {
    const { shiftId } = useParams<{ shiftId: string }>();
    const { shift, template, products, sales, summary, loading, error, adjustSales, submit } = useShiftEditor(shiftId);
    const { displayBrandOrder, groupedProducts } = useShiftDisplay(products, template);
    const brandExpand = useExpandable();
    const subCatExpand = useExpandable();
    const [showSubmitModal, setShowSubmitModal] = useState(false);

    if (loading) {
        return (
            <div className="space-y-4">
                <Skeleton rows={2} height="h-16" />
                <Skeleton rows={4} height="h-20" />
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

    if (!shift) {
        return (
            <Card className="p-6 text-center">
                <p className="text-stone-400 text-sm">Shift not found</p>
            </Card>
        );
    }

    const isSubmitted = shift.status === 'submitted';

    const handleSubmit = async (note: string) => {
        await submit(note);
        setShowSubmitModal(false);
    };

    return (
        <div className="space-y-4 pb-28">
            <ShiftHeader shift={shift} template={template} summary={summary} />

            <div className="flex items-center gap-2">
                {isSubmitted ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        Submitted
                    </span>
                ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                        Draft
                    </span>
                )}
                {shift.note && <p className="text-xs text-stone-400 truncate">{shift.note}</p>}
            </div>

            <div className="space-y-3">
                {displayBrandOrder.map(brand => {
                    const categories = groupedProducts[brand] || {};
                    return (
                        <Card key={brand} noPadding className="overflow-hidden">
                            <button
                                onClick={() => brandExpand.toggle(brand)}
                                className="w-full flex items-center justify-between p-4 hover:bg-stone-50 transition-colors"
                            >
                                <div className="flex items-center gap-2.5">
                                    <span
                                        className="w-2 h-2 rounded-full flex-shrink-0"
                                        style={{ backgroundColor: '#5b8c7a' }}
                                    />
                                    <h3 className="font-semibold text-stone-900 text-sm">{brand}</h3>
                                </div>
                                <div className="flex items-center gap-3">
                                    {summary?.brandSummaries[brand] && (
                                        <div className="text-right text-xs">
                                            <span className="text-stone-400">
                                                {summary.brandSummaries[brand].brandTotalCount} sold ·{' '}
                                            </span>
                                            <span className="font-semibold" style={{ color: '#5b8c7a' }}>
                                                ${summary.brandSummaries[brand].brandTotalRevenue}
                                            </span>
                                        </div>
                                    )}
                                    <span className="text-stone-300 text-xs">
                                        {brandExpand.isExpanded(brand) ? '▾' : '▸'}
                                    </span>
                                </div>
                            </button>

                            {brandExpand.isExpanded(brand) && (
                                <div className="border-t border-stone-100">
                                    {Object.keys(categories).map(subCat => {
                                        const subProducts = categories[subCat];
                                        const subKey = `${brand}::${subCat}`;
                                        return (
                                            <div key={subCat}>
                                                <button
                                                    onClick={() => subCatExpand.toggle(subKey)}
                                                    className="w-full flex items-center justify-between px-4 py-2.5 bg-stone-50/50 hover:bg-stone-50 transition-colors"
                                                >
                                                    <span className="text-xs font-medium text-stone-500 uppercase tracking-wider">
                                                        {subCat}
                                                    </span>
                                                    <span className="text-stone-300 text-xs">
                                                        {subCatExpand.isExpanded(subKey) ? '▾' : '▸'}
                                                    </span>
                                                </button>
                                                {subCatExpand.isExpanded(subKey) && (
                                                    <div className="divide-y divide-stone-50">
                                                        {subProducts.map(product => (
                                                            <ProductSalesRow
                                                                key={product.id}
                                                                product={product}
                                                                soldCount={sales.get(product.id) || 0}
                                                                onAdjust={adjustSales}
                                                                disabled={isSubmitted}
                                                            />
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </Card>
                    );
                })}
            </div>

            {/* Bottom Bar */}
            <div
                className="fixed bottom-[57px] left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-stone-200/60 z-10"
                style={{ boxShadow: '0 -2px 12px rgba(0,0,0,0.04)' }}
            >
                <div className="max-w-2xl mx-auto px-5 py-2.5">
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <p className="text-[10px] font-medium text-stone-400 uppercase tracking-wider">
                                Shift Total
                            </p>
                            <p className="text-sm text-stone-900">
                                Sold: <span className="font-bold">{summary?.totalCount || 0}</span>
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] font-medium text-stone-400 uppercase tracking-wider">Revenue</p>
                            <p className="text-lg font-bold tracking-tight" style={{ color: '#5b8c7a' }}>
                                ${summary?.totalRevenue || 0}
                            </p>
                        </div>
                    </div>
                    {!isSubmitted && (
                        <Button
                            variant="primary"
                            size="lg"
                            fullWidth
                            onClick={() => setShowSubmitModal(true)}
                            className="mt-2"
                        >
                            Submit Shift
                        </Button>
                    )}
                </div>
            </div>

            <SubmitShiftModal
                isOpen={showSubmitModal}
                onClose={() => setShowSubmitModal(false)}
                onSubmit={handleSubmit}
                shiftDisplayName={shift.shiftDisplayName}
                totalCount={summary?.totalCount || 0}
                totalRevenue={summary?.totalRevenue || 0}
            />
        </div>
    );
}
