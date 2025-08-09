import { ChevronRight } from "lucide-react";
import React from "react";
import { useNavigate } from "react-router-dom";

export interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: React.ComponentType<{ className?: string }>;
  isActive?: boolean;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

const Breadcrumb: React.FC<BreadcrumbProps> = ({ items, className = "" }) => {
  const navigate = useNavigate();

  const handleItemClick = (item: BreadcrumbItem) => {
    if (item.href && !item.isActive) {
      navigate(item.href);
    }
  };

  return (
    <div className={`mb-6 flex items-center justify-between ${className}`}>
      <nav className="flex items-center space-x-2 text-sm" aria-label="Breadcrumb">
        <ol className="flex items-center space-x-2">
          {items.map((item, index) => {
            const isLast = index === items.length - 1;
            const Icon = item.icon;

            return (
              <li key={index} className="flex items-center">
                {index > 0 && <ChevronRight className="h-4 w-4 text-gray-400 mx-2 flex-shrink-0" />}

                <button
                  onClick={() => handleItemClick(item)}
                  disabled={item.isActive || !item.href}
                  className={`
                    flex items-center transition-colors duration-200
                    ${item.isActive || isLast ? "text-gray-900 font-medium cursor-default" : item.href ? "text-gray-600 hover:text-gray-900 cursor-pointer hover:underline" : "text-gray-500 cursor-default"}
                  `}
                  aria-current={item.isActive || isLast ? "page" : undefined}
                >
                  {Icon && <Icon className="h-4 w-4 mr-2 flex-shrink-0" />}
                  <span className="truncate max-w-[150px] sm:max-w-[200px] md:max-w-none">{item.label}</span>
                </button>
              </li>
            );
          })}
        </ol>
      </nav>
    </div>
  );
};

export default Breadcrumb;
