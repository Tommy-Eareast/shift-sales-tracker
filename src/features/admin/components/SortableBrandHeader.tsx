import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

type Props = {
    brand: string;
    isExpanded: boolean;
    onToggle: () => void;
};

export function SortableBrandHeader({ brand, isExpanded, onToggle }: Props) {
    const { attributes, listeners, setNodeRef, transform, transition } =
        useSortable({ id: brand });

    return (
        <div
            ref={setNodeRef}
            style={{ transform: CSS.Transform.toString(transform), transition }}
            className="mb-1"
        >
            <div
                className="flex items-center w-full p-3 rounded-xl hover:bg-stone-50 transition-colors"
                style={{
                    backgroundColor: "#fafaf9",
                    border: "1px solid #e7e5e2",
                }}
            >
                <button
                    {...attributes}
                    {...listeners}
                    className="cursor-grab active:cursor-grabbing p-1.5 hover:bg-stone-200 rounded touch-none flex-shrink-0"
                >
                    <svg
                        className="w-4 h-4 text-stone-300"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path d="M8 6h2v2H8V6zm6 0h2v2h-2V6zM8 11h2v2H8v-2zm6 0h2v2h-2v-2zm-6 5h2v2H8v-2zm6 0h2v2h-2v-2z" />
                    </svg>
                </button>
                <button
                    onClick={onToggle}
                    className="flex-1 flex items-center justify-between ml-2"
                >
                    <span className="font-semibold text-stone-900 text-sm">
                        {brand}
                    </span>
                    <span className="text-stone-300 text-xs">
                        {isExpanded ? "▾" : "▸"}
                    </span>
                </button>
            </div>
        </div>
    );
}
