import { getSupabase } from '../../../lib/supabaseClient';
import type { User } from '@supabase/supabase-js';

const supabase = getSupabase();

export type UserProfile = { id: string; email: string; display_name: string; role: 'promoter' | 'manager' };

export const authService = {
    async loginWithPassword(email: string, password: string): Promise<void> {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
            console.error('Login error:', error.message);
            throw new Error(error.message);
        }
    },

    async getCurrentUser(): Promise<User | null> {
        const { data } = await supabase.auth.getUser();
        return data.user || null;
    },

    async getProfile(userId: string): Promise<UserProfile | null> {
        const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();

        if (error) {
            console.error('Profile fetch error:', error.message);
            return null;
        }
        return data as UserProfile | null;
    },

    async updateDisplayName(userId: string, newName: string): Promise<void> {
        const trimmed = newName.trim();
        if (!trimmed) throw new Error('Display name cannot be empty');
        if (trimmed.length > 50) throw new Error('Display name is too long (max 50 characters)');

        const { error } = await supabase.from('profiles').update({ display_name: trimmed }).eq('id', userId);

        if (error) throw new Error(error.message);
    },

    async changePassword(currentPassword: string, newPassword: string): Promise<void> {
        if (!currentPassword) throw new Error('Current password is required');
        if (!newPassword) throw new Error('New password is required');
        if (newPassword.length < 8) throw new Error('New password must be at least 8 characters');
        if (currentPassword === newPassword) throw new Error('New password must be different from current password');

        // Verify current password by attempting to sign in with it
        const { data: userData } = await supabase.auth.getUser();
        const email = userData.user?.email;
        if (!email) throw new Error('Not logged in');

        const { error: verifyError } = await supabase.auth.signInWithPassword({ email, password: currentPassword });
        if (verifyError) throw new Error('Current password is incorrect');

        // Update password
        const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
        if (updateError) throw new Error(updateError.message);
    },

    async logout(): Promise<void> {
        await supabase.auth.signOut();
    },

    onAuthStateChange(callback: (user: User | null) => void): () => void {
        const { data } = supabase.auth.onAuthStateChange((_event, session) => {
            callback(session?.user || null);
        });
        return data.subscription.unsubscribe;
    },
};
