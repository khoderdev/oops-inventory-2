import { Activity, BarChart3, Boxes, Calendar, FileText, Home, LinkIcon, MapPin, Package, Settings, Shield, ShoppingCart, Users } from "lucide-react";
import { useMemo } from "react";
import { useLocation } from "react-router-dom";
import { BreadcrumbItem } from "../components/navigation/Breadcrumb";

interface RouteConfig {
  path: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  parent?: string;
}

const routeConfigs: RouteConfig[] = [
  // Root
  { path: "/", label: "Dashboard", icon: Home },

  // Inventory
  { path: "/materials", label: "Materials", icon: Boxes, parent: "/" },
  { path: "/stock", label: "Stock Entries", icon: Package, parent: "/" },
  { path: "/sections", label: "Sections", icon: MapPin, parent: "/" },
  { path: "/assignments", label: "Assignments", icon: LinkIcon, parent: "/" },

  // Sales
  { path: "/pos", label: "POS System", icon: ShoppingCart, parent: "/" },
  { path: "/sales", label: "Sales History", icon: FileText, parent: "/" },
  { path: "/sales-history", label: "Sales History", icon: FileText, parent: "/" },
  { path: "/menu-items", label: "Menu Items", icon: Package, parent: "/" },

  // Operations
  { path: "/day-operations", label: "Day Operations", icon: Calendar, parent: "/" },

  // Reports & Analytics
  { path: "/reports", label: "Reports", icon: BarChart3, parent: "/" },
  { path: "/analytics", label: "Analytics", icon: Activity, parent: "/" },

  // Administration
  { path: "/admin", label: "Administration", icon: Shield, parent: "/" },
  { path: "/admin/users", label: "User Management", icon: Users, parent: "/admin" },
  { path: "/admin/settings", label: "System Settings", icon: Settings, parent: "/admin" },

  // Profile
  { path: "/profile", label: "Profile Settings", icon: Users, parent: "/" },
  { path: "/profile/sessions", label: "Active Sessions", icon: Shield, parent: "/profile" }
];

export const useBreadcrumb = (): BreadcrumbItem[] => {
  const location = useLocation();

  return useMemo(() => {
    const currentPath = location.pathname;

    // Find the current route config
    const currentRoute = routeConfigs.find(route => route.path === currentPath || (route.path !== "/" && currentPath.startsWith(route.path)));

    if (!currentRoute) {
      // Fallback for unknown routes
      return [
        { label: "Dashboard", href: "/", icon: Home },
        { label: "Unknown Page", isActive: true }
      ];
    }

    // Build breadcrumb trail
    const breadcrumbItems: BreadcrumbItem[] = [];

    // Helper function to build the trail recursively
    const buildTrail = (route: RouteConfig) => {
      if (route.parent) {
        const parentRoute = routeConfigs.find(r => r.path === route.parent);
        if (parentRoute) {
          buildTrail(parentRoute);
        }
      }

      breadcrumbItems.push({
        label: route.label,
        href: route.path,
        icon: route.icon,
        isActive: route.path === currentPath
      });
    };

    buildTrail(currentRoute);

    // Handle special cases for dynamic routes
    if (currentPath.includes("/edit/") || currentPath.includes("/view/")) {
      const action = currentPath.includes("/edit/") ? "Edit" : "View";
      breadcrumbItems.push({
        label: action,
        isActive: true
      });
    }

    return breadcrumbItems;
  }, [location.pathname]);
};

// Helper hook for custom breadcrumbs
export const useCustomBreadcrumb = (customItems: BreadcrumbItem[]): BreadcrumbItem[] => {
  return useMemo(() => {
    // Always start with home
    const items: BreadcrumbItem[] = [{ label: "Dashboard", href: "/", icon: Home }];

    // Add custom items
    items.push(...customItems);

    return items;
  }, [customItems]);
};
