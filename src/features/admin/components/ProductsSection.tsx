import { useState, useEffect, useMemo } from 'react';
import { useProducts } from '../../products/hooks/useProducts';
import { orderingService } from '../../products/services/orderingService';
import { useExpandable } from '../../../hooks/useExpandable';
import { Card, CardHeader } from '../../../components/ui/Card';
import { Skeleton } from '../../../components/ui/Skeleton';
import { ProductFormModal } from './ProductFormModal';
import { ConfirmModal } from '../../../components/ui/ConfirmModal';
import { SortableBrandHeader } from './SortableBrandHeader';
import { SortableSubCatWrapper } from './SortableSubCatWrapper';
import { SortableProductItem } from './SortableProductItem';
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
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';

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
                <Skeleton rows={4} height="h-10" />
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
                                                                        <SortableSubCatWrapper
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
