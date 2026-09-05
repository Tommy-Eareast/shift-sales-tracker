import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { SortableSubCatHeader } from "./SortableSubCatHeader";

type Props = {
  subCat: string;
  count: number;
  isExpanded: boolean;
  onToggle: () => void;
};

export function SortableSubCatWrapper({
  subCat,
  count,
  isExpanded,
  onToggle,
}: Props) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: subCat });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
    >
      <SortableSubCatHeader
        subCat={subCat}
        count={count}
        isExpanded={isExpanded}
        onToggle={onToggle}
        dragHandleProps={{ ...attributes, ...listeners }}
      />
    </div>
  );
}
