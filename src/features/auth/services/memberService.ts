import { getSupabase } from '../../../lib/supabaseClient';
import type { UserProfile } from './authService';

const supabase = getSupabase();

export const memberService = {
    async getAllMembers(): Promise<UserProfile[]> {
        const { data, error } = await supabase.from('profiles').select('*').order('sort_order');
        if (error) throw new Error(error.message);
        return data as UserProfile[];
    },

    async createMember(
        email: string,
        displayName: string,
        role: 'promoter' | 'manager',
        temporaryPassword: string
    ): Promise<void> {
        const { error } = await supabase.functions.invoke('create-member', {
            body: { email, password: temporaryPassword, displayName, role },
        });
        if (error) throw new Error(error.message);
    },

    async removeMember(userId: string): Promise<void> {
        const { error } = await supabase.functions.invoke('remove-member', { body: { userId } });
        if (error) throw new Error(error.message);
    },

    async reorderMembers(memberIds: string[]): Promise<void> {
        const items = memberIds.map((id, index) => ({ id, sort_order: index }));
        const { error } = await supabase.rpc('update_profile_sort_orders', { items });
        if (error) {
            console.warn('RPC failed:', error.message);
            for (let i = 0; i < memberIds.length; i++) {
                await supabase.from('profiles').update({ sort_order: i }).eq('id', memberIds[i]);
            }
        }
    },
};
