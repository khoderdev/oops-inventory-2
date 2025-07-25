import { Activity, BarChart3, Boxes, Calendar, ChevronDown, FileText, Home, Link as LinkIcon, LogOut, MapPin, Menu, Package, Settings, Shield, ShoppingCart, User, Users, X } from "lucide-react";
import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { PERMISSIONS } from "../../types/auth";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../ui/collapsible";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "../ui/dropdown-menu";

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
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openSections, setOpenSections] = useState<string[]>([]);

  const navigationItems: NavigationItem[] = [
    {
      label: "Dashboard",
      href: "/",
      icon: Home
    },
    {
      label: "Inventory",
      icon: Package,
      children: [
        {
          label: "Materials",
          href: "/materials",
          icon: Boxes,
          permission: PERMISSIONS.MATERIALS_READ
        },
        {
          label: "Stock Entries",
          href: "/stock",
          icon: Package,
          permission: PERMISSIONS.STOCK_READ
        },
        {
          label: "Sections",
          href: "/sections",
          icon: MapPin,
          permission: PERMISSIONS.SECTIONS_READ
        },
        {
          label: "Assignments",
          href: "/assignments",
          icon: LinkIcon,
          permission: PERMISSIONS.ASSIGNMENTS_READ
        }
      ]
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
  ];

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const toggleSection = (label: string) => {
    setOpenSections(prev => (prev.includes(label) ? prev.filter(section => section !== label) : [...prev, label]));
  };

  const isItemVisible = (item: NavigationItem): boolean => {
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
  };

  const isActiveLink = (href: string): boolean => {
    if (href === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(href);
  };

  const renderNavigationItem = (item: NavigationItem, level: number = 0) => {
    if (!isItemVisible(item)) {
      return null;
    }

    const hasChildren = item.children && item.children.length > 0;
    const isOpen = openSections.includes(item.label);
    const isActive = item.href ? isActiveLink(item.href) : false;

    if (hasChildren) {
      return (
        <Collapsible key={item.label} open={isOpen} onOpenChange={() => toggleSection(item.label)}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className={`w-full justify-between text-left font-normal ${level > 0 ? "pl-8" : "pl-4"} ${isActive ? "bg-blue-100 text-blue-900" : ""}`}>
              <div className="flex items-center gap-3">
                <item.icon className="h-4 w-4" />
                <span>{item.label}</span>
                {item.badge && (
                  <Badge variant={item.badgeVariant || "default"} className="text-xs">
                    {item.badge}
                  </Badge>
                )}
              </div>
              <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-1">{item.children?.map(child => renderNavigationItem(child, level + 1))}</CollapsibleContent>
        </Collapsible>
      );
    }

    return (
      <Link key={item.label} to={item.href!}>
        <Button variant="ghost" className={`w-full justify-start text-left font-normal ${level > 0 ? "pl-8" : "pl-4"} ${isActive ? "bg-blue-100 text-blue-900" : ""}`} onClick={() => setIsMobileMenuOpen(false)}>
          <item.icon className="h-4 w-4 mr-3" />
          <span>{item.label}</span>
          {item.badge && (
            <Badge variant={item.badgeVariant || "default"} className="ml-auto text-xs">
              {item.badge}
            </Badge>
          )}
        </Button>
      </Link>
    );
  };

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
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button variant="outline" size="sm" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>
      </div>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && <div className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40" onClick={() => setIsMobileMenuOpen(false)} />}

      {/* Sidebar */}
      <div className={`fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200 z-40 transform transition-transform duration-300 ease-in-out ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <Package className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="font-bold text-lg text-gray-900">oOps BackOffice</h1>
                <p className="text-xs text-gray-500">Inventory System</p>
              </div>
            </div>
          </div>

          {/* User Info */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-gray-900 truncate">{user?.fullName}</p>
                <p className="text-xs text-gray-500 truncate">@{user?.username}</p>
                <Badge className={`text-xs mt-1 ${getRoleBadgeColor(user?.role || "")}`}>{user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)}</Badge>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-1">{navigationItems.map(item => renderNavigationItem(item))}</nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="w-full justify-start">
                  <User className="h-4 w-4 mr-3" />
                  Account
                  <ChevronDown className="h-4 w-4 ml-auto" />
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
      </div>

      {/* Main Content Spacer */}
      <div className="lg:ml-64">{/* Content goes here */}</div>
    </>
  );
};

export default ProtectedNavigation;
