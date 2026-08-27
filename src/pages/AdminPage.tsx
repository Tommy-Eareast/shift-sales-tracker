import { useState } from "react";
import { useProducts } from "../features/products/hooks/useProducts";
import { useTemplates } from "../features/templates/hooks/useTemplates";
import { useExpandable } from "../hooks/useExpandable";
import { Card, CardHeader } from "../components/ui/Card";
import { ConfirmModal } from "../components/ui/ConfirmModal";
import { AlertModal } from "../components/ui/AlertModal";
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    type DragEndEvent,
} from "@dnd-kit/core";
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { validateProduct, validateTemplate } from "../utils/validation";
import type { Product } from "../types";
import { SortableProductItem } from "../features/admin/components/SortableProductItem";
import { SortableSubCatWrapper } from "../features/admin/components/SortableSubCatWrapper";
import { SortableBrandHeader } from "../features/admin/components/SortableBrandHeader";
import { SortableTemplateItem } from "../features/admin/components/SortableTemplateItem";
import { ProductFormModal } from "../features/admin/components/ProductFormModal";
import { TemplateFormModal } from "../features/admin/components/TemplateFormModal";

export default function AdminPage() {
    const {
        products,
        loading,
        error,
        distinctValues,
        getSubCategorySuggestions,
        add,
        update,
        remove,
        reorderProducts,
        reorderBrands,
        reorderSubCategories,
    } = useProducts();
    const {
        templates,
        loading: tl,
        error: te,
        add: addTemplate,
        remove: removeTemplate,
        reorder: reorderTemplates,
    } = useTemplates();

    const [section, setSection] = useState<"products" | "templates">(
        "products",
    );
    const brandExpand = useExpandable();
    const subCatExpand = useExpandable();

    // Product form
    const [showProductForm, setShowProductForm] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [productForm, setProductForm] = useState({
        brandMain: "",
        subCategory: "",
        fullName: "",
        price: 0,
    });
    const [productError, setProductError] = useState("");

    // Template form
    const [showTemplateForm, setShowTemplateForm] = useState(false);
    const [templateForm, setTemplateForm] = useState({
        templateName: "",
        selectedBrands: [] as string[],
    });
    const [templateError, setTemplateError] = useState("");

    // Confirm/Alert modals
    const [deleteProductTarget, setDeleteProductTarget] = useState<
        string | null
    >(null);
    const [deleteTemplateTarget, setDeleteTemplateTarget] = useState<{
        id: string;
        name: string;
    } | null>(null);
    const [alertInfo, setAlertInfo] = useState<{
        title: string;
        message: string;
    } | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        }),
    );

    const saveProduct = async () => {
        const v = validateProduct(productForm, products, editingProduct?.id);
        if (!v.valid) {
            setProductError(v.error!);
            return;
        }
        try {
            if (editingProduct) await update(editingProduct.id, productForm);
            else await add(productForm);
            setShowProductForm(false);
        } catch (err) {
            setProductError(
                err instanceof Error ? err.message : "Failed to save",
            );
        }
    };

    const saveTemplate = async () => {
        const v = validateTemplate(templateForm, templates);
        if (!v.valid) {
            setTemplateError(v.error!);
            return;
        }
        try {
            await addTemplate({
                templateName: templateForm.templateName,
                brandList: templateForm.selectedBrands,
            });
            setShowTemplateForm(false);
        } catch (err) {
            setTemplateError(
                err instanceof Error ? err.message : "Failed to save",
            );
        }
    };

    const handleDeleteProductConfirm = async () => {
        if (!deleteProductTarget) return;
        try {
            await remove(deleteProductTarget);
        } catch (err) {
            setAlertInfo({
                title: "Error",
                message:
                    err instanceof Error ? err.message : "Failed to delete",
            });
        }
        setDeleteProductTarget(null);
    };

    const handleDeleteTemplateConfirm = async () => {
        if (!deleteTemplateTarget) return;
        try {
            await removeTemplate(deleteTemplateTarget.id);
        } catch (err) {
            setAlertInfo({
                title: "Error",
                message:
                    err instanceof Error ? err.message : "Failed to delete",
            });
        }
        setDeleteTemplateTarget(null);
    };

    if (loading || tl)
        return (
            <div className="flex items-center justify-center py-12">
                <div className="text-stone-400 text-sm">Loading...</div>
            </div>
        );
    if (error || te)
        return (
            <Card className="p-6 text-center">
                <p className="text-red-500 text-sm">{error || te}</p>
            </Card>
        );

    const brandOrder = [...new Set(products.map((p) => p.brandMain))];
    const grouped: Record<string, Record<string, Product[]>> = {};
    for (const p of products) {
        if (!grouped[p.brandMain]) grouped[p.brandMain] = {};
        if (!grouped[p.brandMain][p.subCategory])
            grouped[p.brandMain][p.subCategory] = [];
        grouped[p.brandMain][p.subCategory].push(p);
    }

    return (
        <div className="space-y-4">
            <Card noPadding className="p-1 flex">
                {(["products", "templates"] as const).map((s) => (
                    <button
                        key={s}
                        onClick={() => setSection(s)}
                        className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 capitalize ${section === s ? "text-white" : "text-stone-500 hover:text-stone-700"}`}
                        style={
                            section === s
                                ? {
                                      background:
                                          "linear-gradient(135deg, #5b8c7a, #6d9e8a)",
                                  }
                                : {}
                        }
                    >
                        {s}
                    </button>
                ))}
            </Card>

            {section === "products" && (
                <Card>
                    <CardHeader>
                        <h3 className="font-semibold text-stone-900 tracking-tight">
                            Products{" "}
                            <span className="text-stone-300 font-normal text-sm">
                                ({products.length})
                            </span>
                        </h3>
                        <button
                            onClick={() => {
                                setEditingProduct(null);
                                setProductForm({
                                    brandMain: "",
                                    subCategory: "",
                                    fullName: "",
                                    price: 0,
                                });
                                setProductError("");
                                setShowProductForm(true);
                            }}
                            className="text-sm font-medium transition-colors hover:opacity-80"
                            style={{ color: "#5b8c7a" }}
                        >
                            + Add Product
                        </button>
                    </CardHeader>

                    <DndContext
                        id="brands"
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={(e) => {
                            if (e.over && e.active.id !== e.over.id) {
                                const b = [
                                    ...new Set(
                                        products.map((p) => p.brandMain),
                                    ),
                                ];
                                const o = b.indexOf(e.active.id as string);
                                const n = b.indexOf(e.over.id as string);
                                if (o !== -1 && n !== -1)
                                    reorderBrands(arrayMove(b, o, n));
                            }
                        }}
                    >
                        <SortableContext
                            items={brandOrder}
                            strategy={verticalListSortingStrategy}
                        >
                            <div>
                                {brandOrder.map((brand) => {
                                    const cats = grouped[brand] || {};
                                    const subCatOrder = [
                                        ...new Set(
                                            products
                                                .filter(
                                                    (p) =>
                                                        p.brandMain === brand,
                                                )
                                                .map((p) => p.subCategory),
                                        ),
                                    ];
                                    return (
                                        <div key={brand}>
                                            <SortableBrandHeader
                                                brand={brand}
                                                isExpanded={brandExpand.isExpanded(
                                                    brand,
                                                )}
                                                onToggle={() =>
                                                    brandExpand.toggle(brand)
                                                }
                                            />
                                            {brandExpand.isExpanded(brand) && (
                                                <div className="pl-4 mt-2 space-y-1">
                                                    <DndContext
                                                        id={`sub-${brand}`}
                                                        sensors={sensors}
                                                        collisionDetection={
                                                            closestCenter
                                                        }
                                                        onDragEnd={(e) => {
                                                            if (
                                                                e.over &&
                                                                e.active.id !==
                                                                    e.over.id
                                                            ) {
                                                                const sc = [
                                                                    ...new Set(
                                                                        products
                                                                            .filter(
                                                                                (
                                                                                    p,
                                                                                ) =>
                                                                                    p.brandMain ===
                                                                                    brand,
                                                                            )
                                                                            .map(
                                                                                (
                                                                                    p,
                                                                                ) =>
                                                                                    p.subCategory,
                                                                            ),
                                                                    ),
                                                                ];
                                                                const o =
                                                                    sc.indexOf(
                                                                        e.active
                                                                            .id as string,
                                                                    );
                                                                const n =
                                                                    sc.indexOf(
                                                                        e.over
                                                                            .id as string,
                                                                    );
                                                                if (
                                                                    o !== -1 &&
                                                                    n !== -1
                                                                )
                                                                    reorderSubCategories(
                                                                        brand,
                                                                        arrayMove(
                                                                            sc,
                                                                            o,
                                                                            n,
                                                                        ),
                                                                    );
                                                            }
                                                        }}
                                                    >
                                                        <SortableContext
                                                            items={subCatOrder}
                                                            strategy={
                                                                verticalListSortingStrategy
                                                            }
                                                        >
                                                            <div>
                                                                {subCatOrder.map(
                                                                    (
                                                                        subCat,
                                                                    ) => {
                                                                        const prods =
                                                                            cats[
                                                                                subCat
                                                                            ] ||
                                                                            [];
                                                                        const subKey = `${brand}::${subCat}`;
                                                                        return (
                                                                            <div
                                                                                key={
                                                                                    subCat
                                                                                }
                                                                            >
                                                                                <SortableSubCatWrapper
                                                                                    subCat={
                                                                                        subCat
                                                                                    }
                                                                                    count={
                                                                                        prods.length
                                                                                    }
                                                                                    isExpanded={subCatExpand.isExpanded(
                                                                                        subKey,
                                                                                    )}
                                                                                    onToggle={() =>
                                                                                        subCatExpand.toggle(
                                                                                            subKey,
                                                                                        )
                                                                                    }
                                                                                />
                                                                                {subCatExpand.isExpanded(
                                                                                    subKey,
                                                                                ) && (
                                                                                    <div className="pl-4 space-y-0.5">
                                                                                        <DndContext
                                                                                            id={`prod-${brand}-${subCat}`}
                                                                                            sensors={
                                                                                                sensors
                                                                                            }
                                                                                            collisionDetection={
                                                                                                closestCenter
                                                                                            }
                                                                                            onDragEnd={(
                                                                                                e,
                                                                                            ) => {
                                                                                                if (
                                                                                                    e.over &&
                                                                                                    e
                                                                                                        .active
                                                                                                        .id !==
                                                                                                        e
                                                                                                            .over
                                                                                                            .id
                                                                                                ) {
                                                                                                    const pp =
                                                                                                        products.filter(
                                                                                                            (
                                                                                                                p,
                                                                                                            ) =>
                                                                                                                p.brandMain ===
                                                                                                                    brand &&
                                                                                                                p.subCategory ===
                                                                                                                    subCat,
                                                                                                        );
                                                                                                    const o =
                                                                                                        pp.findIndex(
                                                                                                            (
                                                                                                                p,
                                                                                                            ) =>
                                                                                                                p.id ===
                                                                                                                e
                                                                                                                    .active
                                                                                                                    .id,
                                                                                                        );
                                                                                                    const n =
                                                                                                        pp.findIndex(
                                                                                                            (
                                                                                                                p,
                                                                                                            ) =>
                                                                                                                p.id ===
                                                                                                                e
                                                                                                                    .over!
                                                                                                                    .id,
                                                                                                        );
                                                                                                    if (
                                                                                                        o !==
                                                                                                            -1 &&
                                                                                                        n !==
                                                                                                            -1
                                                                                                    )
                                                                                                        reorderProducts(
                                                                                                            brand,
                                                                                                            subCat,
                                                                                                            arrayMove(
                                                                                                                pp,
                                                                                                                o,
                                                                                                                n,
                                                                                                            ).map(
                                                                                                                (
                                                                                                                    p,
                                                                                                                ) =>
                                                                                                                    p.id,
                                                                                                            ),
                                                                                                        );
                                                                                                }
                                                                                            }}
                                                                                        >
                                                                                            <SortableContext
                                                                                                items={prods.map(
                                                                                                    (
                                                                                                        p,
                                                                                                    ) =>
                                                                                                        p.id,
                                                                                                )}
                                                                                                strategy={
                                                                                                    verticalListSortingStrategy
                                                                                                }
                                                                                            >
                                                                                                <div>
                                                                                                    {prods.map(
                                                                                                        (
                                                                                                            p,
                                                                                                        ) => (
                                                                                                            <SortableProductItem
                                                                                                                key={
                                                                                                                    p.id
                                                                                                                }
                                                                                                                product={
                                                                                                                    p
                                                                                                                }
                                                                                                                onEdit={(
                                                                                                                    prod,
                                                                                                                ) => {
                                                                                                                    setEditingProduct(
                                                                                                                        prod,
                                                                                                                    );
                                                                                                                    setProductForm(
                                                                                                                        {
                                                                                                                            brandMain:
                                                                                                                                prod.brandMain,
                                                                                                                            subCategory:
                                                                                                                                prod.subCategory,
                                                                                                                            fullName:
                                                                                                                                prod.fullName,
                                                                                                                            price: prod.price,
                                                                                                                        },
                                                                                                                    );
                                                                                                                    setProductError(
                                                                                                                        "",
                                                                                                                    );
                                                                                                                    setShowProductForm(
                                                                                                                        true,
                                                                                                                    );
                                                                                                                }}
                                                                                                                onDelete={(
                                                                                                                    id,
                                                                                                                ) =>
                                                                                                                    setDeleteProductTarget(
                                                                                                                        id,
                                                                                                                    )
                                                                                                                }
                                                                                                            />
                                                                                                        ),
                                                                                                    )}
                                                                                                </div>
                                                                                            </SortableContext>
                                                                                        </DndContext>
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        );
                                                                    },
                                                                )}
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
                </Card>
            )}

            {section === "templates" && (
                <Card>
                    <CardHeader>
                        <h3 className="font-semibold text-stone-900 tracking-tight">
                            Templates{" "}
                            <span className="text-stone-300 font-normal text-sm">
                                ({templates.length})
                            </span>
                        </h3>
                        <button
                            onClick={() => {
                                setTemplateForm({
                                    templateName: "",
                                    selectedBrands: [],
                                });
                                setTemplateError("");
                                setShowTemplateForm(true);
                            }}
                            className="text-sm font-medium transition-colors hover:opacity-80"
                            style={{ color: "#5b8c7a" }}
                        >
                            + New Template
                        </button>
                    </CardHeader>
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={(e) => {
                            if (e.over && e.active.id !== e.over.id) {
                                const o = templates.findIndex(
                                    (t) => t.templateId === e.active.id,
                                );
                                const n = templates.findIndex(
                                    (t) => t.templateId === e.over!.id,
                                );
                                if (o !== -1 && n !== -1)
                                    reorderTemplates(
                                        arrayMove(templates, o, n).map(
                                            (t) => t.templateId,
                                        ),
                                    );
                            }
                        }}
                    >
                        <SortableContext
                            items={templates.map((t) => t.templateId)}
                            strategy={verticalListSortingStrategy}
                        >
                            <div className="space-y-2">
                                {templates.map((t) => (
                                    <SortableTemplateItem
                                        key={t.templateId}
                                        template={t}
                                        onDelete={(id) =>
                                            setDeleteTemplateTarget({
                                                id,
                                                name: t.templateName,
                                            })
                                        }
                                    />
                                ))}
                            </div>
                        </SortableContext>
                    </DndContext>
                </Card>
            )}

            <ProductFormModal
                isOpen={showProductForm}
                onClose={() => setShowProductForm(false)}
                editingProduct={editingProduct}
                form={productForm}
                onChange={setProductForm}
                error={productError}
                brands={distinctValues.brands}
                subCategorySuggestions={getSubCategorySuggestions(
                    productForm.brandMain,
                )}
                onSave={saveProduct}
            />

            <TemplateFormModal
                isOpen={showTemplateForm}
                onClose={() => setShowTemplateForm(false)}
                form={templateForm}
                onChange={setTemplateForm}
                error={templateError}
                brands={distinctValues.brands}
                onSave={saveTemplate}
            />

            <ConfirmModal
                isOpen={deleteProductTarget !== null}
                onCancel={() => setDeleteProductTarget(null)}
                onConfirm={handleDeleteProductConfirm}
                title="Delete Product"
                message="Are you sure you want to delete this product? This cannot be undone."
                confirmLabel="Delete"
                danger
            />

            <ConfirmModal
                isOpen={deleteTemplateTarget !== null}
                onCancel={() => setDeleteTemplateTarget(null)}
                onConfirm={handleDeleteTemplateConfirm}
                title="Delete Template"
                message={`Delete template "${deleteTemplateTarget?.name}"? This cannot be undone.`}
                confirmLabel="Delete"
                danger
            />

            <AlertModal
                isOpen={alertInfo !== null}
                title={alertInfo?.title || ""}
                message={alertInfo?.message || ""}
                onClose={() => setAlertInfo(null)}
            />
        </div>
    );
}
