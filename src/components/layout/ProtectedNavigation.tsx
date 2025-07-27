import { Activity, BarChart3, Calendar, ChevronDown, ChevronLeft, ChevronRight, FileText, Home, LogOut, Menu, Package, Settings, Shield, ShoppingCart, User, Users, X } from "lucide-react";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useSidebar } from "../../contexts/SidebarContext";
import { PERMISSIONS } from "../../types/auth";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../ui/collapsible";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "../ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";

interface NavigationItem {
  label: string;
  href?: string;
  icon: React.ComponentType<{ className?: string }>;
  permission?: string;
  role?: string | string[];
  children?: NavigationItem[];
  badge?: string;
  badgeVariant?: "default" | "destructive" | "secondary";
}

const ProtectedNavigation: React.FC = () => {
  const { user, logout, hasPermission, hasRole } = useAuth();
  const { isCollapsed, isMobileMenuOpen, toggleCollapse, closeMobileMenu, toggleMobileMenu } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  const [openSections, setOpenSections] = useState<string[]>([]);

  // Memoized navigation items to prevent re-renders
  const navigationItems: NavigationItem[] = useMemo(
    () => [
      {
        label: "Dashboard",
        href: "/",
        icon: Home
      },
      {
        label: "Inventory",
        icon: Package,
        href: "/inventory"
      },
      {
        label: "Sales",
        icon: ShoppingCart,
        children: [
          {
            label: "POS System",
            href: "/pos",
            icon: ShoppingCart,
            permission: PERMISSIONS.SALES_CREATE
          },
          {
            label: "Sales History",
            href: "/sales",
            icon: FileText,
            permission: PERMISSIONS.SALES_READ
          },
          {
            label: "Menu Items",
            href: "/menu-items",
            icon: Package,
            permission: PERMISSIONS.MENU_ITEMS_READ
          }
        ]
      },
      {
        label: "Operations",
        icon: Calendar,
        children: [
          {
            label: "Day Operations",
            href: "/day-operations",
            icon: Calendar,
            permission: PERMISSIONS.DAY_OPERATIONS_READ
          }
        ]
      },
      {
        label: "Reports",
        href: "/reports",
        icon: BarChart3,
        permission: PERMISSIONS.REPORTS_READ
      },
      {
        label: "Analytics",
        href: "/analytics",
        icon: Activity,
        permission: PERMISSIONS.ANALYTICS_READ
      },
      {
        label: "Administration",
        icon: Shield,
        role: ["admin", "manager"],
        children: [
          {
            label: "User Management",
            href: "/admin/users",
            icon: Users,
            permission: PERMISSIONS.USERS_READ,
            badge: "Admin",
            badgeVariant: "destructive"
          },
          {
            label: "System Settings",
            href: "/admin/settings",
            icon: Settings,
            permission: PERMISSIONS.SYSTEM_SETTINGS,
            badge: "Admin",
            badgeVariant: "destructive"
          }
        ]
      }
    ],
    []
  );

  // Performance optimizations with useCallback
  const handleLogout = useCallback(async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  }, [logout, navigate]);

  const toggleSection = useCallback((label: string) => {
    setOpenSections(prev => (prev.includes(label) ? prev.filter(section => section !== label) : [...prev, label]));
  }, []);

  // Auto-close mobile menu on route change
  useEffect(() => {
    closeMobileMenu();
  }, [location.pathname, closeMobileMenu]);

  // Memoized visibility check for performance
  const isItemVisible = useCallback(
    (item: NavigationItem): boolean => {
      // Check role requirement
      if (item.role && !hasRole(item.role)) {
        return false;
      }

      // Check permission requirement
      if (item.permission && !hasPermission(item.permission)) {
        return false;
      }

      // If item has children, check if any child is visible
      if (item.children) {
        return item.children.some(child => isItemVisible(child));
      }

      return true;
    },
    [hasRole, hasPermission]
  );

  const isActiveLink = useCallback(
    (href: string): boolean => {
      if (href === "/") {
        return location.pathname === "/";
      }
      return location.pathname.startsWith(href);
    },
    [location.pathname]
  );

  // Memoized filtered navigation items
  const visibleNavigationItems = useMemo(() => {
    return navigationItems.filter(item => isItemVisible(item));
  }, [navigationItems, isItemVisible]);

  const renderNavigationItem = useCallback(
    (item: NavigationItem, level: number = 0) => {
      if (!isItemVisible(item)) {
        return null;
      }

      const hasChildren = item.children && item.children.length > 0;
      const isOpen = openSections.includes(item.label);
      const isActive = item.href ? isActiveLink(item.href) : false;
      const paddingClass = level > 0 ? "pl-8" : "pl-3";

      // Tooltip wrapper for collapsed state
      const TooltipWrapper = ({ children, content }: { children: React.ReactNode; content: string }) => {
        if (isCollapsed && level === 0) {
          return (
            <Tooltip>
              <TooltipTrigger asChild>{children}</TooltipTrigger>
              <TooltipContent side="right" className="ml-2">
                <p>{content}</p>
              </TooltipContent>
            </Tooltip>
          );
        }
        return <>{children}</>;
      };

      if (hasChildren) {
        return (
          <TooltipWrapper key={item.label} content={item.label}>
            <Collapsible open={isOpen} onOpenChange={() => toggleSection(item.label)}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className={`w-full justify-between text-left font-normal ${paddingClass} ${isActive ? "bg-blue-100 text-blue-900" : "hover:bg-gray-100"}`}>
                  <div className="flex items-center gap-3">
                    <item.icon className="h-4 w-4 flex-shrink-0" />
                    {!isCollapsed && (
                      <>
                        <span className="truncate">{item.label}</span>
                        {item.badge && (
                          <Badge variant={item.badgeVariant || "default"} className="text-xs">
                            {item.badge}
                          </Badge>
                        )}
                      </>
                    )}
                  </div>
                  {!isCollapsed && <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />}
                </Button>
              </CollapsibleTrigger>
              {!isCollapsed && <CollapsibleContent className="space-y-1">{item.children?.map(child => renderNavigationItem(child, level + 1))}</CollapsibleContent>}
            </Collapsible>
          </TooltipWrapper>
        );
      }

      return (
        <TooltipWrapper key={item.label} content={item.label}>
          <Link to={item.href!}>
            <Button variant="ghost" className={`w-full justify-start text-left font-normal ${paddingClass} ${isActive ? "bg-blue-100 text-blue-900" : "hover:bg-gray-100"}`} onClick={closeMobileMenu}>
              <item.icon className="h-4 w-4 mr-3 flex-shrink-0" />
              {!isCollapsed && (
                <>
                  <span className="truncate">{item.label}</span>
                  {item.badge && (
                    <Badge variant={item.badgeVariant || "default"} className="ml-auto text-xs">
                      {item.badge}
                    </Badge>
                  )}
                </>
              )}
            </Button>
          </Link>
        </TooltipWrapper>
      );
    },
    [isItemVisible, openSections, isActiveLink, toggleSection, closeMobileMenu, isCollapsed]
  );

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-red-100 text-red-800";
      case "manager":
        return "bg-blue-100 text-blue-800";
      case "staff":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <Button variant="outline" size="sm" onClick={toggleMobileMenu} className="lg:hidden fixed top-4 left-4 z-50 shadow-lg bg-white hover:bg-gray-50">
        {isMobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
      </Button>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && <div className="lg:hidden fixed inset-0 bg-black/50 z-30" onClick={closeMobileMenu} />}

      {/* Sidebar */}
      <aside
        className={`
        fixed top-0 left-0 z-40 h-screen bg-white border-r border-gray-200 shadow-lg
        transition-all duration-300 ease-in-out
        ${isCollapsed ? "w-16" : "w-64"}
        ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}
      >
        {/* Collapse Toggle Button */}
        <div className="hidden lg:block absolute -right-3 top-6 z-50">
          <Button variant="outline" size="sm" onClick={toggleCollapse} className="h-6 w-6 p-0 rounded-full bg-white shadow-md hover:shadow-lg transition-all duration-200">
            {isCollapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
          </Button>
        </div>

        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-2 flex items-center justify-center border-b border-gray-200">
            <img src="oops-logo.png" alt="oops-logo" className="w-36" />
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-4">
            <div className="space-y-1 px-3">{visibleNavigationItems.map(item => renderNavigationItem(item))}</div>
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="w-full justify-start">
                  <User className="h-4 w-4 mr-3" />
                  {!isCollapsed && (
                    <>
                      <span>Account</span>
                      <ChevronDown className="h-4 w-4 ml-auto" />
                    </>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/profile")}>
                  <User className="mr-2 h-4 w-4" />
                  Profile Settings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/profile/sessions")}>
                  <Shield className="mr-2 h-4 w-4" />
                  Active Sessions
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </aside>
    </>
  );
};

export default ProtectedNavigation;
