import { getSupabase } from '../../../lib/supabaseClient';

const supabase = getSupabase();

export const orderingService = {
    async getBrandOrder(): Promise<string[]> {
        const { data, error } = await supabase
            .from('ordering_config')
            .select('ordered_items')
            .eq('config_type', 'brand_order')
            .maybeSingle();
        if (error) return [];
        return (data as { ordered_items: string[] } | null)?.ordered_items || [];
    },

    async saveBrandOrder(brands: string[]): Promise<void> {
        const { data: existing } = await supabase
            .from('ordering_config')
            .select('id')
            .eq('config_type', 'brand_order')
            .maybeSingle();

        if (existing) {
            await supabase
                .from('ordering_config')
                .update({ ordered_items: brands, updated_at: new Date().toISOString() })
                .eq('id', (existing as { id: string }).id);
        } else {
            await supabase
                .from('ordering_config')
                .insert({ config_type: 'brand_order', brand: '', ordered_items: brands });
        }
    },

    async getSubCategoryOrder(brand: string): Promise<string[]> {
        const { data, error } = await supabase
            .from('ordering_config')
            .select('ordered_items')
            .eq('config_type', 'sub_category_order')
            .eq('brand', brand)
            .maybeSingle();
        if (error) return [];
        return (data as { ordered_items: string[] } | null)?.ordered_items || [];
    },

    async saveSubCategoryOrder(brand: string, subCategories: string[]): Promise<void> {
        const { data: existing } = await supabase
            .from('ordering_config')
            .select('id')
            .eq('config_type', 'sub_category_order')
            .eq('brand', brand)
            .maybeSingle();

        if (existing) {
            await supabase
                .from('ordering_config')
                .update({ ordered_items: subCategories, updated_at: new Date().toISOString() })
                .eq('id', (existing as { id: string }).id);
        } else {
            await supabase
                .from('ordering_config')
                .insert({ config_type: 'sub_category_order', brand, ordered_items: subCategories });
        }
    },
};
