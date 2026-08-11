import type { Product } from "../../../types";

type Props = {
    product: Product;
    soldCount: number;
    onAdjust: (productId: string, delta: number) => void;
};

export function ProductSalesRow({ product, soldCount, onAdjust }: Props) {
    const revenue = soldCount * product.price;

    return (
        <div className="p-3 hover:bg-stone-50/50 transition-colors">
            <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0 mr-3">
                    <p className="text-sm text-stone-900 truncate">
                        {product.fullName}
                    </p>
                    <p className="text-xs text-stone-400">${product.price}</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="text-right min-w-[60px]">
                        <p
                            className="text-sm font-semibold"
                            style={{ color: "#5b8c7a" }}
                        >
                            ${revenue}
                        </p>
                    </div>
                    <div className="flex items-center gap-1.5 bg-stone-100 rounded-lg p-1">
                        <button
                            onClick={() => onAdjust(product.id, -1)}
                            disabled={soldCount === 0}
                            className="w-7 h-7 flex items-center justify-center bg-white rounded-md border border-stone-200 hover:bg-stone-50 disabled:opacity-30 disabled:cursor-not-allowed active:scale-95 transition-all text-stone-600 text-sm font-medium"
                        >
                            −
                        </button>
                        <span className="w-7 text-center font-semibold text-stone-900 text-sm">
                            {soldCount}
                        </span>
                        <button
                            onClick={() => onAdjust(product.id, 1)}
                            className="w-7 h-7 flex items-center justify-center text-white rounded-md active:scale-95 transition-all text-sm font-medium"
                            style={{
                                background: "#5b8c7a",
                                boxShadow: "0 1px 3px rgba(91,140,122,0.3)",
                            }}
                        >
                            +
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
