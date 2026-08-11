import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { ShiftTemplate } from "../../../types";

type Props = {
    template: ShiftTemplate;
    onDelete: (id: string) => void;
};

export function SortableTemplateItem({ template, onDelete }: Props) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: template.templateId });

    return (
        <div
            ref={setNodeRef}
            style={{
                transform: CSS.Transform.toString(transform),
                transition,
                opacity: isDragging ? 0.5 : 1,
            }}
            className="flex items-center justify-between p-3.5 rounded-xl border border-stone-200/60 bg-white shadow-sm"
        >
            <div className="flex items-center gap-2.5 flex-1 min-w-0">
                <button
                    {...attributes}
                    {...listeners}
                    className="cursor-grab active:cursor-grabbing p-1.5 hover:bg-stone-100 rounded touch-none flex-shrink-0"
                >
                    <svg
                        className="w-4 h-4 text-stone-300"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path d="M8 6h2v2H8V6zm6 0h2v2h-2V6zM8 11h2v2H8v-2zm6 0h2v2h-2v-2zm-6 5h2v2H8v-2zm6 0h2v2h-2v-2z" />
                    </svg>
                </button>
                <div className="text-left min-w-0">
                    <p className="font-semibold text-stone-900 text-sm truncate">
                        {template.templateName}
                    </p>
                    <p className="text-xs text-stone-400 mt-0.5 truncate">
                        {template.brandList.join(", ")}
                    </p>
                </div>
            </div>
            <button
                onClick={() => onDelete(template.templateId)}
                className="p-1.5 rounded-lg text-stone-400 hover:text-red-500 hover:bg-red-50 transition-colors flex-shrink-0 ml-2"
            >
                <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                </svg>
            </button>
        </div>
    );
}
