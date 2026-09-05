import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase credentials not configured.');
}

let client: SupabaseClient | null = null;

/**
 * Get the singleton Supabase client (anon key).
 * Only ONE client instance is ever created.
 */
export function getSupabase(): SupabaseClient {
    if (!client) {
        client = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseAnonKey || 'placeholder-key');
    }
    return client;
}

export const supabase = getSupabase();
