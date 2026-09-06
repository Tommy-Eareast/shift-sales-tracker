import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { ShiftTemplate } from '../../../types';
import { DragHandleIcon, EditIcon, DeleteIcon } from '../../../components/ui/icons';

type Props = { template: ShiftTemplate; onEdit: (t: ShiftTemplate) => void; onDelete: (id: string) => void };

export function SortableTemplateItem({ template, onEdit, onDelete }: Props) {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: template.templateId });

    return (
        <div
            ref={setNodeRef}
            style={{ transform: CSS.Transform.toString(transform), transition }}
            className="flex items-center justify-between p-3.5 rounded-xl border border-stone-200/60 bg-white shadow-sm"
        >
            <div className="flex items-center gap-2.5 flex-1 min-w-0">
                <button
                    {...attributes}
                    {...listeners}
                    className="cursor-grab active:cursor-grabbing p-1.5 hover:bg-stone-100 rounded touch-none flex-shrink-0"
                >
                    <DragHandleIcon className="w-4 h-4" />
                </button>
                <div className="text-left min-w-0">
                    <p className="font-semibold text-stone-900 text-sm truncate">{template.templateName}</p>
                    <p className="text-xs text-stone-400 mt-0.5 truncate">
                        {template.brandList.join(', ') || 'No brands yet'}
                        {template.exportProfile && template.exportProfile !== 'default' && (
                            <span className="ml-2 text-emerald-600">({template.exportProfile})</span>
                        )}
                    </p>
                </div>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                <button
                    onClick={() => onEdit(template)}
                    className="p-1.5 rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition-colors"
                >
                    <EditIcon className="w-4 h-4" />
                </button>
                <button
                    onClick={() => onDelete(template.templateId)}
                    className="p-1.5 rounded-lg text-stone-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                >
                    <DeleteIcon className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}
