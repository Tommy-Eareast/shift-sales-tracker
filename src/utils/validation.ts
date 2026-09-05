import type { Product, ShiftTemplate } from "../types";

/**
 * Validation rules extracted from components for reusability and testability.
 */

export type ValidationResult = {
  valid: boolean;
  error?: string;
};

/**
 * Validates a product form submission.
 * Checks: required fields, price > 0, duplicate name within same brand.
 */
export function validateProduct(
  form: {
    brandMain: string;
    subCategory: string;
    fullName: string;
    price: number;
  },
  existingProducts: Product[],
  editingId?: string,
): ValidationResult {
  if (!form.brandMain || !form.subCategory || !form.fullName) {
    return { valid: false, error: "Please fill in all required fields" };
  }

  if (form.price <= 0) {
    return { valid: false, error: "Price must be greater than 0" };
  }

  const duplicate = existingProducts.find(
    (p) =>
      p.fullName.toLowerCase() === form.fullName.toLowerCase() &&
      p.brandMain.toLowerCase() === form.brandMain.toLowerCase() &&
      p.id !== editingId,
  );

  if (duplicate) {
    return {
      valid: false,
      error: `A product named "${duplicate.fullName}" already exists under ${duplicate.brandMain}`,
    };
  }

  return { valid: true };
}

/**
 * Validates a template form submission.
 * Checks: name required, at least one brand selected, name uniqueness.
 */
export function validateTemplate(
  form: { templateName: string; selectedBrands: string[] },
  existingTemplates: ShiftTemplate[],
  excludeId?: string,
): ValidationResult {
  if (!form.templateName.trim()) {
    return { valid: false, error: "Please provide a template name" };
  }

  // Brands are optional — removed the "at least one brand" check

  const duplicate = existingTemplates.find(
    (t) =>
      t.templateName.toLowerCase() === form.templateName.toLowerCase() &&
      t.templateId !== excludeId,
  );

  if (duplicate) {
    return {
      valid: false,
      error: `A template named "${duplicate.templateName}" already exists`,
    };
  }

  return { valid: true };
}

/**
 * Validates shift creation/editing form.
 */
export function validateShift(form: {
  selectedTemplate: string;
  recordDate: string;
  timeStart: string;
  timeEnd: string;
}): ValidationResult {
  if (!form.selectedTemplate) {
    return { valid: false, error: "Please select a template" };
  }

  if (!form.recordDate) {
    return { valid: false, error: "Please select a date" };
  }

  if (!form.timeStart || !form.timeEnd) {
    return { valid: false, error: "Please set start and end times" };
  }

  if (form.timeStart >= form.timeEnd) {
    return { valid: false, error: "End time must be after start time" };
  }

  return { valid: true };
}
