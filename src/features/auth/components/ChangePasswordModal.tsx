import { useState, useEffect } from 'react';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { inputClass } from '../../../utils/styles';

type Props = {
    isOpen: boolean;
    onClose: () => void;
    onChangePassword: (currentPassword: string, newPassword: string) => Promise<void>;
};

export function ChangePasswordModal({ isOpen, onClose, onChangePassword }: Props) {
    const [current, setCurrent] = useState('');
    const [next, setNext] = useState('');
    const [confirm, setConfirm] = useState('');
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);

    // Reset state when modal opens
    useEffect(() => {
        if (!isOpen) return;
        const timer = setTimeout(() => {
            setCurrent('');
            setNext('');
            setConfirm('');
            setError('');
            setSaving(false);
        }, 0);
        return () => clearTimeout(timer);
    }, [isOpen]);

    const handleSave = async () => {
        if (!current || !next || !confirm) {
            setError('Please fill in all fields');
            return;
        }
        if (next !== confirm) {
            setError('New passwords do not match');
            return;
        }
        if (next.length < 8) {
            setError('New password must be at least 8 characters');
            return;
        }

        setSaving(true);
        setError('');
        try {
            await onChangePassword(current, next);
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to change password');
        } finally {
            setSaving(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !saving) {
            e.preventDefault();
            handleSave();
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Change Password" persistent>
            <div className="space-y-4">
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                        <p className="text-sm text-red-600">{error}</p>
                    </div>
                )}

                <div>
                    <label className="block text-xs font-medium text-stone-500 mb-1.5 uppercase tracking-wider">
                        Current Password
                    </label>
                    <input
                        type="password"
                        value={current}
                        onChange={e => {
                            setCurrent(e.target.value);
                            setError('');
                        }}
                        onKeyDown={handleKeyDown}
                        placeholder="••••••••"
                        className={inputClass}
                        autoFocus
                    />
                </div>

                <div>
                    <label className="block text-xs font-medium text-stone-500 mb-1.5 uppercase tracking-wider">
                        New Password
                    </label>
                    <input
                        type="password"
                        value={next}
                        onChange={e => {
                            setNext(e.target.value);
                            setError('');
                        }}
                        onKeyDown={handleKeyDown}
                        placeholder="At least 8 characters"
                        className={inputClass}
                    />
                </div>

                <div>
                    <label className="block text-xs font-medium text-stone-500 mb-1.5 uppercase tracking-wider">
                        Confirm New Password
                    </label>
                    <input
                        type="password"
                        value={confirm}
                        onChange={e => {
                            setConfirm(e.target.value);
                            setError('');
                        }}
                        onKeyDown={handleKeyDown}
                        placeholder="••••••••"
                        className={inputClass}
                    />
                </div>

                <div className="flex gap-3 pt-1">
                    <Button variant="secondary" size="lg" fullWidth onClick={onClose} disabled={saving}>
                        Cancel
                    </Button>
                    <Button variant="primary" size="lg" fullWidth onClick={handleSave} disabled={saving}>
                        {saving ? 'Updating...' : 'Update Password'}
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
