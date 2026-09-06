import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { DragHandleIcon } from '../../../components/ui/icons';

type Props = { brand: string; isExpanded: boolean; onToggle: () => void };

export function SortableBrandHeader({ brand, isExpanded, onToggle }: Props) {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: brand });

    return (
        <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} className="mb-2">
            <div className="flex items-center w-full p-3 bg-stone-50 rounded-xl hover:bg-stone-100 transition-colors">
                <button
                    {...attributes}
                    {...listeners}
                    className="cursor-grab active:cursor-grabbing p-1.5 hover:bg-stone-200 rounded touch-none flex-shrink-0"
                >
                    <DragHandleIcon className="w-4 h-4" />
                </button>
                <button onClick={onToggle} className="flex-1 flex items-center justify-between ml-2">
                    <span className="font-semibold text-stone-900 text-sm">{brand}</span>
                    <span className="text-stone-300 text-xs">{isExpanded ? '▾' : '▸'}</span>
                </button>
            </div>
        </div>
    );
}
