import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Product } from '../../../types';
import { DragHandleIcon, EditIcon, DeleteIcon } from '../../../components/ui/icons';

type Props = { product: Product; onEdit: (p: Product) => void; onDelete: (id: string) => void };

export function SortableProductItem({ product, onEdit, onDelete }: Props) {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: product.id });

    return (
        <div
            ref={setNodeRef}
            style={{ transform: CSS.Transform.toString(transform), transition }}
            className="flex items-center justify-between p-2.5 hover:bg-stone-50 rounded-lg text-sm"
        >
            <div className="flex items-center gap-2 flex-1 min-w-0">
                <button
                    {...attributes}
                    {...listeners}
                    className="cursor-grab active:cursor-grabbing p-1 hover:bg-stone-200 rounded touch-none flex-shrink-0"
                >
                    <DragHandleIcon className="w-3.5 h-3.5" />
                </button>
                <span className="text-stone-700 truncate text-sm">{product.fullName}</span>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-stone-400 text-xs">${product.price}</span>
                <div className="flex items-center gap-0.5">
                    <button
                        onClick={() => onEdit(product)}
                        className="p-1.5 rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-100"
                    >
                        <EditIcon className="w-3.5 h-3.5" />
                    </button>
                    <button
                        onClick={() => onDelete(product.id)}
                        className="p-1.5 rounded-lg text-stone-400 hover:text-red-500 hover:bg-red-50"
                    >
                        <DeleteIcon className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>
        </div>
    );
}
