import { type ReactNode, useEffect } from "react";

type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: ReactNode;
  /** Prevents closing when clicking the backdrop */
  persistent?: boolean;
};

/**
 * Bottom-sheet modal for mobile. Slides up from the bottom with a drag handle.
 * Used for: New/Edit Shift, Add/Edit Product, New Template forms.
 */
export function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  persistent = false,
}: ModalProps) {
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleBackdropClick = () => {
    if (!persistent) onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm flex items-end justify-center z-20"
      onClick={handleBackdropClick}
    >
      <div
        className="bg-white rounded-t-3xl w-full max-w-2xl p-6 animate-slide-up max-h-[90vh] overflow-y-auto"
        style={{ boxShadow: "0 -4px 24px rgba(0,0,0,0.08)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div
          className="w-10 h-1 rounded-full mx-auto mb-5"
          style={{ backgroundColor: "#e7e5e2" }}
        />

        {title && (
          <h3 className="text-lg font-semibold text-stone-900 mb-1 tracking-tight">
            {title}
          </h3>
        )}
        {subtitle && <p className="text-xs text-stone-400 mb-5">{subtitle}</p>}
        {!title && !subtitle && <div className="mb-4" />}

        {children}
      </div>
    </div>
  );
}
