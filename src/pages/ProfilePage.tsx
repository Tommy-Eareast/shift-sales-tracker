import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../features/auth/hooks/useAuth';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Skeleton } from '../components/ui/Skeleton';
import { ErrorState } from '../components/ui/ErrorState';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { AlertModal } from '../components/ui/AlertModal';
import { EditNameModal } from '../features/auth/components/EditNameModal';
import { ChangePasswordModal } from '../features/auth/components/ChangePasswordModal';

export default function ProfilePage() {
    const navigate = useNavigate();
    const { profile, loading, updateDisplayName, changePassword, logout } = useAuth();

    const [showNameModal, setShowNameModal] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const [alertInfo, setAlertInfo] = useState<{ title: string; message: string } | null>(null);

    if (loading) {
        return (
            <div className="space-y-4">
                <Skeleton rows={2} height="h-24" />
                <Skeleton rows={3} height="h-16" />
            </div>
        );
    }

    if (!profile) {
        return <ErrorState message="Not logged in" />;
    }

    const initials = profile.display_name
        .split(' ')
        .map(w => w.charAt(0).toUpperCase())
        .slice(0, 2)
        .join('');

    const handleUpdateName = async (newName: string) => {
        await updateDisplayName(newName);
        setAlertInfo({ title: 'Updated', message: 'Your display name has been updated.' });
    };

    const handleChangePassword = async (current: string, next: string) => {
        await changePassword(current, next);
        setAlertInfo({ title: 'Password Updated', message: 'Your password has been changed successfully.' });
    };

    const handleLogout = async () => {
        setShowLogoutConfirm(false);
        await logout();
        navigate('/', { replace: true });
    };

    return (
        <div className="space-y-4">
            {/* Two-column layout on desktop, stacked on mobile */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Left column: Profile header + Account section (span 2) */}
                <div className="lg:col-span-2 space-y-4">
                    {/* Profile Header Card */}
                    <Card className="p-6">
                        <div className="flex items-center gap-4">
                            <div
                                className="w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-semibold flex-shrink-0"
                                style={{ background: 'linear-gradient(135deg, #5b8c7a, #7eb8a0)' }}
                            >
                                {initials || '?'}
                            </div>
                            <div className="min-w-0 flex-1">
                                <h2 className="text-lg font-semibold text-stone-900 tracking-tight truncate">
                                    {profile.display_name}
                                </h2>
                                <p className="text-sm text-stone-500 truncate">{profile.email}</p>
                                <span
                                    className={`inline-block mt-1.5 text-[10px] font-medium px-2 py-0.5 rounded-full ${
                                        profile.role === 'manager'
                                            ? 'bg-violet-50 text-violet-700'
                                            : 'bg-emerald-50 text-emerald-700'
                                    }`}
                                >
                                    {profile.role}
                                </span>
                            </div>
                        </div>
                    </Card>

                    {/* Account Section */}
                    <Card noPadding>
                        <div className="px-4 pt-4 pb-2">
                            <h3 className="font-semibold text-stone-900 tracking-tight text-sm">Account</h3>
                        </div>
                        <div className="divide-y divide-stone-100">
                            {/* Display Name Row */}
                            <button
                                onClick={() => setShowNameModal(true)}
                                className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-stone-50 transition-colors text-left"
                            >
                                <div className="min-w-0">
                                    <p className="text-xs font-medium text-stone-500 uppercase tracking-wider">
                                        Display Name
                                    </p>
                                    <p className="text-sm text-stone-900 mt-0.5 truncate">{profile.display_name}</p>
                                </div>
                                <svg
                                    className="w-4 h-4 text-stone-300 flex-shrink-0 ml-2"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={1.5}
                                        d="M9 5l7 7-7 7"
                                    />
                                </svg>
                            </button>

                            {/* Password Row */}
                            <button
                                onClick={() => setShowPasswordModal(true)}
                                className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-stone-50 transition-colors text-left"
                            >
                                <div className="min-w-0">
                                    <p className="text-xs font-medium text-stone-500 uppercase tracking-wider">
                                        Password
                                    </p>
                                    <p className="text-sm text-stone-900 mt-0.5">••••••••</p>
                                </div>
                                <svg
                                    className="w-4 h-4 text-stone-300 flex-shrink-0 ml-2"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={1.5}
                                        d="M9 5l7 7-7 7"
                                    />
                                </svg>
                            </button>

                            {/* Email Row (read-only) */}
                            <div className="w-full flex items-center justify-between px-4 py-3.5">
                                <div className="min-w-0">
                                    <p className="text-xs font-medium text-stone-500 uppercase tracking-wider">Email</p>
                                    <p className="text-sm text-stone-900 mt-0.5 truncate">{profile.email}</p>
                                </div>
                                <span className="text-[10px] text-stone-400 ml-2 flex-shrink-0">Locked</span>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Right column: Danger zone (span 1) */}
                <div className="space-y-4">
                    <Card>
                        <p className="text-xs font-medium text-stone-500 uppercase tracking-wider mb-3">Session</p>
                        <Button variant="danger" size="lg" fullWidth onClick={() => setShowLogoutConfirm(true)}>
                            Log Out
                        </Button>
                    </Card>
                </div>
            </div>

            {/* Modals */}
            <EditNameModal
                isOpen={showNameModal}
                onClose={() => setShowNameModal(false)}
                currentName={profile.display_name}
                onSave={handleUpdateName}
            />

            <ChangePasswordModal
                isOpen={showPasswordModal}
                onClose={() => setShowPasswordModal(false)}
                onChangePassword={handleChangePassword}
            />

            <ConfirmModal
                isOpen={showLogoutConfirm}
                onCancel={() => setShowLogoutConfirm(false)}
                onConfirm={handleLogout}
                title="Logout"
                message="Are you sure you want to log out?"
                confirmLabel="Logout"
                danger
            />

            <AlertModal
                isOpen={alertInfo !== null}
                title={alertInfo?.title || ''}
                message={alertInfo?.message || ''}
                onClose={() => setAlertInfo(null)}
            />
        </div>
    );
}
