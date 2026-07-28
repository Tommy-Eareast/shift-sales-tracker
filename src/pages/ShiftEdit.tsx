import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import type {
    Product,
    ShiftRecord,
    ShiftTemplate,
    ShiftSummary,
    ShiftSales,
} from "../types";
import {
    getShiftRecord,
    getTemplate,
    getProductsSorted,
    adjustSalesCount,
    getShiftSales,
    getShiftSummary,
} from "../db/operations";

export default function ShiftEdit() {
    const { shiftId } = useParams<{ shiftId: string }>();
    const navigate = useNavigate();

    const [shift, setShift] = useState<ShiftRecord | null>(null);
    const [template, setTemplate] = useState<ShiftTemplate | null>(null);
    const [products, setProducts] = useState<Product[]>([]);
    const [sales, setSales] = useState<Map<string, number>>(new Map());
    const [summary, setSummary] = useState<ShiftSummary | null>(null);
    const [expandedBrand, setExpandedBrand] = useState<string | null>(null);
    const [expandedSubCategory, setExpandedSubCategory] = useState<Set<string>>(
        new Set(),
    );
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!shiftId) return;
        let cancelled = false;

        (async () => {
            try {
                const shiftData = await getShiftRecord(shiftId);
                if (!shiftData || cancelled) {
                    if (!cancelled) {
                        alert("Shift not found");
                        navigate("/");
                    }
                    return;
                }
                setShift(shiftData);

                const [templateData, allProducts, salesData, summaryData] =
                    await Promise.all([
                        getTemplate(shiftData.templateId),
                        getProductsSorted(),
                        getShiftSales(shiftId),
                        getShiftSummary(shiftId),
                    ]);

                if (cancelled) return;
                setTemplate(templateData || null);
                setProducts(allProducts);

                const salesMap = new Map<string, number>();
                salesData.forEach((sale: ShiftSales) => {
                    salesMap.set(sale.productId, sale.sellCount);
                });
                setSales(salesMap);
                setSummary(summaryData);
            } catch (error) {
                if (!cancelled)
                    console.error("Failed to load shift data:", error);
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [shiftId, navigate]);

    const handleAdjustSales = async (productId: string, delta: number) => {
        if (!shiftId) return;
        const currentCount = sales.get(productId) || 0;
        const newCount = Math.max(0, currentCount + delta);
        const newSales = new Map(sales);
        newSales.set(productId, newCount);
        setSales(newSales);

        try {
            await adjustSalesCount(shiftId, productId, delta);
            const summaryData = await getShiftSummary(shiftId);
            setSummary(summaryData);
        } catch (error) {
            console.error("Failed to adjust sales:", error);
            setSales(new Map(sales));
        }
    };

    const templateProducts = useMemo(
        () => products.filter((p) => template?.brandList.includes(p.brandMain)),
        [products, template],
    );

    const displayBrandOrder = useMemo(() => {
        const seen = new Set<string>();
        return templateProducts.reduce((order: string[], p) => {
            if (!seen.has(p.brandMain)) {
                seen.add(p.brandMain);
                order.push(p.brandMain);
            }
            return order;
        }, []);
    }, [templateProducts]);

    const groupedProducts = useMemo(() => {
        const grouped: Record<string, Record<string, Product[]>> = {};
        for (const p of templateProducts) {
            if (!grouped[p.brandMain]) grouped[p.brandMain] = {};
            if (!grouped[p.brandMain][p.subCategory])
                grouped[p.brandMain][p.subCategory] = [];
            grouped[p.brandMain][p.subCategory].push(p);
        }
        return grouped;
    }, [templateProducts]);

    const toggleSubCategory = (key: string) => {
        setExpandedSubCategory((prev) => {
            const next = new Set(prev);
            if (next.has(key)) {
                next.delete(key);
            } else {
                next.add(key);
            }
            return next;
        });
    };

    if (loading)
        return (
            <div className="flex items-center justify-center py-12">
                <div className="text-stone-400 text-sm">
                    Loading shift data...
                </div>
            </div>
        );

    return (
        <div className="space-y-4 pb-24">
            {/* Header */}
            <div
                className="bg-white rounded-2xl p-4 border border-stone-200/60"
                style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}
            >
                <div className="flex items-center justify-between mb-3">
                    <button
                        onClick={() => navigate("/")}
                        className="p-2 rounded-xl text-stone-400 hover:text-stone-600 hover:bg-stone-50 transition-colors"
                    >
                        <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={1.5}
                                d="M15 19l-7-7 7-7"
                            />
                        </svg>
                    </button>
                    <div className="text-center flex-1">
                        <h2 className="font-semibold text-stone-900 text-sm tracking-tight">
                            {shift?.shiftDisplayName}
                        </h2>
                        <p className="text-xs text-stone-400 mt-0.5">
                            {template?.templateName}
                        </p>
                    </div>
                    <div className="w-8"></div>
                </div>

                {summary && (
                    <div className="grid grid-cols-2 gap-3">
                        <div
                            className="rounded-xl p-3"
                            style={{ backgroundColor: "#ecf5f1" }}
                        >
                            <p
                                className="text-xs font-medium uppercase tracking-wider"
                                style={{ color: "#5b8c7a" }}
                            >
                                Total Sold
                            </p>
                            <p className="text-xl font-bold text-stone-900 tracking-tight">
                                {summary.totalCount}
                            </p>
                        </div>
                        <div
                            className="rounded-xl p-3"
                            style={{ backgroundColor: "#ecf5f1" }}
                        >
                            <p
                                className="text-xs font-medium uppercase tracking-wider"
                                style={{ color: "#5b8c7a" }}
                            >
                                Revenue
                            </p>
                            <p className="text-xl font-bold text-stone-900 tracking-tight">
                                ${summary.totalRevenue}
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Product List */}
            <div className="space-y-3">
                {displayBrandOrder.map((brand) => {
                    const categories = groupedProducts[brand] || {};
                    return (
                        <div
                            key={brand}
                            className="bg-white rounded-2xl border border-stone-200/60 overflow-hidden"
                            style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}
                        >
                            <button
                                onClick={() =>
                                    setExpandedBrand(
                                        expandedBrand === brand ? null : brand,
                                    )
                                }
                                className="w-full flex items-center justify-between p-4 hover:bg-stone-50 transition-colors"
                            >
                                <div className="flex items-center gap-2.5">
                                    <span
                                        className="w-2 h-2 rounded-full flex-shrink-0"
                                        style={{ backgroundColor: "#5b8c7a" }}
                                    ></span>
                                    <h3 className="font-semibold text-stone-900 text-sm">
                                        {brand}
                                    </h3>
                                </div>
                                <div className="flex items-center gap-3">
                                    {summary?.brandSummaries[brand] && (
                                        <div className="text-right text-xs">
                                            <span className="text-stone-400">
                                                {
                                                    summary.brandSummaries[
                                                        brand
                                                    ].brandTotalCount
                                                }{" "}
                                                sold ·{" "}
                                            </span>
                                            <span
                                                className="font-semibold"
                                                style={{ color: "#5b8c7a" }}
                                            >
                                                $
                                                {
                                                    summary.brandSummaries[
                                                        brand
                                                    ].brandTotalRevenue
                                                }
                                            </span>
                                        </div>
                                    )}
                                    <span className="text-stone-300 text-xs">
                                        {expandedBrand === brand ? "▾" : "▸"}
                                    </span>
                                </div>
                            </button>

                            {expandedBrand === brand && (
                                <div className="border-t border-stone-100">
                                    {Object.keys(categories).map((subCat) => {
                                        const subProducts = categories[subCat];
                                        const subKey = `${brand}::${subCat}`;
                                        return (
                                            <div key={subCat}>
                                                <button
                                                    onClick={() =>
                                                        toggleSubCategory(
                                                            subKey,
                                                        )
                                                    }
                                                    className="w-full flex items-center justify-between px-4 py-2.5 bg-stone-50/50 hover:bg-stone-50 transition-colors"
                                                >
                                                    <span className="text-xs font-medium text-stone-500 uppercase tracking-wider">
                                                        {subCat}
                                                    </span>
                                                    <span className="text-stone-300 text-xs">
                                                        {expandedSubCategory.has(
                                                            subKey,
                                                        )
                                                            ? "▾"
                                                            : "▸"}
                                                    </span>
                                                </button>
                                                {expandedSubCategory.has(
                                                    subKey,
                                                ) && (
                                                    <div className="divide-y divide-stone-50">
                                                        {subProducts.map(
                                                            (product) => {
                                                                const soldCount =
                                                                    sales.get(
                                                                        product.id,
                                                                    ) || 0;
                                                                const revenue =
                                                                    soldCount *
                                                                    product.price;
                                                                return (
                                                                    <div
                                                                        key={
                                                                            product.id
                                                                        }
                                                                        className="p-3 hover:bg-stone-50/50 transition-colors"
                                                                    >
                                                                        <div className="flex items-center justify-between">
                                                                            <div className="flex-1 min-w-0 mr-3">
                                                                                <p className="text-sm text-stone-900 truncate">
                                                                                    {
                                                                                        product.fullName
                                                                                    }
                                                                                </p>
                                                                                <p className="text-xs text-stone-400">
                                                                                    $
                                                                                    {
                                                                                        product.price
                                                                                    }
                                                                                </p>
                                                                            </div>
                                                                            <div className="flex items-center gap-3">
                                                                                <div className="text-right min-w-[60px]">
                                                                                    <p
                                                                                        className="text-sm font-semibold"
                                                                                        style={{
                                                                                            color: "#5b8c7a",
                                                                                        }}
                                                                                    >
                                                                                        $
                                                                                        {
                                                                                            revenue
                                                                                        }
                                                                                    </p>
                                                                                </div>
                                                                                <div className="flex items-center gap-1.5 bg-stone-100 rounded-lg p-1">
                                                                                    <button
                                                                                        onClick={() =>
                                                                                            handleAdjustSales(
                                                                                                product.id,
                                                                                                -1,
                                                                                            )
                                                                                        }
                                                                                        disabled={
                                                                                            soldCount ===
                                                                                            0
                                                                                        }
                                                                                        className="w-7 h-7 flex items-center justify-center bg-white rounded-md border border-stone-200 hover:bg-stone-50 disabled:opacity-30 disabled:cursor-not-allowed active:scale-95 transition-all text-stone-600 text-sm font-medium"
                                                                                    >
                                                                                        −
                                                                                    </button>
                                                                                    <span className="w-7 text-center font-semibold text-stone-900 text-sm">
                                                                                        {
                                                                                            soldCount
                                                                                        }
                                                                                    </span>
                                                                                    <button
                                                                                        onClick={() =>
                                                                                            handleAdjustSales(
                                                                                                product.id,
                                                                                                1,
                                                                                            )
                                                                                        }
                                                                                        className="w-7 h-7 flex items-center justify-center text-white rounded-md active:scale-95 transition-all text-sm font-medium"
                                                                                        style={{
                                                                                            background:
                                                                                                "#5b8c7a",
                                                                                            boxShadow:
                                                                                                "0 1px 3px rgba(91,140,122,0.3)",
                                                                                        }}
                                                                                    >
                                                                                        +
                                                                                    </button>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            },
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Bottom Bar */}
            {summary && (
                <div
                    className="fixed bottom-14 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-stone-200/60 z-10"
                    style={{ boxShadow: "0 -2px 12px rgba(0,0,0,0.04)" }}
                >
                    <div className="max-w-2xl mx-auto px-5 py-2.5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-[10px] font-medium text-stone-400 uppercase tracking-wider">
                                    Shift Total
                                </p>
                                <p className="text-sm text-stone-900">
                                    Sold:{" "}
                                    <span className="font-bold">
                                        {summary.totalCount}
                                    </span>
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-medium text-stone-400 uppercase tracking-wider">
                                    Revenue
                                </p>
                                <p
                                    className="text-lg font-bold tracking-tight"
                                    style={{ color: "#5b8c7a" }}
                                >
                                    ${summary.totalRevenue}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
