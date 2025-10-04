import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

export interface ModalAction {
  label: string;
  onClick: () => void;
  variant?: "primary" | "secondary" | "danger";
  disabled?: boolean;
  show?: boolean;
  className?: string;
}

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  actions?: ModalAction[];
  children: React.ReactNode;
  footer?: React.ReactNode;
  showCloseButton?: boolean;

  // Style customization props
  overlayStyle?: string;
  modalStyle?: string;
  headerStyle?: string;
  contentStyle?: string;
  footerStyle?: string;
  closeButtonStyle?: string;
  titleStyle?: string;

  // Layout customization
  width?: string;
  height?: string;
  maxWidth?: string;
  maxHeight?: string;

  // Responsive customization
  mobileFullScreen?: boolean;
  preventClickOutside?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  actions = [],
  children,
  footer,
  showCloseButton = true,

  // Style customization
  overlayStyle = "bg-black/50",
  modalStyle = "bg-white dark:bg-gray-900 rounded-lg shadow-lg",
  headerStyle = "flex justify-between items-center p-4 border-b dark:border-gray-700 sticky top-0 bg-inherit z-10",
  contentStyle = "flex-1 overflow-y-auto p-4",
  footerStyle = "p-4 border-t dark:border-gray-700 sticky bottom-0 bg-inherit z-10",
  closeButtonStyle = "text-gray-500 hover:text-red-500 transition",
  titleStyle = "text-lg font-semibold text-gray-800 dark:text-white",

  // Layout customization
  width,
  height,
  maxWidth = "max-w-3xl",
  maxHeight = "max-h-[90vh]",

  // Responsive behavior
  mobileFullScreen = false,
  preventClickOutside = false
}) => {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && !preventClickOutside) {
      onClose();
    }
  };

  if (!isOpen) return null;

  // Responsive classes
  const responsiveWidth = mobileFullScreen ? "w-full sm:w-auto " + (width || "") : width || "w-full";

  const responsiveHeight = mobileFullScreen ? "h-full sm:h-auto " + (height || "") : height || "";

  const modalContent = (
    <div className={`fixed inset-0 !z-[9999] flex items-center justify-center ${overlayStyle}`} onClick={handleOverlayClick}>
      <div className={`relative flex flex-col ${responsiveWidth} ${responsiveHeight} ${maxWidth} ${maxHeight} ${modalStyle}`} style={{ maxWidth: maxWidth === 'max-w-none' ? 'none' : undefined, maxHeight: maxHeight === 'max-h-none' ? 'none' : undefined }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        {(title || showCloseButton) && (
          <header className={headerStyle}>
            {title && <h2 className={titleStyle}>{title}</h2>}
            {showCloseButton && (
              <button onClick={onClose} className={closeButtonStyle}>
                <X size={22} />
              </button>
            )}
          </header>
        )}

        {/* Scrollable Content */}
        <div className={contentStyle}>{children}</div>

        {/* Footer */}
        {(footer || actions.length > 0) && (
          <footer className={footerStyle}>
            {footer ? (
              footer
            ) : (
              <div className="flex justify-end gap-2">
                {actions
                  .filter(a => a.show !== false)
                  .map(({ label, onClick, variant = "primary", disabled, className = "" }, i) => (
                    <button key={i} onClick={onClick} disabled={disabled} className={`px-4 py-2 rounded text-sm font-medium ${variant === "primary" ? "bg-blue-600 text-white hover:bg-blue-700" : variant === "danger" ? "bg-red-600 text-white hover:bg-red-700" : "bg-gray-200 text-gray-700 hover:bg-gray-300"} ${disabled ? "opacity-50 cursor-not-allowed" : ""} ${className}`}>
                      {label}
                    </button>
                  ))}
              </div>
            )}
          </footer>
        )}
      </div>
    </div>
  );

  // Render modal using portal to document.body to ensure it's above everything
  return createPortal(modalContent, document.body);
};
