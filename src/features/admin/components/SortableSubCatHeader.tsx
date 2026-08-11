type Props = {
    subCat: string;
    count: number;
    isExpanded: boolean;
    onToggle: () => void;
    dragHandleProps: Record<string, unknown>;
};

export function SortableSubCatHeader({
    subCat,
    count,
    isExpanded,
    onToggle,
    dragHandleProps,
}: Props) {
    return (
        <div className="flex items-center w-full hover:bg-stone-50 rounded-lg transition-colors">
            <button
                {...dragHandleProps}
                className="cursor-grab active:cursor-grabbing p-1.5 hover:bg-stone-200 rounded touch-none flex-shrink-0"
            >
                <svg
                    className="w-3.5 h-3.5 text-stone-300"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path d="M8 6h2v2H8V6zm6 0h2v2h-2V6zM8 11h2v2H8v-2zm6 0h2v2h-2v-2zm-6 5h2v2H8v-2zm6 0h2v2h-2v-2z" />
                </svg>
            </button>
            <button
                onClick={onToggle}
                className="flex-1 flex items-center justify-between px-3 py-2 text-left"
            >
                <p className="text-xs font-medium text-stone-500 uppercase tracking-wider">
                    {subCat}{" "}
                    <span className="text-stone-300 font-normal">
                        ({count})
                    </span>
                </p>
                <span className="text-stone-300 text-xs">
                    {isExpanded ? "▾" : "▸"}
                </span>
            </button>
        </div>
    );
}
