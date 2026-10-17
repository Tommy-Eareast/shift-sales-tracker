import { useEffect } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';

type Props = { isOpen: boolean; title: string; message: string; onClose: () => void };

export function AlertModal({ isOpen, title, message, onClose }: Props) {
    useEffect(() => {
        if (!isOpen) return;
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'Enter' || e.key === 'Escape') {
                e.preventDefault();
                onClose();
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [isOpen, onClose]);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title} persistent>
            <div className="space-y-4">
                <p className="text-sm text-stone-600">{message}</p>
                <Button variant="primary" size="lg" fullWidth onClick={onClose}>
                    OK
                </Button>
            </div>
        </Modal>
    );
}
