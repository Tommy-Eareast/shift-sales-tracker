import { Modal } from "../../../components/ui/Modal";
import { Button } from "../../../components/ui/Button";

type Props = {
    isOpen: boolean;
    onClose: () => void;
    templateName: string;
    recordDate: string;
    timeStart: string;
    timeEnd: string;
    onDateChange: (date: string) => void;
    onTimeStartChange: (time: string) => void;
    onTimeEndChange: (time: string) => void;
    onUpdate: () => void;
};

const inputClass =
    "w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-2.5 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-300 transition-all";

export function EditShiftModal({
    isOpen,
    onClose,
    templateName,
    recordDate,
    timeStart,
    timeEnd,
    onDateChange,
    onTimeStartChange,
    onTimeEndChange,
    onUpdate,
}: Props) {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Edit Shift"
            subtitle={templateName}
        >
            <div className="space-y-4">
                <div>
                    <label className="block text-xs font-medium text-stone-500 mb-1.5 uppercase tracking-wider">
                        Date
                    </label>
                    <input
                        type="date"
                        value={recordDate}
                        onChange={(e) => onDateChange(e.target.value)}
                        className={inputClass}
                    />
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-xs font-medium text-stone-500 mb-1.5 uppercase tracking-wider">
                            Start
                        </label>
                        <input
                            type="time"
                            value={timeStart}
                            onChange={(e) => onTimeStartChange(e.target.value)}
                            className={inputClass}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-stone-500 mb-1.5 uppercase tracking-wider">
                            End
                        </label>
                        <input
                            type="time"
                            value={timeEnd}
                            onChange={(e) => onTimeEndChange(e.target.value)}
                            className={inputClass}
                        />
                    </div>
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
                        onClick={onUpdate}
                    >
                        Update Shift
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
