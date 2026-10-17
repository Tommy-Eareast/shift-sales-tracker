import { useState, useMemo, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useShiftEditor } from '../../features/shifts/hooks/useShiftEditor';
import { useShiftDisplay } from '../../features/shifts/hooks/useShiftDisplay';
import { useExpandable } from '../../hooks/useExpandable';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/Skeleton';
import { ShiftHeader } from '../../features/shifts/components/ShiftHeader';
import { ProductSalesRow } from '../../features/shifts/components/ProductSalesRow';
import { SubmitShiftModal } from '../../features/shifts/components/SubmitShiftModal';
import { ProductSearch } from '../../features/shifts/components/ProductSearch';
import { searchProducts, computeHierarchyVisibility } from '../../utils/search';

export default function ShiftEditPage() {
    const { shiftId } = useParams<{ shiftId: string }>();
    const { shift, template, products, sales, summary, loading, error, adjustSales, submit } = useShiftEditor(shiftId);
    const { displayBrandOrder, groupedProducts } = useShiftDisplay(products, template);
    const brandExpand = useExpandable();
    const subCatExpand = useExpandable();
    const [showSubmitModal, setShowSubmitModal] = useState(false);
    const [showSoldDetails, setShowSoldDetails] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const isOnline = useOnlineStatus();

    useEffect(() => {
        const timer = setTimeout(() => {
            setSearchQuery('');
        }, 0);
        return () => clearTimeout(timer);
    }, [shiftId]);

    const templateProducts = useMemo(
        () => products.filter(p => template?.brandList.includes(p.brandMain)),
        [products, template]
    );

    const filteredProducts = useMemo(() => {
        if (!searchQuery.trim()) return templateProducts;
        return searchProducts(templateProducts, searchQuery);
    }, [templateProducts, searchQuery]);

    const { visibleBrands, visibleSubCats } = useMemo(
        () => computeHierarchyVisibility(filteredProducts, groupedProducts),
        [filteredProducts, groupedProducts]
    );

    useEffect(() => {
        if (!searchQuery.trim()) return;
        const timer = setTimeout(() => {
            for (const brand of visibleBrands) brandExpand.expand(brand);
            for (const key of visibleSubCats) subCatExpand.expand(key);
        }, 0);
        return () => clearTimeout(timer);
    }, [searchQuery, visibleBrands, visibleSubCats, brandExpand, subCatExpand]);

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
    const hasSearch = searchQuery.trim().length > 0;
    const noResults = hasSearch && filteredProducts.length === 0;

    // Submit is now a promise that can throw — modal catches and shows error
    const handleSubmit = async (note: string) => {
        await submit(note);
        setShowSubmitModal(false);
    };

    const soldItems = products
        .filter(p => (sales.get(p.id) || 0) > 0)
        .map(p => ({ product: p, count: sales.get(p.id) || 0, revenue: (sales.get(p.id) || 0) * p.price }));

    const soldGrouped: Record<string, typeof soldItems> = {};
    for (const item of soldItems) {
        const key = `${item.product.brandMain} — ${item.product.subCategory}`;
        if (!soldGrouped[key]) soldGrouped[key] = [];
        soldGrouped[key].push(item);
    }

    const visibleBrandOrder = hasSearch ? displayBrandOrder.filter(b => visibleBrands.has(b)) : displayBrandOrder;

    return (
        <div className="space-y-4 pb-28">
            <ShiftHeader shift={shift} template={template} summary={summary} />

            {/* Offline banner */}
            {!isOnline && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-2">
                    <span className="text-red-500">⚠️</span>
                    <p className="text-sm text-red-600">
                        You're offline. Sales can be recorded but submission requires internet.
                    </p>
                </div>
            )}

            {/* Search bar — hidden for submitted shifts */}
            {!isSubmitted && (
                <ProductSearch
                    value={searchQuery}
                    onChange={setSearchQuery}
                    placeholder="Search products (e.g., Eros EDP)"
                />
            )}

            {/* Status + Sold toggle */}
            <div className="flex items-center justify-between gap-2">
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
                {soldItems.length > 0 && (
                    <button
                        onClick={() => setShowSoldDetails(!showSoldDetails)}
                        className="text-xs font-medium transition-colors hover:opacity-80 flex-shrink-0"
                        style={{ color: '#5b8c7a' }}
                    >
                        {showSoldDetails ? 'Hide sold items' : `View sold items (${soldItems.length})`}
                    </button>
                )}
            </div>

            {/* Sold items panel */}
            {showSoldDetails && soldItems.length > 0 && (
                <Card className="p-4">
                    <p className="text-xs font-medium text-stone-500 uppercase tracking-wider mb-3">Items Sold</p>
                    <div className="space-y-3">
                        {Object.entries(soldGrouped).map(([groupKey, items]) => (
                            <div key={groupKey}>
                                <p className="text-xs font-medium text-stone-400 uppercase tracking-wider mb-1">
                                    {groupKey}
                                </p>
                                <div className="space-y-0.5">
                                    {/* Column headers for this group */}
                                    <div className="grid grid-cols-[1fr_auto_auto_auto] gap-2 text-[10px] font-medium text-stone-400 uppercase tracking-wider px-1 pb-1">
                                        <span>Item</span>
                                        <span className="text-right w-8">Qty</span>
                                        <span className="text-right min-w-[60px]">Unit</span>
                                        <span className="text-right min-w-[65px]">Total</span>
                                    </div>
                                    {items.map(({ product, count, revenue }) => {
                                        const displayName = product.fullName.startsWith(product.brandMain)
                                            ? product.fullName.slice(product.brandMain.length).trim()
                                            : product.fullName;
                                        return (
                                            <div
                                                key={product.id}
                                                className="grid grid-cols-[1fr_auto_auto_auto] gap-2 text-sm px-1 py-1"
                                            >
                                                <span className="text-stone-700 truncate">{displayName}</span>
                                                <span className="text-stone-600 text-right font-medium w-8">
                                                    {count}
                                                </span>
                                                <span className="text-stone-500 text-right min-w-[60px]">
                                                    ${product.price.toFixed(2)}
                                                </span>
                                                <span className="text-stone-700 text-right font-semibold min-w-[65px]">
                                                    ${revenue.toFixed(2)}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            )}

            {/* Search empty state */}
            {noResults ? (
                <Card className="p-8 text-center">
                    <div className="text-4xl mb-3">🔍</div>
                    <p className="text-stone-500 font-medium">No products match "{searchQuery}"</p>
                    <p className="text-sm text-stone-400 mt-1">Try a different search term</p>
                </Card>
            ) : (
                <div className="space-y-3">
                    {visibleBrandOrder.map(brand => {
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
                                            const subKey = `${brand}::${subCat}`;
                                            if (hasSearch && !visibleSubCats.has(subKey)) return null;

                                            const subProducts = categories[subCat].filter(
                                                p => !hasSearch || filteredProducts.some(fp => fp.id === p.id)
                                            );

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
            )}

            {/* Bottom Bar — bottom-[70px] per convention */}
            <div
                className="fixed bottom-[70px] left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-stone-200/60 z-10"
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
                isOnline={isOnline}
            />
        </div>
    );
}
