import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Product } from "../../../types";

type Props = {
  product: Product;
  onEdit: (p: Product) => void;
  onDelete: (id: string) => void;
};

export function SortableProductItem({ product, onEdit, onDelete }: Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: product.id });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 50 : undefined,
      }}
      className="flex items-center justify-between p-2.5 hover:bg-stone-50 rounded-lg text-sm group transition-colors"
    >
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1 hover:bg-stone-200 rounded touch-none flex-shrink-0"
        >
          <svg
            className="w-3.5 h-3.5 text-stone-300"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M8 6h2v2H8V6zm6 0h2v2h-2V6zM8 11h2v2H8v-2zm6 0h2v2h-2v-2zm-6 5h2v2H8v-2zm6 0h2v2h-2v-2z" />
          </svg>
        </button>
        <span className="text-stone-700 truncate text-sm">
          {product.fullName}
        </span>
      </div>

      {/* Price + hover actions */}
      <div className="relative flex items-center flex-shrink-0 min-w-[52px] justify-end">
        {/* Price — hidden on hover */}
        <span className="text-stone-400 text-xs group-hover:invisible">
          ${product.price}
        </span>

        {/* Edit/Delete — shown on hover, overlaid on same spot */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center gap-0.5">
          <button
            onClick={() => onEdit(product)}
            className="p-1 rounded text-stone-400 hover:text-stone-600 hover:bg-stone-100"
          >
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
          </button>
          <button
            onClick={() => onDelete(product.id)}
            className="p-1 rounded text-stone-400 hover:text-red-500 hover:bg-red-50"
          >
            <svg
              className="w-3.5 h-3.5"
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
      </div>
    </div>
  );
}
