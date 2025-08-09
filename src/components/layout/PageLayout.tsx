import React from "react";
import { useSidebar } from "../../contexts/SidebarContext";
import { useBreadcrumb } from "../../hooks/useBreadcrumb";
import Breadcrumb, { BreadcrumbItem } from "../navigation/Breadcrumb";

interface PageLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  customBreadcrumb?: BreadcrumbItem[];
  className?: string;
  headerActions?: React.ReactNode;
  fullWidth?: boolean;
}

const PageLayout: React.FC<PageLayoutProps> = ({ children, title, subtitle, customBreadcrumb, className = "", headerActions, fullWidth = false }) => {
  const { isCollapsed } = useSidebar();
  const defaultBreadcrumb = useBreadcrumb();
  const breadcrumbItems = customBreadcrumb || defaultBreadcrumb;

  return (
    <div className={`min-h-screen bg-gray-50 ${className}`}>
      <div
        className={`
          transition-all duration-300 ease-in-out
          ${isCollapsed ? "lg:ml-16" : "lg:ml-64"}
          pt-16 lg:pt-0
        `}
      >
        <div className={`${fullWidth ? "w-full" : "max-w-7xl mx-auto"} px-4 sm:px-6 lg:px-8 py-6 lg:py-8`}>
          {/* Breadcrumb Navigation */}
          <Breadcrumb items={breadcrumbItems} />

          {/* Page Header */}
          {(title || headerActions) && (
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="min-w-0 flex-1">
                {title && <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 truncate">{title}</h1>}
                {subtitle && <p className="mt-1 text-sm text-gray-600">{subtitle}</p>}
              </div>
              {headerActions && <div className="flex items-center gap-2 flex-shrink-0">{headerActions}</div>}
            </div>
          )}

          {/* Page Content */}
          <div className="space-y-6">{children}</div>
        </div>
      </div>
    </div>
  );
};

export default PageLayout;
