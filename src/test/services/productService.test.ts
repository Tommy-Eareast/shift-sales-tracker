import { describe, it, expect } from "vitest";
import { productService } from "../../features/products/services/productService";

describe("productService", () => {
  it("getAll returns products with proper mapping", async () => {
    const products = await productService.getAll();
    expect(products).toHaveLength(2);
    expect(products[0].fullName).toBe("Explorer 100ml EDP");
    expect(products[0].price).toBe(185);
  });

  it("getDistinctValues returns sorted unique brands and categories", () => {
    const products = [
      {
        id: "1",
        brandMain: "Coach",
        subCategory: "Men",
        fullName: "Coach Men",
        price: 100,
        sortOrder: 0,
        createdAt: "",
        updatedAt: "",
      },
      {
        id: "2",
        brandMain: "Montblanc",
        subCategory: "Explorer",
        fullName: "Explorer",
        price: 185,
        sortOrder: 0,
        createdAt: "",
        updatedAt: "",
      },
      {
        id: "3",
        brandMain: "Coach",
        subCategory: "Women",
        fullName: "Coach Women",
        price: 120,
        sortOrder: 1,
        createdAt: "",
        updatedAt: "",
      },
    ];
    const { brands, subCategories } =
      productService.getDistinctValues(products);
    expect(brands).toEqual(["Coach", "Montblanc"]);
    expect(subCategories).toEqual(["Explorer", "Men", "Women"]);
  });

  it("getSubCategorySuggestions filters by brand", () => {
    const products = [
      {
        id: "1",
        brandMain: "Coach",
        subCategory: "Men",
        fullName: "Coach Men",
        price: 100,
        sortOrder: 0,
        createdAt: "",
        updatedAt: "",
      },
      {
        id: "2",
        brandMain: "Montblanc",
        subCategory: "Explorer",
        fullName: "Explorer",
        price: 185,
        sortOrder: 0,
        createdAt: "",
        updatedAt: "",
      },
    ];
    const suggestions = productService.getSubCategorySuggestions(
      products,
      "Coach",
    );
    expect(suggestions).toEqual(["Men"]);
  });
});
