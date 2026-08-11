import { Modal } from "../../../components/ui/Modal";
import { Button } from "../../../components/ui/Button";
import type { ShiftTemplate } from "../../../types";

type Props = {
    isOpen: boolean;
    onClose: () => void;
    templates: ShiftTemplate[];
    selectedTemplate: string;
    recordDate: string;
    timeStart: string;
    timeEnd: string;
    onTemplateChange: (id: string) => void;
    onDateChange: (date: string) => void;
    onTimeStartChange: (time: string) => void;
    onTimeEndChange: (time: string) => void;
    onCreate: () => void;
};

const inputClass =
    "w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-2.5 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-300 transition-all";

export function NewShiftModal({
    isOpen,
    onClose,
    templates,
    selectedTemplate,
    recordDate,
    timeStart,
    timeEnd,
    onTemplateChange,
    onDateChange,
    onTimeStartChange,
    onTimeEndChange,
    onCreate,
}: Props) {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="New Shift">
            <div className="space-y-4">
                <div>
                    <label className="block text-xs font-medium text-stone-500 mb-1.5 uppercase tracking-wider">
                        Template
                    </label>
                    <select
                        value={selectedTemplate}
                        onChange={(e) => onTemplateChange(e.target.value)}
                        className={inputClass}
                    >
                        {templates.map((t) => (
                            <option key={t.templateId} value={t.templateId}>
                                {t.templateName}
                            </option>
                        ))}
                    </select>
                </div>
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
                <Button
                    variant="primary"
                    size="lg"
                    fullWidth
                    onClick={onCreate}
                >
                    Create Shift
                </Button>
            </div>
        </Modal>
    );
}
