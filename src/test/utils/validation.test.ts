import { describe, it, expect } from "vitest";
import {
  validateProduct,
  validateTemplate,
  validateShift,
} from "../../utils/validation";

describe("validateProduct", () => {
  const existingProducts = [
    {
      id: "1",
      brandMain: "Montblanc",
      subCategory: "Explorer",
      fullName: "Explorer 100ml",
      price: 185,
      sortOrder: 0,
      createdAt: "",
      updatedAt: "",
    },
  ];

  it("accepts valid product", () => {
    const result = validateProduct(
      {
        brandMain: "Coach",
        subCategory: "Men",
        fullName: "Coach Men",
        price: 135,
      },
      existingProducts,
    );
    expect(result.valid).toBe(true);
  });

  it("rejects missing fields", () => {
    const result = validateProduct(
      { brandMain: "", subCategory: "", fullName: "", price: 0 },
      existingProducts,
    );
    expect(result.valid).toBe(false);
    expect(result.error).toContain("required");
  });

  it("rejects duplicate name in same brand", () => {
    const result = validateProduct(
      {
        brandMain: "Montblanc",
        subCategory: "Explorer",
        fullName: "Explorer 100ml",
        price: 190,
      },
      existingProducts,
    );
    expect(result.valid).toBe(false);
    expect(result.error).toContain("already exists");
  });

  it("allows same name in different brand", () => {
    const result = validateProduct(
      {
        brandMain: "Coach",
        subCategory: "Men",
        fullName: "Explorer 100ml",
        price: 100,
      },
      existingProducts,
    );
    expect(result.valid).toBe(true);
  });
});

describe("validateTemplate", () => {
  const existingTemplates = [
    {
      templateId: "tpl-1",
      templateName: "Interparfum",
      brandList: ["Montblanc"],
      sortOrder: 0,
      createdAt: "",
    },
  ];

  it("accepts valid template", () => {
    const result = validateTemplate(
      { templateName: "New Template", selectedBrands: ["Coach"] },
      existingTemplates,
    );
    expect(result.valid).toBe(true);
  });

  it("rejects missing name", () => {
    const result = validateTemplate(
      { templateName: "", selectedBrands: ["Coach"] },
      existingTemplates,
    );
    expect(result.valid).toBe(false);
  });

  it("rejects duplicate template name", () => {
    const result = validateTemplate(
      { templateName: "Interparfum", selectedBrands: ["Coach"] },
      existingTemplates,
    );
    expect(result.valid).toBe(false);
  });

  it("allows empty brand list", () => {
    const result = validateTemplate(
      { templateName: "Empty Brands", selectedBrands: [] },
      existingTemplates,
    );
    expect(result.valid).toBe(true);
  });
});

describe("validateShift", () => {
  it("accepts valid shift", () => {
    const result = validateShift({
      selectedTemplate: "tpl-1",
      recordDate: "2026-09-01",
      timeStart: "07:00",
      timeEnd: "12:00",
    });
    expect(result.valid).toBe(true);
  });

  it("rejects missing template", () => {
    const result = validateShift({
      selectedTemplate: "",
      recordDate: "2026-09-01",
      timeStart: "07:00",
      timeEnd: "12:00",
    });
    expect(result.valid).toBe(false);
  });

  it("rejects end time before start time", () => {
    const result = validateShift({
      selectedTemplate: "tpl-1",
      recordDate: "2026-09-01",
      timeStart: "12:00",
      timeEnd: "07:00",
    });
    expect(result.valid).toBe(false);
  });
});
