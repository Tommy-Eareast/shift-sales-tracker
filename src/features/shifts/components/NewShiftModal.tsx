import { useEffect } from 'react';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { inputClass } from '../../../utils/styles';
import type { ShiftTemplate } from '../../../types';

type Props = {
    isOpen: boolean;
    onClose: () => void;
    templates: ShiftTemplate[];
    selectedTemplate: string;
    recordDate: string;
    timeStart: string;
    timeEnd: string;
    error: string;
    onTemplateChange: (id: string) => void;
    onDateChange: (date: string) => void;
    onTimeStartChange: (time: string) => void;
    onTimeEndChange: (time: string) => void;
    onCreate: () => void;
};

export function NewShiftModal({
    isOpen,
    onClose,
    templates,
    selectedTemplate,
    recordDate,
    timeStart,
    timeEnd,
    error,
    onTemplateChange,
    onDateChange,
    onTimeStartChange,
    onTimeEndChange,
    onCreate,
}: Props) {
    useEffect(() => {
        if (!isOpen) return;
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                onCreate();
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [isOpen, onCreate]);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="New Shift" persistent>
            <div className="space-y-4">
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                        <p className="text-sm text-red-600">{error}</p>
                    </div>
                )}

                <div>
                    <label className="block text-xs font-medium text-stone-500 mb-1.5 uppercase tracking-wider">
                        Template
                    </label>
                    <select
                        value={selectedTemplate}
                        onChange={e => onTemplateChange(e.target.value)}
                        className={inputClass}
                    >
                        {templates.map(t => (
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
                        onChange={e => onDateChange(e.target.value)}
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
                            onChange={e => onTimeStartChange(e.target.value)}
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
                            onChange={e => onTimeEndChange(e.target.value)}
                            className={inputClass}
                        />
                    </div>
                </div>
                <div className="flex gap-2 pt-1">
                    <Button variant="secondary" size="lg" fullWidth onClick={onClose}>
                        Cancel
                    </Button>
                    <Button variant="primary" size="lg" fullWidth onClick={onCreate}>
                        Create Shift
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
