import { Modal } from "../../../components/ui/Modal";
import { Button } from "../../../components/ui/Button";

type Props = {
    isOpen: boolean;
    onClose: () => void;
    form: { templateName: string; selectedBrands: string[] };
    onChange: (form: {
        templateName: string;
        selectedBrands: string[];
    }) => void;
    error: string;
    brands: string[];
    onSave: () => void;
};

const inputClass =
    "w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-2.5 text-sm text-stone-900 placeholder:text-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-300 transition-all";

export function TemplateFormModal({
    isOpen,
    onClose,
    form,
    onChange,
    error,
    brands,
    onSave,
}: Props) {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="New Template">
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
                    <p className="text-sm text-red-600">{error}</p>
                </div>
            )}
            <div className="space-y-4">
                <div>
                    <label className="block text-xs font-medium text-stone-500 mb-1.5 uppercase tracking-wider">
                        Template Name
                    </label>
                    <input
                        type="text"
                        value={form.templateName}
                        onChange={(e) =>
                            onChange({ ...form, templateName: e.target.value })
                        }
                        className={inputClass}
                    />
                </div>
                <div>
                    <label className="block text-xs font-medium text-stone-500 mb-2 uppercase tracking-wider">
                        Select Brands
                    </label>
                    <p className="text-xs text-stone-300 mb-3">
                        Choose brands (cannot be changed later)
                    </p>
                    {brands.length === 0 ? (
                        <p className="text-sm text-stone-400 p-4 bg-stone-50 rounded-xl text-center">
                            No brands available. Add products first.
                        </p>
                    ) : (
                        <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto p-2 bg-stone-50 rounded-xl">
                            {brands.map((brand) => (
                                <label
                                    key={brand}
                                    className={`flex items-center gap-2.5 p-2.5 rounded-lg cursor-pointer transition-all ${form.selectedBrands.includes(brand) ? "border" : "bg-white border border-stone-200 hover:bg-stone-50"}`}
                                    style={
                                        form.selectedBrands.includes(brand)
                                            ? {
                                                  backgroundColor: "#ecf5f1",
                                                  borderColor: "#5b8c7a",
                                              }
                                            : {}
                                    }
                                >
                                    <input
                                        type="checkbox"
                                        checked={form.selectedBrands.includes(
                                            brand,
                                        )}
                                        onChange={() =>
                                            onChange({
                                                ...form,
                                                selectedBrands:
                                                    form.selectedBrands.includes(
                                                        brand,
                                                    )
                                                        ? form.selectedBrands.filter(
                                                              (b) =>
                                                                  b !== brand,
                                                          )
                                                        : [
                                                              ...form.selectedBrands,
                                                              brand,
                                                          ],
                                            })
                                        }
                                        className="w-4 h-4 rounded"
                                        style={{ accentColor: "#5b8c7a" }}
                                    />
                                    <span className="text-sm text-stone-700 select-none">
                                        {brand}
                                    </span>
                                </label>
                            ))}
                        </div>
                    )}
                </div>
                <div className="flex gap-3 pt-1">
                    <Button
                        variant="secondary"
                        size="lg"
                        fullWidth
                        onClick={onClose}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="primary"
                        size="lg"
                        fullWidth
                        onClick={onSave}
                    >
                        Create Template
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
