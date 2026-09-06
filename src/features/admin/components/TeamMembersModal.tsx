import { useState } from 'react';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { ConfirmModal } from '../../../components/ui/ConfirmModal';
import type { UserProfile } from '../../auth/services/authService';

type Props = {
    isOpen: boolean;
    onClose: () => void;
    members: UserProfile[];
    onCreate: (email: string, displayName: string, role: 'promoter' | 'manager', tempPassword: string) => Promise<void>;
    onRemove: (userId: string) => Promise<void>;
};

const inputClass =
    'w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-2.5 text-sm text-stone-900 placeholder:text-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-300 transition-all';

export function TeamMembersModal({ isOpen, onClose, members, onCreate, onRemove }: Props) {
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({
        email: '',
        displayName: '',
        role: 'promoter' as 'promoter' | 'manager',
        tempPassword: '',
    });
    const [formError, setFormError] = useState('');
    const [deleteTarget, setDeleteTarget] = useState<UserProfile | null>(null);
    const [saving, setSaving] = useState(false);

    const handleCreate = async () => {
        if (!form.email || !form.displayName || !form.tempPassword) {
            setFormError('Please fill in all fields');
            return;
        }
        setSaving(true);
        setFormError('');
        try {
            await onCreate(form.email, form.displayName, form.role, form.tempPassword);
            setShowForm(false);
            setForm({ email: '', displayName: '', role: 'promoter', tempPassword: '' });
        } catch (err) {
            setFormError(err instanceof Error ? err.message : 'Failed to create member');
        } finally {
            setSaving(false);
        }
    };

    const handleRemoveConfirm = async () => {
        if (!deleteTarget) return;
        await onRemove(deleteTarget.id);
        setDeleteTarget(null);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Team Members" persistent>
            <div className="space-y-4">
                {/* Member list */}
                <div className="space-y-2">
                    {members.length === 0 ? (
                        <p className="text-sm text-stone-400 text-center py-4">No team members yet</p>
                    ) : (
                        members.map(member => (
                            <div
                                key={member.id}
                                className="flex items-center justify-between p-3 bg-stone-50 rounded-xl"
                            >
                                <div>
                                    <p className="font-medium text-stone-900 text-sm">{member.display_name}</p>
                                    <p className="text-xs text-stone-400">{member.email}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span
                                        className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${member.role === 'manager' ? 'bg-violet-50 text-violet-700' : 'bg-emerald-50 text-emerald-700'}`}
                                    >
                                        {member.role}
                                    </span>
                                    <button
                                        onClick={() => setDeleteTarget(member)}
                                        className="p-1.5 rounded-lg text-stone-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={1.5}
                                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                            />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Bottom buttons */}
                {!showForm ? (
                    <div className="flex gap-2">
                        <Button variant="secondary" size="lg" fullWidth onClick={onClose}>
                            Close
                        </Button>
                        <Button variant="primary" size="lg" fullWidth onClick={() => setShowForm(true)}>
                            + Add Member
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-3">
                        <div>
                            <label className="block text-xs font-medium text-stone-500 mb-1 uppercase tracking-wider">
                                Display Name
                            </label>
                            <input
                                type="text"
                                value={form.displayName}
                                onChange={e => setForm({ ...form, displayName: e.target.value })}
                                placeholder="e.g., Tommy"
                                className={inputClass}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-stone-500 mb-1 uppercase tracking-wider">
                                Email
                            </label>
                            <input
                                type="email"
                                value={form.email}
                                onChange={e => setForm({ ...form, email: e.target.value })}
                                placeholder="name@company.com"
                                className={inputClass}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-stone-500 mb-1 uppercase tracking-wider">
                                Temporary Password
                            </label>
                            <input
                                type="text"
                                value={form.tempPassword}
                                onChange={e => setForm({ ...form, tempPassword: e.target.value })}
                                placeholder="e.g., ChangeMe123"
                                className={inputClass}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-stone-500 mb-1 uppercase tracking-wider">
                                Role
                            </label>
                            <select
                                value={form.role}
                                onChange={e => setForm({ ...form, role: e.target.value as 'promoter' | 'manager' })}
                                className={inputClass}
                            >
                                <option value="promoter">Promoter</option>
                                <option value="manager">Manager</option>
                            </select>
                        </div>
                        {formError && <p className="text-sm text-red-600">{formError}</p>}
                        <div className="flex gap-2">
                            <Button
                                variant="secondary"
                                size="md"
                                fullWidth
                                onClick={() => {
                                    setShowForm(false);
                                    setFormError('');
                                }}
                            >
                                Cancel
                            </Button>
                            <Button variant="primary" size="md" fullWidth onClick={handleCreate} disabled={saving}>
                                {saving ? 'Creating...' : 'Create'}
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            <ConfirmModal
                isOpen={deleteTarget !== null}
                onCancel={() => setDeleteTarget(null)}
                onConfirm={handleRemoveConfirm}
                title="Remove Member"
                message={`Remove "${deleteTarget?.display_name}" from the team?`}
                confirmLabel="Remove"
                danger
            />
        </Modal>
    );
}
