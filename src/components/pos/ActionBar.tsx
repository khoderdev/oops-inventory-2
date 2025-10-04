import { Button } from "@/components/ui/button";
import { usePermissions } from "@/hooks/usePermissions";
import { PERMISSIONS } from "@/types/auth";
import { FileText, LucideIcon, Printer, Settings, Trash, WifiCog, X, Menu } from "lucide-react";
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ActionButtonConfig, defaultActionButtons, FlexibleActionBarProps, LegacyActionBarProps } from "./constants";

export type ActionBarProps = LegacyActionBarProps | FlexibleActionBarProps;
function isLegacyProps(props: ActionBarProps): props is LegacyActionBarProps {
  return "onSaveOrder" in props || "onPrintReceipt" in props || !("buttons" in props);
}

// Individual Action Button Component
export const ActionButton: React.FC<ActionButtonConfig & { className?: string; compact?: boolean; isMobile?: boolean }> = ({ icon: IconComponent, label, active = false, disabled = false, onClick, className = "", compact = false, badgeCount, showIndicator = false, indicatorColor = "bg-green-500", title, isMobile = false }) => {
  const baseClasses = "flex flex-col items-center justify-center rounded-none select-none transition-colors duration-200";
  const heightClass = compact ? "h-12 p-2" : isMobile ? "h-14 p-3" : "h-16 p-3";
  const activeClasses = active ? "bg-teal-500 text-white hover:text-white hover:bg-teal-600" : "hover:bg-gray-100";
  const iconSize = compact ? "w-4 h-4" : isMobile ? "w-5 h-5" : "!w-6 !h-6";
  const textSize = compact ? "text-xs" : isMobile ? "text-xs" : "text-sm";
  const iconMargin = compact ? "" : "";

  return (
    <Button variant="outline" className={`${baseClasses} ${heightClass} ${activeClasses} ${className} relative`} onClick={onClick} disabled={disabled} title={title}>
      <IconComponent className={`${iconSize} ${iconMargin}`} />
      <span className={textSize}>{label}</span>
      {badgeCount && badgeCount > 0 && <span className="absolute top-1.5 right-3 bg-red-500 text-white text-xs rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">{badgeCount > 99 ? "99+" : badgeCount}</span>}
      {showIndicator && <div className={`w-2 h-2 ${indicatorColor} rounded-full absolute top-1 right-1`}></div>}
    </Button>
  );
};

// Mobile Floating Action Menu
const MobileActionMenu: React.FC<{ buttons: ActionButtonConfig[]; isOpen: boolean; onToggle: () => void }> = ({ buttons, isOpen, onToggle }) => {
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onToggle();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "hidden"; // Prevent scrolling when menu is open
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onToggle]);

  return (
    <>
      {/* Backdrop overlay */}
      {isOpen && <div className="fixed inset-0 z-40 md:hidden" />}

      <div className="fixed bottom-4 right-4 z-50 md:hidden" ref={menuRef}>
        {/* Floating Action Button with animation */}
        <Button className={`w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 ${isOpen ? "bg-gray-600 hover:bg-gray-700 rotate-180" : "bg-teal-600 hover:bg-teal-700 rotate-0"}`} onClick={onToggle}>
          {isOpen ? <X className="!w-6 !h-6 text-white" /> : <Menu className="!w-6 !h-6 text-white" />}
        </Button>

        {/* Action Menu with animation */}
        <div className={`absolute bottom-full right-0 mb-2 transition-all duration-300 ease-in-out ${isOpen ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 translate-y-4 pointer-events-none"}`}>
          <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-2 w-48 max-h-fit overflow-y-auto">
            <div className="flex flex-col gap-1">
              {buttons.map((button, index) => (
                <Button
                  key={button.id || index}
                  variant="ghost"
                  className="justify-start h-12 px-4 py-3 text-sm rounded-md transition-colors"
                  onClick={() => {
                    button.onClick?.();
                    onToggle();
                  }}
                  disabled={button.disabled}
                  title={button.title}
                >
                  <button.icon className="w-4 h-4 mr-3" />
                  <span className="flex-1 text-left">{button.label}</span>
                  {button.badgeCount && button.badgeCount > 0 && <span className="ml-2 bg-red-500 text-white text-xs rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">{button.badgeCount > 99 ? "99+" : button.badgeCount}</span>}
                  {button.showIndicator && <div className={`w-2 h-2 ${button.indicatorColor || "bg-green-500"} rounded-full ml-2`}></div>}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

// Main ActionBar Component
const ActionBar: React.FC<ActionBarProps> = props => {
  const { hasPermission, hasRole } = usePermissions();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  let buttons: ActionButtonConfig[];
  let columns: number;
  let className: string;
  let isMobile: boolean;

  // Check if user has access to Back Office (Admin only)
  const canAccessBackOffice = hasRole(["admin"]);
  const canAccessReports = hasRole(["admin", "manager"]);

  const navigate = useNavigate();

  // Check if we're on mobile
  const [windowWidth, setWindowWidth] = useState(typeof window !== "undefined" ? window.innerWidth : 1024);

  React.useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  isMobile = windowWidth < 768;

  if (isLegacyProps(props)) {
    // Legacy mode - convert old props to new format
    const { onPrintReceipt, onVoidOrder, onShowReports, canPrintReceipt = false, canVoidOrder = false, onCancelOrder = () => {}, onShowPrinterSettings, hasSavedPrinter = false, savedPrinterName, isDayOpen = true, onCloseDayClick, currentDay } = props;

    buttons = [
      {
        id: "print",
        icon: Printer,
        label: "Print Receipt",
        active: canPrintReceipt,
        onClick: onPrintReceipt,
        disabled: !canPrintReceipt || !onPrintReceipt,
        requiredPermission: PERMISSIONS.POS_RECEIPTS
      },
      { id: "cancel", icon: X, label: "Cancel", active: false, onClick: onCancelOrder, disabled: !onCancelOrder },
      {
        id: "void",
        icon: Trash,
        label: "Void",
        active: canVoidOrder,
        onClick: onVoidOrder,
        disabled: !canVoidOrder || !onVoidOrder,
        className: canVoidOrder ? "!bg-transparent border border-red-500 text-red-600 hover:!bg-red-50 hover:text-red-700" : "",
        requiredPermission: PERMISSIONS.SALES_VOID
      },

      { id: "reports", icon: FileText, label: "Reports", active: false, onClick: onShowReports, disabled: !canAccessReports, requiredRole: ["admin", "manager"], requiredPermission: PERMISSIONS.REPORTS_READ },
      {
        id: "printer",
        icon: WifiCog,
        label: "Printer",
        active: false,
        onClick: onShowPrinterSettings,
        showIndicator: hasSavedPrinter,
        indicatorColor: "bg-green-500",
        title: hasSavedPrinter ? `Current: ${savedPrinterName}` : "Set default printer"
      },
      {
        id: "back-office",
        icon: Settings,
        label: "Back Office",
        active: false,
        disabled: !canAccessBackOffice,
        requiredRole: ["admin"],
        onClick: canAccessBackOffice ? () => navigate("/") : undefined,
        className: ""
      },
    ];
    columns = 8;
    className = "";
  } else {
    // New flexible mode
    buttons = props.buttons;
    columns = props.columns || Math.min(buttons.length, 8);
    className = props.className || "";
    isMobile = props.isMobile !== undefined ? props.isMobile : windowWidth < 768;
  }

  const visibleButtons = buttons.filter(button => {
    if (button.requiredPermission && !hasPermission(button.requiredPermission)) {
      return false;
    }
    if (button.requiredRole && !hasRole(button.requiredRole)) {
      return false;
    }
    return true;
  });

  // Update columns based on visible buttons
  const actualColumns = isLegacyProps(props) ? Math.min(visibleButtons.length, 7) : props.columns || Math.min(visibleButtons.length, 8);

  const actualGridStyle = {
    display: "grid",
    gridTemplateColumns: `repeat(${actualColumns}, 1fr)`
  };

  // For mobile view, show floating button instead of full bar
  if (isMobile) {
    return (
      <>
        {/* Hidden on mobile - we use the floating menu instead */}
        <div className="hidden md:block border-t border-gray-200 bg-gray-50 ${className}">
          <div style={actualGridStyle}>
            {visibleButtons.map((button, index) => (
              <ActionButton key={button.id || index} {...button} isMobile={isMobile} />
            ))}
          </div>
        </div>

        {/* Mobile floating action menu */}
        <MobileActionMenu buttons={visibleButtons} isOpen={isMobileMenuOpen} onToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)} />
      </>
    );
  }

  // Desktop view
  return (
    <div className={`border-t border-gray-200 bg-gray-50 ${className}`}>
      <div style={actualGridStyle}>
        {visibleButtons.map((button, index) => (
          <ActionButton key={button.id || index} {...button} isMobile={isMobile} />
        ))}
      </div>
    </div>
  );
};

// Utility function to create custom button configurations
export const createActionButton = (id: string, icon: LucideIcon, label: string, options: Partial<Omit<ActionButtonConfig, "id" | "icon" | "label">> = {}): ActionButtonConfig => ({
  id,
  icon,
  label,
  ...options
});

// Utility function to get default button by ID
export const getDefaultButton = (id: string): ActionButtonConfig | undefined => {
  return defaultActionButtons.find(button => button.id === id);
};

// Default export for React.lazy()
export default ActionBar;
