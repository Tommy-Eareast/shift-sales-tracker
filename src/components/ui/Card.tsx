import { type ReactNode } from "react";

type CardProps = {
  children: ReactNode;
  className?: string;
  /** Makes the card look interactive (hover shadow, active scale) */
  interactive?: boolean;
  /** Click handler for interactive cards */
  onClick?: () => void;
  /** Removes default padding */
  noPadding?: boolean;
};

/**
 * Standard card component with consistent border, shadow, and rounded corners.
 * Used throughout the app for shift cards, product lists, stats, etc.
 */
export function Card({
  children,
  className = "",
  interactive = false,
  onClick,
  noPadding = false,
}: CardProps) {
  const baseClasses = "bg-white rounded-2xl border border-stone-200/60";
  const paddingClass = noPadding ? "" : "p-4";
  const interactiveClass = interactive
    ? "transition-all duration-200 active:scale-[0.98] cursor-pointer"
    : "";

  return (
    <div
      className={`${baseClasses} ${paddingClass} ${interactiveClass} ${className}`}
      style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

/** Sub-component for card headers with consistent spacing */
export function CardHeader({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex items-center justify-between mb-4 ${className}`}>
      {children}
    </div>
  );
}
