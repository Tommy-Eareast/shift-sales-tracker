import { getSupabase } from '../../../lib/supabaseClient';
import type { Product } from '../../../types';
import type { SupabaseProductRow } from '../../../types/supabase';

const supabase = getSupabase();

export const productService = {
    async getAll(): Promise<Product[]> {
        const { data, error } = await supabase.from('products').select('*').order('sort_order');
        if (error) throw new Error(error.message);

        return (data || []).map((p: SupabaseProductRow) => ({
            id: p.id,
            brandMain: p.brand_main,
            subCategory: p.sub_category,
            fullName: p.full_name,
            price: p.price,
            sortOrder: p.sort_order,
            createdAt: p.created_at,
            updatedAt: p.updated_at,
        }));
    },

    getDistinctValues(products: Product[]): { brands: string[]; subCategories: string[] } {
        const brandSet = new Set<string>();
        const subCatSet = new Set<string>();
        for (const p of products) {
            brandSet.add(p.brandMain);
            subCatSet.add(p.subCategory);
        }
        return { brands: Array.from(brandSet).sort(), subCategories: Array.from(subCatSet).sort() };
    },

    getSubCategorySuggestions(products: Product[], brandMain: string): string[] {
        if (!brandMain) return [];
        const brandProducts = products.filter(p => p.brandMain === brandMain);
        return [...new Set(brandProducts.map(p => p.subCategory))].sort();
    },

    async add(data: { brandMain: string; subCategory: string; fullName: string; price: number }): Promise<string> {
        const { data: result, error } = await supabase
            .from('products')
            .insert({
                brand_main: data.brandMain,
                sub_category: data.subCategory,
                full_name: data.fullName,
                price: data.price,
                sort_order: 0,
            })
            .select('id')
            .single();
        if (error) throw new Error(error.message);
        return result.id;
    },

    async update(id: string, data: Partial<Product>): Promise<void> {
        const updates: Record<string, string | number> = {};
        if (data.brandMain !== undefined) updates.brand_main = data.brandMain;
        if (data.subCategory !== undefined) updates.sub_category = data.subCategory;
        if (data.fullName !== undefined) updates.full_name = data.fullName;
        if (data.price !== undefined) updates.price = data.price;
        if (data.sortOrder !== undefined) updates.sort_order = data.sortOrder;
        updates.updated_at = new Date().toISOString();

        const { error } = await supabase.from('products').update(updates).eq('id', id);
        if (error) throw new Error(error.message);
    },

    async delete(id: string): Promise<void> {
        const { error } = await supabase.from('products').delete().eq('id', id);
        if (error) throw new Error(error.message);
    },

    async reorder(productIds: string[]): Promise<void> {
        // Use RPC for batch update (1 request instead of N)
        const items = productIds.map((id, index) => ({ id, sort_order: index }));

        const { error } = await supabase.rpc('update_product_sort_orders', { items });

        if (error) {
            console.warn('RPC failed, falling back to individual updates:', error.message);
            // Fallback: individual updates
            for (let i = 0; i < productIds.length; i++) {
                await supabase
                    .from('products')
                    .update({ sort_order: i, updated_at: new Date().toISOString() })
                    .eq('id', productIds[i]);
            }
        }
    },
};
