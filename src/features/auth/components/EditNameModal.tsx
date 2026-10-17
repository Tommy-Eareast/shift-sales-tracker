import { useState, useEffect } from 'react';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { inputClass } from '../../../utils/styles';

type Props = { isOpen: boolean; onClose: () => void; currentName: string; onSave: (newName: string) => Promise<void> };

export function EditNameModal({ isOpen, onClose, currentName, onSave }: Props) {
    const [name, setName] = useState(currentName);
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);

    // Reset state when modal opens
    useEffect(() => {
        if (!isOpen) return;
        const timer = setTimeout(() => {
            setName(currentName);
            setError('');
            setSaving(false);
        }, 0);
        return () => clearTimeout(timer);
    }, [isOpen, currentName]);

    const handleSave = async () => {
        const trimmed = name.trim();
        if (!trimmed) {
            setError('Display name cannot be empty');
            return;
        }
        if (trimmed === currentName) {
            onClose();
            return;
        }

        setSaving(true);
        setError('');
        try {
            await onSave(trimmed);
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update name');
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
        <Modal isOpen={isOpen} onClose={onClose} title="Edit Display Name" persistent>
            <div className="space-y-4">
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                        <p className="text-sm text-red-600">{error}</p>
                    </div>
                )}

                <div>
                    <label className="block text-xs font-medium text-stone-500 mb-1.5 uppercase tracking-wider">
                        Display Name
                    </label>
                    <input
                        type="text"
                        value={name}
                        onChange={e => {
                            setName(e.target.value);
                            setError('');
                        }}
                        onKeyDown={handleKeyDown}
                        className={inputClass}
                        maxLength={50}
                        autoFocus
                    />
                    <p className="text-xs text-stone-400 mt-1">{name.length}/50 characters</p>
                </div>

                <div className="flex gap-3 pt-1">
                    <Button variant="secondary" size="lg" fullWidth onClick={onClose} disabled={saving}>
                        Cancel
                    </Button>
                    <Button variant="primary" size="lg" fullWidth onClick={handleSave} disabled={saving}>
                        {saving ? 'Saving...' : 'Save'}
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
