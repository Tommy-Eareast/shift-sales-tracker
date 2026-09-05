import { getSupabase } from "../../../lib/supabaseClient";
import type { User } from "@supabase/supabase-js";

const supabase = getSupabase();

export type UserProfile = {
  id: string;
  email: string;
  display_name: string;
  role: "promoter" | "manager";
};

export const authService = {
  async loginWithPassword(email: string, password: string): Promise<void> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    // Log full error details
    if (error) {
      console.error("Login error details:", {
        status: error.status,
        message: error.message,
        name: error.name,
        stack: error.stack,
      });
      throw new Error(error.message);
    }

    console.log("Login successful:", data.user?.email);
  },

  async getCurrentUser(): Promise<User | null> {
    const { data } = await supabase.auth.getUser();
    return data.user || null;
  },

  async getProfile(userId: string): Promise<UserProfile | null> {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      console.error("Profile fetch error:", error.message);
      return null;
    }
    return data as UserProfile | null;
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
