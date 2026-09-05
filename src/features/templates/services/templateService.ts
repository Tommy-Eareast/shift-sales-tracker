import { getSupabase } from '../../../lib/supabaseClient';
import type { ShiftTemplate } from '../../../types';
import type { SupabaseTemplateRow } from '../../../types/supabase';
import { getProfileForTemplate } from '../../export/profiles/templateMapping';

const supabase = getSupabase();

export const templateService = {
    async getAll(): Promise<ShiftTemplate[]> {
        const { data, error } = await supabase.from('templates').select('*').order('sort_order');
        if (error) throw new Error(error.message);

        return (data || []).map((t: SupabaseTemplateRow) => ({
            templateId: t.id,
            templateName: t.name,
            brandList: t.brand_list || [],
            sortOrder: t.sort_order,
            exportProfile: t.export_profile || 'default',
            createdAt: t.created_at,
        }));
    },

    async getById(id: string): Promise<ShiftTemplate | null> {
        const { data, error } = await supabase.from('templates').select('*').eq('id', id).maybeSingle();
        if (error) throw new Error(error.message);
        if (!data) return null;

        const t = data as SupabaseTemplateRow;
        return {
            templateId: t.id,
            templateName: t.name,
            brandList: t.brand_list || [],
            sortOrder: t.sort_order,
            exportProfile: t.export_profile || 'default',
            createdAt: t.created_at,
        };
    },

    async add(data: { templateName: string; brandList: string[] }): Promise<string> {
        // Auto-assign export profile
        const exportProfile = getProfileForTemplate(data.templateName);

        const { data: result, error } = await supabase
            .from('templates')
            .insert({
                name: data.templateName,
                brand_list: data.brandList,
                sort_order: 0,
                export_profile: exportProfile,
            })
            .select('id')
            .single();
        if (error) throw new Error(error.message);
        return result.id;
    },

    async update(id: string, data: { templateName: string; brandList: string[] }): Promise<void> {
        // Auto-assign export profile
        const exportProfile = getProfileForTemplate(data.templateName);

        const { error } = await supabase
            .from('templates')
            .update({ name: data.templateName, brand_list: data.brandList, export_profile: exportProfile })
            .eq('id', id);
        if (error) throw new Error(error.message);
    },

    async reorder(templateIds: string[]): Promise<void> {
        const items = templateIds.map((id, index) => ({ id, sort_order: index }));

        const { error } = await supabase.rpc('update_template_sort_orders', { items });

        if (error) {
            console.warn('RPC failed, falling back to individual updates:', error.message);
            for (let i = 0; i < templateIds.length; i++) {
                await supabase.from('templates').update({ sort_order: i }).eq('id', templateIds[i]);
            }
        }
    },

    async delete(id: string): Promise<void> {
        const { error } = await supabase.from('templates').delete().eq('id', id);
        if (error) throw new Error(error.message);
    },
};
