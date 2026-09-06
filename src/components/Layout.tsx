import { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../features/auth/hooks/useAuth';
import { LoginModal } from '../features/auth/components/LoginModal';
import { ConfirmModal } from './ui/ConfirmModal';
import { Skeleton } from './ui/Skeleton';
import { promoterTabs, managerTabs } from './navigation/tabs';

export default function Layout() {
    const location = useLocation();
    const navigate = useNavigate();
    const { profile, isLoggedIn, loading, loginWithPassword, logout } = useAuth();

    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    const isManager = profile?.role === 'manager';
    const tabs = isManager ? managerTabs : promoterTabs;

    useEffect(() => {
        if (loading) return;
        if (isLoggedIn && isManager && !location.pathname.startsWith('/manager')) {
            navigate('/manager/sales', { replace: true });
        }
        if (isLoggedIn && !isManager && location.pathname.startsWith('/manager')) {
            navigate('/', { replace: true });
        }
    }, [isLoggedIn, isManager, loading, location.pathname, navigate]);

    const getActiveTab = () => {
        if (isManager) {
            if (location.pathname.startsWith('/manager/sales')) return '/manager/sales';
            if (location.pathname.startsWith('/manager/export')) return '/manager/export';
            if (location.pathname.startsWith('/manager/dashboard')) return '/manager/dashboard';
            if (location.pathname.startsWith('/manager/admin')) return '/manager/admin';
            return '/manager/sales';
        }
        if (location.pathname.startsWith('/export')) return '/export';
        return '/';
    };

    const activeTab = getActiveTab();

    const handleLogoutConfirm = async () => {
        setShowLogoutConfirm(false);
        await logout();
        navigate('/', { replace: true });
    };

    const shouldShowLoginModal = !isLoggedIn && !loading;

    return (
        <div className="min-h-screen" style={{ backgroundColor: '#fafaf9' }}>
            <header className="sticky top-0 z-10 backdrop-blur-xl bg-white/80 border-b border-stone-200/60">
                <div className="px-5 py-3">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-lg font-semibold text-stone-900 tracking-tight">Perfume Tracker</h1>
                            <p className="text-xs text-stone-400 mt-0.5 font-medium">
                                {isManager ? 'Manager Dashboard' : 'Shift Sales'}
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            {profile && (
                                <div className="text-right">
                                    <p className="text-xs font-semibold text-stone-700">{profile.display_name}</p>
                                    <p className="text-[10px] text-stone-400 capitalize">{profile.role}</p>
                                </div>
                            )}
                            <div
                                className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-semibold"
                                style={{ background: 'linear-gradient(135deg, #5b8c7a, #7eb8a0)' }}
                            >
                                {profile ? profile.display_name.charAt(0).toUpperCase() : '?'}
                            </div>
                            {isLoggedIn && (
                                <button
                                    onClick={() => setShowLogoutConfirm(true)}
                                    className="text-xs text-stone-400 hover:text-stone-600"
                                >
                                    Logout
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            <main className="pb-20 px-4 pt-4 max-w-6xl mx-auto">
                {!loading && isLoggedIn ? (
                    <Outlet />
                ) : !loading && !isLoggedIn ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="text-stone-400 text-sm">Please log in to continue</div>
                    </div>
                ) : (
                    <Skeleton rows={4} height="h-12" />
                )}
            </main>

            <nav className="fixed bottom-0 left-0 right-0 z-10 bg-white/90 backdrop-blur-xl border-t border-stone-200/60">
                <div className="max-w-6xl mx-auto px-2">
                    <div className="flex items-center justify-around py-1.5">
                        {tabs.map(tab => {
                            const isActive = activeTab === tab.path;
                            return (
                                <button
                                    key={tab.path}
                                    onClick={() => navigate(tab.path)}
                                    className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-200 ${
                                        isActive ? 'text-stone-900' : 'text-stone-400 hover:text-stone-600'
                                    }`}
                                >
                                    {tab.icon}
                                    <span className="text-[10px] font-medium">{tab.label}</span>
                                    {isActive && (
                                        <div
                                            className="w-1 h-1 rounded-full mt-0.5"
                                            style={{ backgroundColor: '#5b8c7a' }}
                                        ></div>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </nav>

            <LoginModal isOpen={shouldShowLoginModal} onClose={() => {}} onLogin={loginWithPassword} />

            <ConfirmModal
                isOpen={showLogoutConfirm}
                onCancel={() => setShowLogoutConfirm(false)}
                onConfirm={handleLogoutConfirm}
                title="Logout"
                message="Are you sure you want to log out?"
                confirmLabel="Logout"
                danger
            />
        </div>
    );
}
