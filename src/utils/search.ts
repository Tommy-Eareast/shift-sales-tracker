import type { Product } from '../types';

/**
 * Progressive fuzzy search for products.
 *
 * Strategy (progressive fallback):
 * 1. Try STRICT-AND: all search tokens must appear in the product
 * 2. If no results, fall back to STRICT-OR: any token matches
 * 3. Results are scored and sorted by relevance
 *
 * Scoring is client-side — no backend load.
 */
export function searchProducts(products: Product[], query: string): Product[] {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return products;

    const tokens = trimmed.split(/\s+/).filter(t => t.length > 0);
    if (tokens.length === 0) return products;

    // Build scoring for each product
    const scored = products.map(product => {
        const haystack = `${product.brandMain} ${product.subCategory} ${product.fullName}`.toLowerCase();
        const fullNameLower = product.fullName.toLowerCase();
        const brandLower = product.brandMain.toLowerCase();
        const subCatLower = product.subCategory.toLowerCase();

        // Check token match
        const tokenMatches = tokens.map(t => haystack.includes(t));
        const allTokensMatch = tokenMatches.every(Boolean);
        const matchingTokenCount = tokenMatches.filter(Boolean).length;

        // Scoring (higher = better)
        let score = 0;

        // Exact string matches
        if (fullNameLower === trimmed) score += 1000;
        if (brandLower === trimmed) score += 900;
        if (subCatLower === trimmed) score += 800;

        // Substring matches
        if (fullNameLower.includes(trimmed)) score += 500;
        if (brandLower.includes(trimmed)) score += 400;
        if (subCatLower.includes(trimmed)) score += 300;

        // Token-based bonus
        score += matchingTokenCount * 20;

        // Prefix bonus per token
        for (const token of tokens) {
            if (fullNameLower.startsWith(token)) score += 15;
            if (brandLower.startsWith(token)) score += 10;
            // word-level prefix match
            for (const word of fullNameLower.split(/\s+/)) {
                if (word.startsWith(token)) score += 5;
            }
        }

        return { product, score, allTokensMatch, matchingTokenCount };
    });

    // Step 1: Try STRICT-AND (all tokens match)
    const strictResults = scored
        .filter(s => s.allTokensMatch)
        .sort((a, b) => b.score - a.score)
        .map(s => s.product);

    if (strictResults.length > 0) return strictResults;

    // Step 2: Progressive fallback to STRICT-OR (any token matches)
    const looseResults = scored
        .filter(s => s.matchingTokenCount > 0)
        .sort((a, b) => b.score - a.score)
        .map(s => s.product);

    return looseResults;
}

/**
 * Given a filtered product list, compute which brands and subcategories
 * should remain visible in the hierarchy.
 */
export function computeHierarchyVisibility(
    filteredProducts: Product[],
    groupedProducts: Record<string, Record<string, Product[]>>
): { visibleBrands: Set<string>; visibleSubCats: Set<string> } {
    const visibleBrands = new Set<string>();
    const visibleSubCats = new Set<string>();

    // Build a set of product IDs that survived the filter
    const filteredIds = new Set(filteredProducts.map(p => p.id));

    for (const brand of Object.keys(groupedProducts)) {
        for (const subCat of Object.keys(groupedProducts[brand])) {
            const hasMatch = groupedProducts[brand][subCat].some(p => filteredIds.has(p.id));
            if (hasMatch) {
                visibleBrands.add(brand);
                visibleSubCats.add(`${brand}::${subCat}`);
            }
        }
    }

    return { visibleBrands, visibleSubCats };
}
