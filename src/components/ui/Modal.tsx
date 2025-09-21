import React, { useEffect, useRef, ReactNode } from "react";
import { X } from "lucide-react";
import { createPortal } from "react-dom";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: "sm" | "md" | "lg" | "xl" | "full";
  closeOnOverlayClick?: boolean;
  showCloseButton?: boolean;
  className?: string;
  overlayClassName?: string;
  titleClassName?: string;
  bodyClassName?: string;
  footer?: ReactNode;
  hideFooter?: boolean;
  hideHeader?: boolean;
}

const sizeClasses = {
  sm: "max-w-md",
  md: "max-w-xl",
  lg: "max-w-3xl",
  xl: "max-w-5xl",
  full: "max-w-full w-full mx-4",
};

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = "md",
  closeOnOverlayClick = true,
  showCloseButton = true,
  className = "",
  overlayClassName = "",
  titleClassName = "",
  bodyClassName = "",
  footer,
  hideFooter = false,
  hideHeader = false,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const [isMounted, setIsMounted] = React.useState(false);

  // Handle outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        closeOnOverlayClick &&
        modalRef.current &&
        !modalRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    // Handle escape key
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
      setIsMounted(true);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "auto";
    };
  }, [isOpen, onClose, closeOnOverlayClick]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }

    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isOpen]);

  // Animation classes
  const modalClasses = `
    fixed inset-0 flex items-center justify-center z-50 p-4
    transition-opacity duration-300 ease-in-out
    ${isMounted ? "opacity-100" : "opacity-0 pointer-events-none"}
  `;

  const overlayClasses = `
    fixed inset-0 bg-black/50 backdrop-blur-sm
    transition-opacity duration-300 ease-in-out
    ${overlayClassName}
    ${isMounted ? "opacity-100" : "opacity-0 pointer-events-none"}
  `;

  const contentClasses = `
    bg-white rounded-lg shadow-xl w-full mx-auto relative z-10
    max-h-[90vh] overflow-y-auto
    transform transition-all duration-300 ease-in-out
    ${sizeClasses[size]}
    ${isMounted ? "translate-y-0 opacity-100" : "-translate-y-4 opacity-0"}
    ${className}
  `;

  if (!isOpen) return null;

  return createPortal(
    <div className={modalClasses}>
      <div
        className={overlayClasses}
        onClick={closeOnOverlayClick ? onClose : undefined}
      />
      <div ref={modalRef} className={contentClasses}>
        {!hideHeader && (
          <div
            className={`px-6 py-4 border-b border-gray-200 flex items-center justify-between ${titleClassName}`}
          >
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            {showCloseButton && (
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500 focus:outline-none"
                aria-label="Close modal"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        )}
        <div className={`p-6 ${bodyClassName}`}>{children}</div>
        {!hideFooter && (
          <div className="px-6 py-4 bg-gray-50 rounded-b-lg flex justify-end space-x-3">
            {footer || (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Close
              </button>
            )}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};

export default Modal;
