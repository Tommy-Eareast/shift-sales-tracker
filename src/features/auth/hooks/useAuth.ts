import { useState, useEffect, useCallback } from "react";
import type { User } from "@supabase/supabase-js";
import { authService, type UserProfile } from "../services/authService";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadSession = async () => {
      setLoading(true);
      try {
        const currentUser = await authService.getCurrentUser();
        if (cancelled) return;
        setUser(currentUser);
        if (currentUser) {
          const prof = await authService.getProfile(currentUser.id);
          if (cancelled) return;
          setProfile(prof);
        }
      } catch (err) {
        if (!cancelled)
          setError(
            err instanceof Error ? err.message : "Failed to load session",
          );
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadSession();

    const unsubscribe = authService.onAuthStateChange(async (newUser) => {
      setUser(newUser);
      if (newUser) {
        const prof = await authService.getProfile(newUser.id);
        setProfile(prof);
      } else {
        setProfile(null);
      }
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  const loginWithPassword = useCallback(
    async (email: string, password: string) => {
      setError(null);
      try {
        await authService.loginWithPassword(email, password);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Login failed");
        throw err;
      }
    },
    [],
  );

  const logout = useCallback(async () => {
    await authService.logout();
    setUser(null);
    setProfile(null);
  }, []);

  return {
    user,
    profile,
    loading,
    error,
    isLoggedIn: !!user,
    role: profile?.role || null,
    loginWithPassword,
    logout,
  };
}
