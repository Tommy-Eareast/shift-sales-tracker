import { useState, useEffect, useMemo, useCallback } from "react";
import type { Product, ShiftTemplate } from "../types";
import {
    getProductsSorted,
    getAllTemplates,
    addProduct,
    updateProduct,
    deleteProduct,
    addTemplate,
    deleteTemplate,
    updateProductSortOrder,
    updateTemplateSortOrder,
    updateBrandOrder,
    updateSubCategoryOrder,
    getOrderingConfig,
    getDistinctValues,
} from "../db/operations";
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
    useSortable,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import AutocompleteInput from "../components/AutocompleteInput";

function SortableProductItem({
    product,
    onEdit,
    onDelete,
}: {
    product: Product;
    onEdit: (product: Product) => void;
    onDelete: (id: string) => void;
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: product.id });
    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 50 : undefined,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="flex items-center justify-between p-2.5 hover:bg-stone-50 rounded-lg text-sm group transition-colors"
        >
            <div className="flex items-center gap-2 flex-1 min-w-0">
                <button
                    {...attributes}
                    {...listeners}
                    className="cursor-grab active:cursor-grabbing p-1 hover:bg-stone-200 rounded touch-none flex-shrink-0"
                >
                    <svg
                        className="w-3.5 h-3.5 text-stone-300"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path d="M8 6h2v2H8V6zm6 0h2v2h-2V6zM8 11h2v2H8v-2zm6 0h2v2h-2v-2zm-6 5h2v2H8v-2zm6 0h2v2h-2v-2z" />
                    </svg>
                </button>
                <span className="text-stone-700 truncate text-sm">
                    {product.fullName}
                </span>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-stone-400 text-xs">${product.price}</span>
                <div className="hidden group-hover:flex items-center gap-0.5">
                    <button
                        onClick={() => onEdit(product)}
                        className="p-1.5 rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition-colors"
                    >
                        <svg
                            className="w-3.5 h-3.5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
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
                        className="p-1.5 rounded-lg text-stone-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                    >
                        <svg
                            className="w-3.5 h-3.5"
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
        </div>
    );
}

function SortableSubCategoryHeader({
    subCat,
    productCount,
    isExpanded,
    onToggle,
    dragHandleProps,
}: {
    subCat: string;
    productCount: number;
    isExpanded: boolean;
    onToggle: () => void;
    dragHandleProps: Record<string, unknown>;
}) {
    return (
        <div className="flex items-center w-full hover:bg-stone-50 rounded-lg transition-colors">
            <button
                {...dragHandleProps}
                className="cursor-grab active:cursor-grabbing p-1.5 hover:bg-stone-200 rounded touch-none flex-shrink-0"
            >
                <svg
                    className="w-3.5 h-3.5 text-stone-300"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path d="M8 6h2v2H8V6zm6 0h2v2h-2V6zM8 11h2v2H8v-2zm6 0h2v2h-2v-2zm-6 5h2v2H8v-2zm6 0h2v2h-2v-2z" />
                </svg>
            </button>
            <button
                onClick={onToggle}
                className="flex-1 flex items-center justify-between px-3 py-2 text-left"
            >
                <p className="text-xs font-medium text-stone-500 uppercase tracking-wider">
                    {subCat}{" "}
                    <span className="text-stone-300 font-normal">
                        ({productCount})
                    </span>
                </p>
                <span className="text-stone-300 text-xs">
                    {isExpanded ? "▾" : "▸"}
                </span>
            </button>
        </div>
    );
}

function SortableSubCategoryHeaderWrapper({
    subCat,
    productCount,
    isExpanded,
    onToggle,
}: {
    subCat: string;
    productCount: number;
    isExpanded: boolean;
    onToggle: () => void;
}) {
    const { attributes, listeners, setNodeRef, transform, transition } =
        useSortable({ id: subCat });
    const style = { transform: CSS.Transform.toString(transform), transition };
    return (
        <div ref={setNodeRef} style={style}>
            <SortableSubCategoryHeader
                subCat={subCat}
                productCount={productCount}
                isExpanded={isExpanded}
                onToggle={onToggle}
                dragHandleProps={{ ...attributes, ...listeners }}
            />
        </div>
    );
}

function SortableBrandHeader({
    brand,
    isExpanded,
    onToggle,
}: {
    brand: string;
    isExpanded: boolean;
    onToggle: () => void;
}) {
    const { attributes, listeners, setNodeRef, transform, transition } =
        useSortable({ id: brand });
    const style = { transform: CSS.Transform.toString(transform), transition };
    return (
        <div ref={setNodeRef} style={style} className="mb-3">
            <div
                className="flex items-center w-full p-3 rounded-xl hover:bg-stone-50 transition-colors"
                style={{
                    backgroundColor: "#fafaf9",
                    border: "1px solid #e7e5e2",
                }}
            >
                <button
                    {...attributes}
                    {...listeners}
                    className="cursor-grab active:cursor-grabbing p-1.5 hover:bg-stone-200 rounded touch-none flex-shrink-0"
                >
                    <svg
                        className="w-4 h-4 text-stone-300"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path d="M8 6h2v2H8V6zm6 0h2v2h-2V6zM8 11h2v2H8v-2zm6 0h2v2h-2v-2zm-6 5h2v2H8v-2zm6 0h2v2h-2v-2z" />
                    </svg>
                </button>
                <button
                    onClick={onToggle}
                    className="flex-1 flex items-center justify-between ml-2"
                >
                    <span className="font-semibold text-stone-900 text-sm">
                        {brand}
                    </span>
                    <span className="text-stone-300 text-xs">
                        {isExpanded ? "▾" : "▸"}
                    </span>
                </button>
            </div>
        </div>
    );
}

function SortableTemplateItem({
    template,
    onDelete,
}: {
    template: ShiftTemplate;
    onDelete: (id: string, name: string) => void;
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: template.templateId });
    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
    };
    return (
        <div
            ref={setNodeRef}
            style={style}
            className="flex items-center justify-between p-3.5 rounded-xl border border-stone-200/60 bg-white"
        >
            <div className="flex items-center gap-2.5 flex-1 min-w-0">
                <button
                    {...attributes}
                    {...listeners}
                    className="cursor-grab active:cursor-grabbing p-1.5 hover:bg-stone-100 rounded touch-none flex-shrink-0"
                >
                    <svg
                        className="w-4 h-4 text-stone-300"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path d="M8 6h2v2H8V6zm6 0h2v2h-2V6zM8 11h2v2H8v-2zm6 0h2v2h-2v-2zm-6 5h2v2H8v-2zm6 0h2v2h-2v-2z" />
                    </svg>
                </button>
                <div className="text-left min-w-0">
                    <p className="font-semibold text-stone-900 text-sm truncate">
                        {template.templateName}
                    </p>
                    <p className="text-xs text-stone-400 mt-0.5 truncate">
                        {template.brandList.join(", ")}
                    </p>
                </div>
            </div>
            <button
                onClick={() =>
                    onDelete(template.templateId, template.templateName)
                }
                className="p-1.5 rounded-lg text-stone-400 hover:text-red-500 hover:bg-red-50 transition-colors flex-shrink-0 ml-2"
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
    );
}

export default function Admin() {
    const [products, setProducts] = useState<Product[]>([]);
    const [templates, setTemplates] = useState<ShiftTemplate[]>([]);
    const [activeSection, setActiveSection] = useState<
        "products" | "templates"
    >("products");
    const [expandedBrands, setExpandedBrands] = useState<Set<string>>(
        new Set(),
    );
    const [expandedSubCategories, setExpandedSubCategories] = useState<
        Set<string>
    >(new Set());
    const [brandOrder, setBrandOrder] = useState<string[]>([]);
    const [subCategoryOrders, setSubCategoryOrders] = useState<
        Record<string, string[]>
    >({});
    const [showProductForm, setShowProductForm] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [productForm, setProductForm] = useState({
        brandMain: "",
        subCategory: "",
        fullName: "",
        price: 0,
    });
    const [productError, setProductError] = useState("");
    const [showTemplateForm, setShowTemplateForm] = useState(false);
    const [templateForm, setTemplateForm] = useState({
        templateName: "",
        selectedBrands: [] as string[],
    });
    const [templateError, setTemplateError] = useState("");

    const distinctValues = useMemo(
        () => getDistinctValues(products),
        [products],
    );

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        }),
    );

    const refreshData = async () => {
        const productData = await getProductsSorted();
        setProducts(productData);
        const templateData = await getAllTemplates();
        setTemplates(templateData);
        const config = await getOrderingConfig();
        setBrandOrder(config.brandOrder);
        setSubCategoryOrders(config.subCategoryOrders);
    };

    useEffect(() => {
        let cancelled = false;
        (async () => {
            const productData = await getProductsSorted();
            if (cancelled) return;
            setProducts(productData);
            const templateData = await getAllTemplates();
            if (cancelled) return;
            setTemplates(templateData);
            const config = await getOrderingConfig();
            if (cancelled) return;
            setBrandOrder(config.brandOrder);
            setSubCategoryOrders(config.subCategoryOrders);
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    const groupedProducts = useMemo(() => {
        const grouped: Record<string, Record<string, Product[]>> = {};
        for (const p of products) {
            if (!grouped[p.brandMain]) grouped[p.brandMain] = {};
            if (!grouped[p.brandMain][p.subCategory])
                grouped[p.brandMain][p.subCategory] = [];
            grouped[p.brandMain][p.subCategory].push(p);
        }
        return grouped;
    }, [products]);

    const displayBrandOrder = useMemo(() => {
        const seen = new Set<string>();
        const order = [...brandOrder];
        for (const p of products) {
            if (!seen.has(p.brandMain)) {
                seen.add(p.brandMain);
                if (!order.includes(p.brandMain)) order.push(p.brandMain);
            }
        }
        return order.filter((b) => groupedProducts[b]);
    }, [products, brandOrder, groupedProducts]);

    const getSubCategoryOrder = useCallback(
        (brand: string): string[] => {
            const brandProducts = groupedProducts[brand] || {};
            const configured = subCategoryOrders[brand] || [];
            const order = [...configured];
            for (const subCat of Object.keys(brandProducts)) {
                if (!order.includes(subCat)) order.push(subCat);
            }
            return order.filter((sc) => brandProducts[sc]);
        },
        [groupedProducts, subCategoryOrders],
    );

    const toggleBrand = (brand: string) => {
        setExpandedBrands((prev) => {
            const next = new Set(prev);
            if (next.has(brand)) next.delete(brand);
            else next.add(brand);
            return next;
        });
    };
    const toggleSubCategory = (key: string) => {
        setExpandedSubCategories((prev) => {
            const next = new Set(prev);
            if (next.has(key)) next.delete(key);
            else next.add(key);
            return next;
        });
    };

    const handleAddProduct = () => {
        setEditingProduct(null);
        setProductForm({
            brandMain: "",
            subCategory: "",
            fullName: "",
            price: 0,
        });
        setProductError("");
        setShowProductForm(true);
    };
    const handleEditProduct = (product: Product) => {
        setEditingProduct(product);
        setProductForm({
            brandMain: product.brandMain,
            subCategory: product.subCategory,
            fullName: product.fullName,
            price: product.price,
        });
        setProductError("");
        setShowProductForm(true);
    };

    const validateProductForm = (): boolean => {
        if (
            !productForm.brandMain ||
            !productForm.subCategory ||
            !productForm.fullName ||
            productForm.price <= 0
        ) {
            setProductError("Please fill in all required fields");
            return false;
        }
        const existing = products.find(
            (p) =>
                p.fullName.toLowerCase() ===
                    productForm.fullName.toLowerCase() &&
                p.brandMain.toLowerCase() ===
                    productForm.brandMain.toLowerCase() &&
                (!editingProduct || p.id !== editingProduct.id),
        );
        if (existing) {
            setProductError(
                `A product named "${existing.fullName}" already exists under ${existing.brandMain}`,
            );
            return false;
        }
        return true;
    };

    const handleSaveProduct = async () => {
        if (!validateProductForm()) return;
        setProductError("");
        try {
            if (editingProduct)
                await updateProduct(editingProduct.id, productForm);
            else await addProduct(productForm);
            setShowProductForm(false);
            await refreshData();
        } catch (error) {
            console.error("Failed to save product:", error);
            setProductError("Failed to save product.");
        }
    };
    const handleDeleteProduct = async (id: string) => {
        if (confirm("Are you sure you want to delete this product?")) {
            await deleteProduct(id);
            await refreshData();
        }
    };

    const getSubCategorySuggestions = useCallback(
        (brandMain: string): string[] => {
            if (!brandMain) return [];
            const brandProducts = products.filter(
                (p) => p.brandMain === brandMain,
            );
            return [...new Set(brandProducts.map((p) => p.subCategory))].sort();
        },
        [products],
    );

    const handleBrandDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;
        const oldIndex = displayBrandOrder.indexOf(active.id as string);
        const newIndex = displayBrandOrder.indexOf(over.id as string);
        if (oldIndex !== -1 && newIndex !== -1) {
            const newOrder = arrayMove(displayBrandOrder, oldIndex, newIndex);
            setBrandOrder(newOrder);
            await updateBrandOrder(newOrder);
        }
    };
    const handleSubCategoryDragEnd = async (
        brand: string,
        event: DragEndEvent,
    ) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;
        const currentOrder = getSubCategoryOrder(brand);
        const oldIndex = currentOrder.indexOf(active.id as string);
        const newIndex = currentOrder.indexOf(over.id as string);
        if (oldIndex !== -1 && newIndex !== -1) {
            const newOrder = arrayMove(currentOrder, oldIndex, newIndex);
            setSubCategoryOrders((prev) => ({ ...prev, [brand]: newOrder }));
            await updateSubCategoryOrder(brand, newOrder);
        }
    };
    const handleProductDragEnd = async (
        brandMain: string,
        subCategory: string,
        event: DragEndEvent,
    ) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;
        const subCatProducts = groupedProducts[brandMain]?.[subCategory] || [];
        const oldIndex = subCatProducts.findIndex((p) => p.id === active.id);
        const newIndex = subCatProducts.findIndex((p) => p.id === over.id);
        if (oldIndex !== -1 && newIndex !== -1) {
            const reordered = arrayMove(subCatProducts, oldIndex, newIndex);
            await updateProductSortOrder(
                brandMain,
                subCategory,
                reordered.map((p) => p.id),
            );
            await refreshData();
        }
    };

    const handleAddTemplate = () => {
        setTemplateForm({ templateName: "", selectedBrands: [] });
        setTemplateError("");
        setShowTemplateForm(true);
    };
    const validateTemplateForm = (): boolean => {
        if (!templateForm.templateName) {
            setTemplateError("Please provide a template name");
            return false;
        }
        if (templateForm.selectedBrands.length === 0) {
            setTemplateError("Please select at least one brand");
            return false;
        }
        const existing = templates.find(
            (t) =>
                t.templateName.toLowerCase() ===
                templateForm.templateName.toLowerCase(),
        );
        if (existing) {
            setTemplateError(
                `A template named "${existing.templateName}" already exists`,
            );
            return false;
        }
        return true;
    };
    const handleSaveTemplate = async () => {
        if (!validateTemplateForm()) return;
        setTemplateError("");
        try {
            await addTemplate({
                templateName: templateForm.templateName,
                brandList: templateForm.selectedBrands,
            });
            setShowTemplateForm(false);
            await refreshData();
        } catch (error) {
            console.error("Failed to save template:", error);
            setTemplateError("Failed to save template.");
        }
    };
    const handleDeleteTemplate = async (
        templateId: string,
        templateName: string,
    ) => {
        if (confirm(`Delete template "${templateName}"?`)) {
            try {
                await deleteTemplate(templateId);
                await refreshData();
            } catch (error) {
                if (error instanceof Error) alert(error.message);
            }
        }
    };
    const toggleBrandSelection = (brand: string) => {
        setTemplateForm((prev) => ({
            ...prev,
            selectedBrands: prev.selectedBrands.includes(brand)
                ? prev.selectedBrands.filter((b) => b !== brand)
                : [...prev.selectedBrands, brand],
        }));
    };
    const handleTemplateDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;
        const oldIndex = templates.findIndex((t) => t.templateId === active.id);
        const newIndex = templates.findIndex((t) => t.templateId === over.id);
        if (oldIndex !== -1 && newIndex !== -1) {
            const newTemplates = arrayMove(templates, oldIndex, newIndex);
            setTemplates(newTemplates);
            await updateTemplateSortOrder(
                newTemplates.map((t) => t.templateId),
            );
        }
    };

    const inputClass =
        "w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-2.5 text-sm text-stone-900 placeholder:text-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-300 focus:border-stone-300 transition-all";

    return (
        <div className="space-y-4">
            <div
                className="bg-white rounded-2xl p-1 border border-stone-200/60 flex"
                style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}
            >
                <button
                    onClick={() => setActiveSection("products")}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${activeSection === "products" ? "text-white" : "text-stone-500 hover:text-stone-700"}`}
                    style={
                        activeSection === "products"
                            ? {
                                  background:
                                      "linear-gradient(135deg, #5b8c7a, #6d9e8a)",
                              }
                            : {}
                    }
                >
                    Products
                </button>
                <button
                    onClick={() => setActiveSection("templates")}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${activeSection === "templates" ? "text-white" : "text-stone-500 hover:text-stone-700"}`}
                    style={
                        activeSection === "templates"
                            ? {
                                  background:
                                      "linear-gradient(135deg, #5b8c7a, #6d9e8a)",
                              }
                            : {}
                    }
                >
                    Templates
                </button>
            </div>

            {activeSection === "products" && (
                <div
                    className="bg-white rounded-2xl p-4 border border-stone-200/60"
                    style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}
                >
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-stone-900 tracking-tight">
                            Products{" "}
                            <span className="text-stone-300 font-normal text-sm">
                                ({products.length})
                            </span>
                        </h3>
                        <button
                            onClick={handleAddProduct}
                            className="text-sm font-medium transition-colors hover:opacity-80"
                            style={{ color: "#5b8c7a" }}
                        >
                            + Add Product
                        </button>
                    </div>
                    <p className="text-xs text-stone-300 mb-3 px-1">
                        Drag brands, sub-categories, or products to reorder
                    </p>

                    <DndContext
                        id="brands"
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleBrandDragEnd}
                    >
                        <SortableContext
                            items={displayBrandOrder}
                            strategy={verticalListSortingStrategy}
                        >
                            <div>
                                {displayBrandOrder.map((brand) => {
                                    const brandProducts =
                                        groupedProducts[brand] || {};
                                    const subCatOrder =
                                        getSubCategoryOrder(brand);
                                    return (
                                        <div key={brand}>
                                            <SortableBrandHeader
                                                brand={brand}
                                                isExpanded={expandedBrands.has(
                                                    brand,
                                                )}
                                                onToggle={() =>
                                                    toggleBrand(brand)
                                                }
                                            />
                                            {expandedBrands.has(brand) && (
                                                <div className="pl-4 mt-2 space-y-1">
                                                    <DndContext
                                                        id={`sub-${brand}`}
                                                        sensors={sensors}
                                                        collisionDetection={
                                                            closestCenter
                                                        }
                                                        onDragEnd={(e) =>
                                                            handleSubCategoryDragEnd(
                                                                brand,
                                                                e,
                                                            )
                                                        }
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
                                                                            brandProducts[
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
                                                                                <SortableSubCategoryHeaderWrapper
                                                                                    subCat={
                                                                                        subCat
                                                                                    }
                                                                                    productCount={
                                                                                        prods.length
                                                                                    }
                                                                                    isExpanded={expandedSubCategories.has(
                                                                                        subKey,
                                                                                    )}
                                                                                    onToggle={() =>
                                                                                        toggleSubCategory(
                                                                                            subKey,
                                                                                        )
                                                                                    }
                                                                                />
                                                                                {expandedSubCategories.has(
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
                                                                                            ) =>
                                                                                                handleProductDragEnd(
                                                                                                    brand,
                                                                                                    subCat,
                                                                                                    e,
                                                                                                )
                                                                                            }
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
                                                                                                            product,
                                                                                                        ) => (
                                                                                                            <SortableProductItem
                                                                                                                key={
                                                                                                                    product.id
                                                                                                                }
                                                                                                                product={
                                                                                                                    product
                                                                                                                }
                                                                                                                onEdit={
                                                                                                                    handleEditProduct
                                                                                                                }
                                                                                                                onDelete={
                                                                                                                    handleDeleteProduct
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
                </div>
            )}

            {activeSection === "templates" && (
                <div
                    className="bg-white rounded-2xl p-4 border border-stone-200/60"
                    style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}
                >
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-stone-900 tracking-tight">
                            Templates{" "}
                            <span className="text-stone-300 font-normal text-sm">
                                ({templates.length})
                            </span>
                        </h3>
                        <button
                            onClick={handleAddTemplate}
                            className="text-sm font-medium transition-colors hover:opacity-80"
                            style={{ color: "#5b8c7a" }}
                        >
                            + New Template
                        </button>
                    </div>
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleTemplateDragEnd}
                    >
                        <SortableContext
                            items={templates.map((t) => t.templateId)}
                            strategy={verticalListSortingStrategy}
                        >
                            <div className="space-y-2">
                                {templates.map((template) => (
                                    <SortableTemplateItem
                                        key={template.templateId}
                                        template={template}
                                        onDelete={handleDeleteTemplate}
                                    />
                                ))}
                            </div>
                        </SortableContext>
                    </DndContext>
                </div>
            )}

            {/* Product Form Modal */}
            {showProductForm && (
                <div
                    className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm flex items-end justify-center z-20"
                    onClick={() => setShowProductForm(false)}
                >
                    <div
                        className="bg-white rounded-t-3xl w-full max-w-2xl p-6 animate-slide-up max-h-[90vh] overflow-y-auto"
                        style={{ boxShadow: "0 -4px 24px rgba(0,0,0,0.08)" }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div
                            className="w-10 h-1 rounded-full mx-auto mb-5"
                            style={{ backgroundColor: "#e7e5e2" }}
                        ></div>
                        <h3 className="text-lg font-semibold text-stone-900 mb-5 tracking-tight">
                            {editingProduct ? "Edit Product" : "Add Product"}
                        </h3>
                        {productError && (
                            <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
                                <p className="text-sm text-red-600">
                                    {productError}
                                </p>
                            </div>
                        )}
                        <div className="space-y-4">
                            <AutocompleteInput
                                label="Brand"
                                value={productForm.brandMain}
                                onChange={(v) =>
                                    setProductForm({
                                        ...productForm,
                                        brandMain: v,
                                        subCategory: "",
                                    })
                                }
                                suggestions={distinctValues.brands}
                                placeholder="e.g., Montblanc"
                            />
                            <AutocompleteInput
                                label="Sub Category"
                                value={productForm.subCategory}
                                onChange={(v) =>
                                    setProductForm({
                                        ...productForm,
                                        subCategory: v,
                                    })
                                }
                                suggestions={getSubCategorySuggestions(
                                    productForm.brandMain,
                                )}
                                placeholder="e.g., Explorer Series"
                            />
                            <div>
                                <label className="block text-xs font-medium text-stone-500 mb-1.5 uppercase tracking-wider">
                                    Full Name
                                </label>
                                <input
                                    type="text"
                                    value={productForm.fullName}
                                    onChange={(e) =>
                                        setProductForm({
                                            ...productForm,
                                            fullName: e.target.value,
                                        })
                                    }
                                    placeholder="e.g., Explorer Extreme PF 100ml"
                                    className={inputClass}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-stone-500 mb-1.5 uppercase tracking-wider">
                                    Price (AUD)
                                </label>
                                <input
                                    type="number"
                                    value={productForm.price || ""}
                                    onChange={(e) =>
                                        setProductForm({
                                            ...productForm,
                                            price:
                                                parseFloat(e.target.value) || 0,
                                        })
                                    }
                                    step="0.01"
                                    min="0"
                                    placeholder="0.00"
                                    className={inputClass}
                                />
                            </div>
                            <div className="flex gap-3 pt-1">
                                <button
                                    onClick={() => setShowProductForm(false)}
                                    className="flex-1 py-3 rounded-xl font-medium transition-colors"
                                    style={{
                                        backgroundColor: "#f5f4f1",
                                        color: "#78716c",
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSaveProduct}
                                    className="flex-1 text-white py-3 rounded-xl font-medium transition-all duration-200 active:scale-95"
                                    style={{
                                        background:
                                            "linear-gradient(135deg, #5b8c7a, #6d9e8a)",
                                        boxShadow:
                                            "0 2px 8px rgba(91,140,122,0.2)",
                                    }}
                                >
                                    {editingProduct ? "Update" : "Add"} Product
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Template Form Modal */}
            {showTemplateForm && (
                <div
                    className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm flex items-end justify-center z-20"
                    onClick={() => setShowTemplateForm(false)}
                >
                    <div
                        className="bg-white rounded-t-3xl w-full max-w-2xl p-6 animate-slide-up max-h-[90vh] overflow-y-auto"
                        style={{ boxShadow: "0 -4px 24px rgba(0,0,0,0.08)" }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div
                            className="w-10 h-1 rounded-full mx-auto mb-5"
                            style={{ backgroundColor: "#e7e5e2" }}
                        ></div>
                        <h3 className="text-lg font-semibold text-stone-900 mb-5 tracking-tight">
                            New Template
                        </h3>
                        {templateError && (
                            <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
                                <p className="text-sm text-red-600">
                                    {templateError}
                                </p>
                            </div>
                        )}
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-stone-500 mb-1.5 uppercase tracking-wider">
                                    Template Name
                                </label>
                                <input
                                    type="text"
                                    value={templateForm.templateName}
                                    onChange={(e) =>
                                        setTemplateForm({
                                            ...templateForm,
                                            templateName: e.target.value,
                                        })
                                    }
                                    placeholder="e.g., Interparfum"
                                    className={inputClass}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-stone-500 mb-2 uppercase tracking-wider">
                                    Select Brands
                                </label>
                                <p className="text-xs text-stone-300 mb-3">
                                    Choose brands for this template (cannot be
                                    changed later)
                                </p>
                                {distinctValues.brands.length === 0 ? (
                                    <p className="text-sm text-stone-400 p-4 bg-stone-50 rounded-xl text-center">
                                        No brands available. Add products first.
                                    </p>
                                ) : (
                                    <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto p-2 bg-stone-50 rounded-xl">
                                        {distinctValues.brands.map((brand) => (
                                            <label
                                                key={brand}
                                                className={`flex items-center gap-2.5 p-2.5 rounded-lg cursor-pointer transition-all duration-200 ${templateForm.selectedBrands.includes(brand) ? "border" : "bg-white border border-stone-200 hover:bg-stone-50"}`}
                                                style={
                                                    templateForm.selectedBrands.includes(
                                                        brand,
                                                    )
                                                        ? {
                                                              backgroundColor:
                                                                  "#ecf5f1",
                                                              borderColor:
                                                                  "#5b8c7a",
                                                          }
                                                        : {}
                                                }
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={templateForm.selectedBrands.includes(
                                                        brand,
                                                    )}
                                                    onChange={() =>
                                                        toggleBrandSelection(
                                                            brand,
                                                        )
                                                    }
                                                    className="w-4 h-4 rounded border-stone-300 focus:ring-0"
                                                    style={{
                                                        accentColor: "#5b8c7a",
                                                    }}
                                                />
                                                <span className="text-sm text-stone-700 select-none">
                                                    {brand}
                                                </span>
                                            </label>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div className="flex gap-3 pt-1">
                                <button
                                    onClick={() => setShowTemplateForm(false)}
                                    className="flex-1 py-3 rounded-xl font-medium transition-colors"
                                    style={{
                                        backgroundColor: "#f5f4f1",
                                        color: "#78716c",
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSaveTemplate}
                                    className="flex-1 text-white py-3 rounded-xl font-medium transition-all duration-200 active:scale-95"
                                    style={{
                                        background:
                                            "linear-gradient(135deg, #5b8c7a, #6d9e8a)",
                                        boxShadow:
                                            "0 2px 8px rgba(91,140,122,0.2)",
                                    }}
                                >
                                    Create Template
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
