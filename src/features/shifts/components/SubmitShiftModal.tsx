import { useState } from "react";
import { Modal } from "../../../components/ui/Modal";
import { Button } from "../../../components/ui/Button";

type Props = {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (note: string) => void;
    shiftDisplayName: string;
    totalCount: number;
    totalRevenue: number;
};

export function SubmitShiftModal({
    isOpen,
    onClose,
    onSubmit,
    shiftDisplayName,
    totalCount,
    totalRevenue,
}: Props) {
    const [note, setNote] = useState("");

    const handleSubmit = () => {
        onSubmit(note.trim());
        setNote("");
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Submit Shift">
            <div className="space-y-4">
                <p className="text-sm text-stone-600">{shiftDisplayName}</p>

                <div
                    className="rounded-xl p-3"
                    style={{ backgroundColor: "#ecf5f1" }}
                >
                    <p
                        className="text-xs font-medium uppercase tracking-wider"
                        style={{ color: "#5b8c7a" }}
                    >
                        Summary
                    </p>
                    <p className="text-sm text-stone-900 mt-1">
                        {totalCount} units · ${totalRevenue}
                    </p>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                    <p className="text-sm text-amber-700">
                        ⚠️ After submitting, sales data cannot be changed.
                    </p>
                </div>

                <div>
                    <label className="block text-xs font-medium text-stone-500 mb-1.5 uppercase tracking-wider">
                        Note (optional)
                    </label>
                    <textarea
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="Anything the manager should know..."
                        rows={3}
                        className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-2.5 text-sm text-stone-900 placeholder:text-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-300 transition-all resize-none"
                    />
                </div>

                <div className="flex gap-3">
                    <Button
                        variant="secondary"
                        size="lg"
                        fullWidth
                        onClick={onClose}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="primary"
                        size="lg"
                        fullWidth
                        onClick={handleSubmit}
                    >
                        Submit
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
