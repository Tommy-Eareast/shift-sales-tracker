import { useState, useEffect } from 'react';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { inputClass } from '../../../utils/styles';

type Props = {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (note: string) => Promise<void>;
    shiftDisplayName: string;
    totalCount: number;
    totalRevenue: number;
    isOnline: boolean;
};

export function SubmitShiftModal({
    isOpen,
    onClose,
    onSubmit,
    shiftDisplayName,
    totalCount,
    totalRevenue,
    isOnline,
}: Props) {
    const [note, setNote] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!isOpen) return;
        const timer = setTimeout(() => {
            setNote('');
            setError('');
            setSubmitting(false);
        }, 0);
        return () => clearTimeout(timer);
    }, [isOpen]);

    const handleSubmit = async () => {
        if (!isOnline) {
            setError("You're offline. Please connect to the internet to submit.");
            return;
        }
        if (submitting) return;

        setSubmitting(true);
        setError('');
        try {
            await onSubmit(note.trim());
            setNote('');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to submit. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleNoteKeyDown = (e: React.KeyboardEvent) => {
        // Enter submits, Shift+Enter creates newline
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Submit Shift" persistent>
            <div className="space-y-4">
                <p className="text-sm text-stone-600">{shiftDisplayName}</p>

                <div className="rounded-xl p-3" style={{ backgroundColor: '#ecf5f1' }}>
                    <p className="text-xs font-medium uppercase tracking-wider" style={{ color: '#5b8c7a' }}>
                        Summary
                    </p>
                    <p className="text-sm text-stone-900 mt-1">
                        {totalCount} units · ${totalRevenue}
                    </p>
                </div>

                {!isOnline && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                        <p className="text-sm text-red-600">⚠️ You're currently offline. Reconnect to submit.</p>
                    </div>
                )}

                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                    <p className="text-sm text-amber-700">⚠️ After submitting, sales data cannot be changed.</p>
                </div>

                <div>
                    <label className="block text-xs font-medium text-stone-500 mb-1.5 uppercase tracking-wider">
                        Note (optional)
                    </label>
                    <textarea
                        value={note}
                        onChange={e => setNote(e.target.value)}
                        onKeyDown={handleNoteKeyDown}
                        placeholder="Anything the manager should know..."
                        rows={3}
                        disabled={submitting}
                        className={`${inputClass} resize-none disabled:opacity-60`}
                    />
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                        <p className="text-sm text-red-600">{error}</p>
                    </div>
                )}

                <div className="flex gap-3">
                    <Button variant="secondary" size="lg" fullWidth onClick={onClose} disabled={submitting}>
                        Cancel
                    </Button>
                    <Button
                        variant="primary"
                        size="lg"
                        fullWidth
                        onClick={handleSubmit}
                        disabled={submitting || !isOnline}
                    >
                        {submitting ? 'Submitting...' : 'Submit'}
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
