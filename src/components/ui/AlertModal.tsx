import { Modal } from "./Modal";
import { Button } from "./Button";

type Props = {
    isOpen: boolean;
    title: string;
    message: string;
    onClose: () => void;
};

/**
 * Reusable alert modal.
 * Replaces browser alert() with consistent styling.
 * Only shows an "OK" button — no confirmation action.
 */
export function AlertModal({ isOpen, title, message, onClose }: Props) {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title}>
            <div className="space-y-4">
                <p className="text-sm text-stone-600">{message}</p>
                <Button variant="primary" size="lg" fullWidth onClick={onClose}>
                    OK
                </Button>
            </div>
        </Modal>
    );
}
