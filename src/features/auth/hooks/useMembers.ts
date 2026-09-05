import { useState, useEffect, useCallback } from 'react';
import { memberService } from '../services/memberService';
import type { UserProfile } from '../services/authService';

export function useMembers() {
    const [members, setMembers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await memberService.getAllMembers();
            setMembers(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load members');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            load();
        }, 0);
        return () => clearTimeout(timer);
    }, [load]);

    const add = useCallback(
        async (email: string, displayName: string, role: 'promoter' | 'manager', tempPassword: string) => {
            await memberService.createMember(email, displayName, role, tempPassword);
            await load();
        },
        [load]
    );

    const remove = useCallback(
        async (userId: string) => {
            // Optimistic update
            setMembers(prev => prev.filter(m => m.id !== userId));
            try {
                await memberService.removeMember(userId);
            } catch (err) {
                console.error(err);
                await load();
            }
        },
        [load]
    );

    const reorder = useCallback(
        async (memberIds: string[]) => {
            // Optimistic update
            setMembers(prev => {
                const idMap = new Map(prev.map(m => [m.id, m]));
                return memberIds.map(id => idMap.get(id)).filter(Boolean) as UserProfile[];
            });
            try {
                await memberService.reorderMembers(memberIds);
            } catch (err) {
                console.error(err);
                await load();
            }
        },
        [load]
    );

    return { members, loading, error, add, remove, reorder, refresh: load };
}
