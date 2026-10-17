import { useState, useEffect } from 'react';

/**
 * Tracks the browser's online/offline status.
 * Listens to online/offline events and reads initial navigator.onLine.
 *
 * Note: navigator.onLine isn't 100% reliable (can report true when network is down)
 * but catches the common case.
 */
export function useOnlineStatus(): boolean {
    const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    return isOnline;
}
