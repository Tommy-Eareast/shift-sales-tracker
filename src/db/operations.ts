import { productRepo } from "./productRepo";
import { templateRepo } from "./templateRepo";
import { shiftRepo } from "./shiftRepo";
import { salesRepo } from "./salesRepo";
import { configRepo } from "./configRepo";

// Product
export const getAllProducts = () => productRepo.getAll();
export const getProductsByBrand = (brand: string) =>
    productRepo.getByBrand(brand);
export const addProduct = (data: Parameters<typeof productRepo.add>[0]) =>
    productRepo.add(data);
export const updateProduct = (
    id: string,
    updates: Parameters<typeof productRepo.update>[1],
) => productRepo.update(id, updates);
export const deleteProduct = (id: string) => productRepo.delete(id);
export const updateProductSortOrder = (
    _brand: string,
    _subCat: string,
    productIds: string[],
) =>
    productRepo.updateSortOrders(
        productIds.map((id, i) => ({ id, sortOrder: i })),
    );

// Template
export const getAllTemplates = () => templateRepo.getAll();
export const getTemplate = (id: string) => templateRepo.getById(id);
export const addTemplate = (data: Parameters<typeof templateRepo.add>[0]) =>
    templateRepo.add(data);
export const deleteTemplate = (id: string) => templateRepo.delete(id);
export const updateTemplateSortOrder = (ids: string[]) =>
    templateRepo.updateSortOrders(
        ids.map((id, i) => ({ templateId: id, sortOrder: i })),
    );

// Shift
export const getAllShiftRecords = () => shiftRepo.getAll();
export const getShiftRecord = (id: string) => shiftRepo.getById(id);
export const createShiftRecord = (t: string, d: string, s: string, e: string) =>
    shiftRepo.create(t, d, s, e);
export const updateShiftRecord = (
    id: string,
    u: Parameters<typeof shiftRepo.update>[1],
) => shiftRepo.update(id, u);
export const deleteShiftRecord = (id: string) => shiftRepo.delete(id);

// Sales
export const getShiftSales = (shiftId: string) => salesRepo.getByShift(shiftId);
export const adjustSalesCount = (
    shiftId: string,
    productId: string,
    delta: number,
) => salesRepo.adjust(shiftId, productId, delta);
export const getShiftSummary = (shiftId: string) =>
    salesRepo.getSummary(shiftId);

// Config
export const getOrderingConfig = () => configRepo.get();
export const updateBrandOrder = (order: string[]) =>
    configRepo.updateBrandOrder(order);
export const updateSubCategoryOrder = (brand: string, order: string[]) =>
    configRepo.updateSubCategoryOrder(brand, order);
