import React, { useEffect, useRef, useCallback } from "react";
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

  // Accessibility props
  ariaLabel?: string;
  ariaDescribedBy?: string;
  role?: string;
  initialFocusRef?: React.RefObject<HTMLElement>;
  finalFocusRef?: React.RefObject<HTMLElement>;
  trapFocus?: boolean;

  // Animation props
  animateIn?: boolean;
  animateOut?: boolean;
  animationDuration?: number;
  overlayAnimation?: string;
  contentAnimation?: string;

  // Advanced behavior
  closeOnEscape?: boolean;
  restoreFocus?: boolean;
  lockScroll?: boolean;
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
  preventClickOutside = false,

  // Accessibility
  ariaLabel,
  ariaDescribedBy,
  role = "dialog",
  initialFocusRef,
  finalFocusRef,
  trapFocus = true,

  // Animation
  animateIn = true,
  animateOut = true,
  animationDuration = 200,
  overlayAnimation = "animate-in fade-in",
  contentAnimation = "animate-in fade-in zoom-in-95 slide-in-from-bottom-4",

  // Advanced behavior
  closeOnEscape = true,
  restoreFocus = true,
  lockScroll = true
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);
  const [isAnimatingOut, setIsAnimatingOut] = React.useState(false);

  // Focus trap implementation
  const getFocusableElements = useCallback(() => {
    if (!modalRef.current) return [];
    const focusableSelectors = ["a[href]", "button:not([disabled])", "textarea:not([disabled])", "input:not([disabled])", "select:not([disabled])", '[tabindex]:not([tabindex="-1"])'].join(",");
    return Array.from(modalRef.current.querySelectorAll<HTMLElement>(focusableSelectors));
  }, []);

  // Handle focus trap
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape" && closeOnEscape) {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key === "Tab" && trapFocus) {
        const focusableElements = getFocusableElements();
        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    },
    [closeOnEscape, onClose, trapFocus, getFocusableElements]
  );

  // Lock body scroll
  useEffect(() => {
    if (!isOpen || !lockScroll) return;

    const originalOverflow = document.body.style.overflow;
    const originalPaddingRight = document.body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    document.body.style.overflow = "hidden";
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.paddingRight = originalPaddingRight;
    };
  }, [isOpen, lockScroll]);

  // Focus management
  useEffect(() => {
    if (!isOpen) return;

    // Store previously focused element
    previousActiveElement.current = document.activeElement as HTMLElement;

    // Set initial focus
    const setInitialFocus = () => {
      if (initialFocusRef?.current) {
        initialFocusRef.current.focus();
      } else {
        const focusableElements = getFocusableElements();
        if (focusableElements.length > 0) {
          focusableElements[0].focus();
        } else {
          modalRef.current?.focus();
        }
      }
    };

    // Delay focus to ensure DOM is ready
    const timeoutId = setTimeout(setInitialFocus, 50);

    // Add keyboard event listener
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener("keydown", handleKeyDown);

      // Restore focus
      if (restoreFocus && previousActiveElement.current) {
        if (finalFocusRef?.current) {
          finalFocusRef.current.focus();
        } else {
          previousActiveElement.current.focus();
        }
      }
    };
  }, [isOpen, initialFocusRef, finalFocusRef, restoreFocus, handleKeyDown, getFocusableElements]);

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && !preventClickOutside) {
      if (animateOut) {
        setIsAnimatingOut(true);
        setTimeout(() => {
          onClose();
          setIsAnimatingOut(false);
        }, animationDuration);
      } else {
        onClose();
      }
    }
  };

  const handleClose = () => {
    if (animateOut) {
      setIsAnimatingOut(true);
      setTimeout(() => {
        onClose();
        setIsAnimatingOut(false);
      }, animationDuration);
    } else {
      onClose();
    }
  };

  if (!isOpen && !isAnimatingOut) return null;

  // Responsive classes
  const responsiveWidth = mobileFullScreen ? "w-full sm:w-auto " + (width || "") : width || "w-full";

  const responsiveHeight = mobileFullScreen ? "h-full sm:h-auto " + (height || "") : height || "";

  // Animation classes
  const overlayClasses = `fixed inset-0 !z-[9999] flex items-center justify-center ${overlayStyle} ${animateIn && !isAnimatingOut ? overlayAnimation : ""} ${isAnimatingOut ? "animate-out fade-out" : ""}`;
  const contentClasses = `relative flex flex-col ${responsiveWidth} ${responsiveHeight} ${maxWidth} ${maxHeight} ${modalStyle} ${animateIn && !isAnimatingOut ? contentAnimation : ""} ${isAnimatingOut ? "animate-out fade-out zoom-out-95 slide-out-to-bottom-4" : ""}`;

  const modalContent = (
    <div className={overlayClasses} onClick={handleOverlayClick} style={{ animationDuration: `${animationDuration}ms` }} aria-hidden={!isOpen}>
      <div
        ref={modalRef}
        className={contentClasses}
        style={{
          maxWidth: maxWidth === "max-w-none" ? "none" : undefined,
          maxHeight: maxHeight === "max-h-none" ? "none" : undefined,
          animationDuration: `${animationDuration}ms`
        }}
        onClick={e => e.stopPropagation()}
        role={role}
        aria-modal="true"
        aria-label={ariaLabel || (typeof title === "string" ? title : undefined)}
        aria-describedby={ariaDescribedBy}
        tabIndex={-1}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <header className={headerStyle}>
            {title && <h2 className={titleStyle}>{title}</h2>}
            {showCloseButton && (
              <button onClick={handleClose} className={closeButtonStyle} aria-label="Close modal" type="button">
                <X size={22} />
              </button>
            )}
          </header>
        )}

        {/* Scrollable Content */}
        <div className={contentStyle} id={ariaDescribedBy}>
          {children}
        </div>

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
                    <button
                      key={i}
                      onClick={onClick}
                      disabled={disabled}
                      type="button"
                      className={`px-4 py-2 rounded text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${variant === "primary" ? "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500" : variant === "danger" ? "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500" : "bg-gray-200 text-gray-700 hover:bg-gray-300 focus:ring-gray-500"} ${disabled ? "opacity-50 cursor-not-allowed" : ""} ${className}`}
                    >
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
