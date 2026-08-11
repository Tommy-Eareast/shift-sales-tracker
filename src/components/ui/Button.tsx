import { type ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

type ButtonProps = {
    children: ReactNode;
    variant?: ButtonVariant;
    size?: ButtonSize;
    disabled?: boolean;
    fullWidth?: boolean;
    className?: string;
    onClick?: () => void;
    type?: "button" | "submit";
};

const sizeClasses: Record<ButtonSize, string> = {
    sm: "px-3 py-1.5 text-xs rounded-lg",
    md: "px-4 py-2 text-sm rounded-xl",
    lg: "px-4 py-3 text-sm rounded-xl",
};

/**
 * Consistent button component with variants matching the Clean Minimalist theme.
 *
 * Variants:
 * - primary: Sage green gradient (main actions)
 * - secondary: Light stone background (cancel, back)
 * - danger: Red (delete confirmations)
 * - ghost: Transparent with hover (icon buttons)
 */
export function Button({
    children,
    variant = "primary",
    size = "md",
    disabled = false,
    fullWidth = false,
    className = "",
    onClick,
    type = "button",
}: ButtonProps) {
    const getVariantStyle = (): React.CSSProperties => {
        switch (variant) {
            case "primary":
                return {
                    background: "linear-gradient(135deg, #5b8c7a, #6d9e8a)",
                    color: "white",
                    boxShadow: "0 2px 8px rgba(91,140,122,0.2)",
                };
            case "secondary":
                return {
                    backgroundColor: "#f5f4f1",
                    color: "#78716c",
                };
            case "danger":
                return {
                    backgroundColor: "#fef2f2",
                    color: "#b91c1c",
                    border: "1px solid #fecaca",
                };
            case "ghost":
                return {
                    backgroundColor: "transparent",
                    color: "#78716c",
                };
            default:
                return {};
        }
    };

    return (
        <button
            type={type}
            disabled={disabled}
            onClick={onClick}
            className={[
                sizeClasses[size],
                fullWidth ? "w-full" : "",
                "font-medium transition-all duration-200",
                "active:scale-95",
                "disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100",
                variant === "ghost" ? "hover:bg-stone-100" : "",
                className,
            ]
                .filter(Boolean)
                .join(" ")}
            style={getVariantStyle()}
        >
            {children}
        </button>
    );
}
