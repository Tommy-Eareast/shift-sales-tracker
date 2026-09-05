import type { Product } from "../../../types";
import { Modal } from "../../../components/ui/Modal";
import { Button } from "../../../components/ui/Button";
import AutocompleteInput from "../../../components/AutocompleteInput";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  editingProduct: Product | null;
  form: {
    brandMain: string;
    subCategory: string;
    fullName: string;
    price: number;
  };
  onChange: (form: {
    brandMain: string;
    subCategory: string;
    fullName: string;
    price: number;
  }) => void;
  error: string;
  brands: string[];
  subCategorySuggestions: string[];
  onSave: () => void;
};

const inputClass =
  "w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-2.5 text-sm text-stone-900 placeholder:text-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-300 transition-all";

export function ProductFormModal({
  isOpen,
  onClose,
  editingProduct,
  form,
  onChange,
  error,
  brands,
  subCategorySuggestions,
  onSave,
}: Props) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingProduct ? "Edit Product" : "Add Product"}
    >
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}
      <div className="space-y-4">
        <AutocompleteInput
          label="Brand"
          value={form.brandMain}
          onChange={(v) => onChange({ ...form, brandMain: v, subCategory: "" })}
          suggestions={brands}
          placeholder="e.g., Montblanc"
        />
        <AutocompleteInput
          label="Sub Category"
          value={form.subCategory}
          onChange={(v) => onChange({ ...form, subCategory: v })}
          suggestions={subCategorySuggestions}
          placeholder="e.g., Explorer Series"
        />
        <div>
          <label className="block text-xs font-medium text-stone-500 mb-1.5 uppercase tracking-wider">
            Full Name
          </label>
          <input
            type="text"
            value={form.fullName}
            onChange={(e) => onChange({ ...form, fullName: e.target.value })}
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-stone-500 mb-1.5 uppercase tracking-wider">
            Price (AUD)
          </label>
          <input
            type="number"
            value={form.price || ""}
            onChange={(e) =>
              onChange({
                ...form,
                price: parseFloat(e.target.value) || 0,
              })
            }
            step="0.01"
            min="0"
            className={inputClass}
          />
        </div>
        <div className="flex gap-3 pt-1">
          <Button variant="secondary" size="lg" fullWidth onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" size="lg" fullWidth onClick={onSave}>
            {editingProduct ? "Update" : "Add"} Product
          </Button>
        </div>
      </div>
    </Modal>
  );
}
