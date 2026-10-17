/**
 * Simple localStorage-based cache with stale-while-revalidate support.
 * Survives page refresh; used to show last known data instantly.
 */

type CacheEntry<T> = { data: T; updatedAt: string };

const DEFAULT_STALE_MS = 1000 * 60 * 60 * 24; // 24 hours

/**
 * Read cached data. Returns null if no cache exists or if JSON parse fails.
 * `isStale` is true if the cache is older than `staleMs`.
 */
export function readCache<T>(key: string, staleMs: number = DEFAULT_STALE_MS): { data: T; isStale: boolean } | null {
    try {
        const raw = localStorage.getItem(`cache:${key}`);
        if (!raw) return null;
        const entry = JSON.parse(raw) as CacheEntry<T>;
        const age = Date.now() - new Date(entry.updatedAt).getTime();
        return { data: entry.data, isStale: age > staleMs };
    } catch {
        return null;
    }
}

/**
 * Write data to cache.
 */
export function writeCache<T>(key: string, data: T): void {
    try {
        const entry: CacheEntry<T> = { data, updatedAt: new Date().toISOString() };
        localStorage.setItem(`cache:${key}`, JSON.stringify(entry));
    } catch (err) {
        // Quota exceeded or serialization error — fail silently
        console.warn('Cache write failed:', err);
    }
}

/**
 * Clear a specific cache entry.
 */
export function clearCache(key: string): void {
    try {
        localStorage.removeItem(`cache:${key}`);
    } catch {
        // Ignore
    }
}
