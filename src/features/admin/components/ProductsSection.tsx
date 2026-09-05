import { useState, useEffect, useMemo } from 'react';
import { useProducts } from '../../products/hooks/useProducts';
import { orderingService } from '../../products/services/orderingService';
import { useExpandable } from '../../../hooks/useExpandable';
import { Card, CardHeader } from '../../../components/ui/Card';
import { ProductFormModal } from './ProductFormModal';
import { ConfirmModal } from '../../../components/ui/ConfirmModal';
import { validateProduct } from '../../../utils/validation';
import type { Product } from '../../../types';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    type DragEndEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

function SortableBrandHeader({
    brand,
    isExpanded,
    onToggle,
}: {
    brand: string;
    isExpanded: boolean;
    onToggle: () => void;
}) {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: brand });

    return (
        <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} className="mb-2">
            <div className="flex items-center w-full p-3 bg-stone-50 rounded-xl hover:bg-stone-100 transition-colors">
                <button
                    {...attributes}
                    {...listeners}
                    className="cursor-grab active:cursor-grabbing p-1.5 hover:bg-stone-200 rounded touch-none flex-shrink-0"
                >
                    <svg className="w-4 h-4 text-stone-300" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 6h2v2H8V6zm6 0h2v2h-2V6zM8 11h2v2H8v-2zm6 0h2v2h-2v-2zm-6 5h2v2H8v-2zm6 0h2v2h-2v-2z" />
                    </svg>
                </button>
                <button onClick={onToggle} className="flex-1 flex items-center justify-between ml-2">
                    <span className="font-semibold text-stone-900 text-sm">{brand}</span>
                    <span className="text-stone-300 text-xs">{isExpanded ? '▾' : '▸'}</span>
                </button>
            </div>
        </div>
    );
}

function SortableSubCatHeader({
    subCat,
    count,
    isExpanded,
    onToggle,
}: {
    subCat: string;
    count: number;
    isExpanded: boolean;
    onToggle: () => void;
}) {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: subCat });

    return (
        <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }}>
            <div className="flex items-center w-full hover:bg-stone-50 rounded-lg">
                <button
                    {...attributes}
                    {...listeners}
                    className="cursor-grab active:cursor-grabbing p-1.5 hover:bg-stone-200 rounded touch-none flex-shrink-0"
                >
                    <svg className="w-3.5 h-3.5 text-stone-300" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 6h2v2H8V6zm6 0h2v2h-2V6zM8 11h2v2H8v-2zm6 0h2v2h-2v-2zm-6 5h2v2H8v-2zm6 0h2v2h-2v-2z" />
                    </svg>
                </button>
                <button onClick={onToggle} className="flex-1 flex items-center justify-between px-3 py-2 text-left">
                    <p className="text-xs font-medium text-stone-500 uppercase tracking-wider">
                        {subCat} ({count})
                    </p>
                    <span className="text-stone-300 text-xs">{isExpanded ? '▾' : '▸'}</span>
                </button>
            </div>
        </div>
    );
}

function SortableProductItem({
    product,
    onEdit,
    onDelete,
}: {
    product: Product;
    onEdit: (p: Product) => void;
    onDelete: (id: string) => void;
}) {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: product.id });

    return (
        <div
            ref={setNodeRef}
            style={{ transform: CSS.Transform.toString(transform), transition }}
            className="flex items-center justify-between p-2.5 hover:bg-stone-50 rounded-lg text-sm"
        >
            <div className="flex items-center gap-2 flex-1 min-w-0">
                <button
                    {...attributes}
                    {...listeners}
                    className="cursor-grab active:cursor-grabbing p-1 hover:bg-stone-200 rounded touch-none flex-shrink-0"
                >
                    <svg className="w-3.5 h-3.5 text-stone-300" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 6h2v2H8V6zm6 0h2v2h-2V6zM8 11h2v2H8v-2zm6 0h2v2h-2v-2zm-6 5h2v2H8v-2zm6 0h2v2h-2v-2z" />
                    </svg>
                </button>
                <span className="text-stone-700 truncate text-sm">{product.fullName}</span>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-stone-400 text-xs">${product.price}</span>
                <div className="flex items-center gap-0.5">
                    <button
                        onClick={() => onEdit(product)}
                        className="p-1.5 rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-100"
                    >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={1.5}
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                        </svg>
                    </button>
                    <button
                        onClick={() => onDelete(product.id)}
                        className="p-1.5 rounded-lg text-stone-400 hover:text-red-500 hover:bg-red-50"
                    >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
        </div>
    );
}

export function ProductsSection() {
    const {
        products,
        loading,
        error,
        distinctValues,
        getSubCategorySuggestions,
        add,
        update,
        remove,
        reorder: reorderProducts,
    } = useProducts();

    const brandExpand = useExpandable();
    const subCatExpand = useExpandable();

    const [showForm, setShowForm] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [form, setForm] = useState({ brandMain: '', subCategory: '', fullName: '', price: 0 });
    const [formError, setFormError] = useState('');
    const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

    const [brandOrder, setBrandOrder] = useState<string[]>([]);
    const [subCatOrders, setSubCatOrders] = useState<Record<string, string[]>>({});

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    useEffect(() => {
        orderingService.getBrandOrder().then(setBrandOrder);
    }, []);

    useEffect(() => {
        const loadSubCatOrders = async () => {
            const allBrands = [...new Set(products.map(p => p.brandMain))];
            const orders: Record<string, string[]> = {};
            for (const brand of allBrands) {
                const order = await orderingService.getSubCategoryOrder(brand);
                if (order.length > 0) {
                    orders[brand] = order;
                }
            }
            setSubCatOrders(orders);
        };
        loadSubCatOrders();
    }, [products]);

    const groupedByBrand = useMemo(() => {
        const grouped: Record<string, Record<string, Product[]>> = {};
        for (const p of products) {
            if (!grouped[p.brandMain]) grouped[p.brandMain] = {};
            if (!grouped[p.brandMain][p.subCategory]) grouped[p.brandMain][p.subCategory] = [];
            grouped[p.brandMain][p.subCategory].push(p);
        }
        return grouped;
    }, [products]);

    const displayBrandOrder = useMemo(() => {
        const allBrands = [...new Set(products.map(p => p.brandMain))];
        if (brandOrder.length === 0) return allBrands;
        return [...brandOrder.filter(b => allBrands.includes(b)), ...allBrands.filter(b => !brandOrder.includes(b))];
    }, [products, brandOrder]);

    const getSubCatOrder = (brand: string): string[] => {
        const allSubCats = Object.keys(groupedByBrand[brand] || {});
        const configured = subCatOrders[brand] || [];
        if (configured.length === 0) return allSubCats;
        return [
            ...configured.filter(sc => allSubCats.includes(sc)),
            ...allSubCats.filter(sc => !configured.includes(sc)),
        ];
    };

    const handleBrandDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;
        const oldIdx = displayBrandOrder.indexOf(active.id as string);
        const newIdx = displayBrandOrder.indexOf(over.id as string);
        if (oldIdx !== -1 && newIdx !== -1) {
            const reordered = arrayMove(displayBrandOrder, oldIdx, newIdx);
            setBrandOrder(reordered);
            await orderingService.saveBrandOrder(reordered);
        }
    };

    const handleSubCatDragEnd = async (brand: string, event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;
        const currentOrder = getSubCatOrder(brand);
        const oldIdx = currentOrder.indexOf(active.id as string);
        const newIdx = currentOrder.indexOf(over.id as string);
        if (oldIdx !== -1 && newIdx !== -1) {
            const reordered = arrayMove(currentOrder, oldIdx, newIdx);
            setSubCatOrders(prev => ({ ...prev, [brand]: reordered }));
            await orderingService.saveSubCategoryOrder(brand, reordered);
        }
    };

    const handleProductDragEnd = async (brand: string, subCat: string, event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;
        const prods = groupedByBrand[brand]?.[subCat] || [];
        const oldIdx = prods.findIndex(p => p.id === active.id);
        const newIdx = prods.findIndex(p => p.id === over.id);
        if (oldIdx !== -1 && newIdx !== -1) {
            const reorderedSubCat = arrayMove(prods, oldIdx, newIdx);
            const fullOrderedIds: string[] = [];
            for (const b of displayBrandOrder) {
                const subCats = getSubCatOrder(b);
                for (const sc of subCats) {
                    if (b === brand && sc === subCat) {
                        fullOrderedIds.push(...reorderedSubCat.map(p => p.id));
                    } else {
                        fullOrderedIds.push(...(groupedByBrand[b]?.[sc] || []).map(p => p.id));
                    }
                }
            }
            await reorderProducts(fullOrderedIds);
        }
    };

    const saveProduct = async () => {
        const v = validateProduct(form, products, editingProduct?.id);
        if (!v.valid) {
            setFormError(v.error!);
            return;
        }
        try {
            if (editingProduct) await update(editingProduct.id, form);
            else await add(form);
            setShowForm(false);
        } catch (err) {
            setFormError(err instanceof Error ? err.message : 'Failed to save');
        }
    };

    return (
        <Card>
            <CardHeader>
                <h3 className="font-semibold text-stone-900 tracking-tight">
                    Products{' '}
                    <span className="text-stone-300 font-normal text-sm">({loading ? '...' : products.length})</span>
                </h3>
                <button
                    onClick={() => {
                        setEditingProduct(null);
                        setForm({ brandMain: '', subCategory: '', fullName: '', price: 0 });
                        setFormError('');
                        setShowForm(true);
                    }}
                    className="text-sm font-medium transition-colors hover:opacity-80"
                    style={{ color: '#5b8c7a' }}
                >
                    + Add Product
                </button>
            </CardHeader>

            {error ? (
                <div className="text-red-500 text-sm py-4 text-center">{error}</div>
            ) : loading ? (
                <div className="animate-pulse space-y-2">
                    <div className="h-10 bg-stone-100 rounded-xl" />
                    <div className="h-10 bg-stone-100 rounded-xl" />
                    <div className="h-10 bg-stone-100 rounded-xl" />
                    <div className="h-10 bg-stone-100 rounded-xl" />
                </div>
            ) : (
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleBrandDragEnd}>
                    <SortableContext items={displayBrandOrder} strategy={verticalListSortingStrategy}>
                        <div>
                            {displayBrandOrder.map(brand => {
                                const cats = groupedByBrand[brand] || {};
                                const subCatOrder = getSubCatOrder(brand);
                                return (
                                    <div key={brand}>
                                        <SortableBrandHeader
                                            brand={brand}
                                            isExpanded={brandExpand.isExpanded(brand)}
                                            onToggle={() => brandExpand.toggle(brand)}
                                        />
                                        {brandExpand.isExpanded(brand) && (
                                            <div className="pl-4 mt-1 space-y-1">
                                                <DndContext
                                                    sensors={sensors}
                                                    collisionDetection={closestCenter}
                                                    onDragEnd={e => handleSubCatDragEnd(brand, e)}
                                                >
                                                    <SortableContext
                                                        items={subCatOrder}
                                                        strategy={verticalListSortingStrategy}
                                                    >
                                                        <div>
                                                            {subCatOrder.map(subCat => {
                                                                const prods = cats[subCat] || [];
                                                                const subKey = `${brand}::${subCat}`;
                                                                return (
                                                                    <div key={subCat}>
                                                                        <SortableSubCatHeader
                                                                            subCat={subCat}
                                                                            count={prods.length}
                                                                            isExpanded={subCatExpand.isExpanded(subKey)}
                                                                            onToggle={() => subCatExpand.toggle(subKey)}
                                                                        />
                                                                        {subCatExpand.isExpanded(subKey) && (
                                                                            <DndContext
                                                                                sensors={sensors}
                                                                                collisionDetection={closestCenter}
                                                                                onDragEnd={e =>
                                                                                    handleProductDragEnd(
                                                                                        brand,
                                                                                        subCat,
                                                                                        e
                                                                                    )
                                                                                }
                                                                            >
                                                                                <SortableContext
                                                                                    items={prods.map(p => p.id)}
                                                                                    strategy={
                                                                                        verticalListSortingStrategy
                                                                                    }
                                                                                >
                                                                                    <div className="pl-2 space-y-0.5">
                                                                                        {prods.map(p => (
                                                                                            <SortableProductItem
                                                                                                key={p.id}
                                                                                                product={p}
                                                                                                onEdit={prod => {
                                                                                                    setEditingProduct(
                                                                                                        prod
                                                                                                    );
                                                                                                    setForm({
                                                                                                        brandMain:
                                                                                                            prod.brandMain,
                                                                                                        subCategory:
                                                                                                            prod.subCategory,
                                                                                                        fullName:
                                                                                                            prod.fullName,
                                                                                                        price: prod.price,
                                                                                                    });
                                                                                                    setFormError('');
                                                                                                    setShowForm(true);
                                                                                                }}
                                                                                                onDelete={id =>
                                                                                                    setDeleteTarget(id)
                                                                                                }
                                                                                            />
                                                                                        ))}
                                                                                    </div>
                                                                                </SortableContext>
                                                                            </DndContext>
                                                                        )}
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </SortableContext>
                                                </DndContext>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </SortableContext>
                </DndContext>
            )}

            <ProductFormModal
                isOpen={showForm}
                onClose={() => setShowForm(false)}
                editingProduct={editingProduct}
                form={form}
                onChange={setForm}
                error={formError}
                brands={distinctValues.brands}
                subCategorySuggestions={getSubCategorySuggestions(form.brandMain)}
                onSave={saveProduct}
            />

            <ConfirmModal
                isOpen={deleteTarget !== null}
                onCancel={() => setDeleteTarget(null)}
                onConfirm={async () => {
                    if (deleteTarget) {
                        await remove(deleteTarget);
                        setDeleteTarget(null);
                    }
                }}
                title="Delete Product"
                message="Are you sure?"
                confirmLabel="Delete"
                danger
            />
        </Card>
    );
}
