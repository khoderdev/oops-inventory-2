import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarMenuSub, SidebarMenuSubButton, SidebarMenuSubItem, useSidebar } from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/AuthContext";
import type { NavigationItem } from "@/types/inventory";
import { ChevronDown, ChevronRight, LogOut, Shield, User } from "lucide-react";
import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { navigationItems } from "./navigationItems";

export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, hasRole, hasPermission } = useAuth();
  const { state } = useSidebar();
  const [openSections, setOpenSections] = React.useState<string[]>([]);

  // Check if an item should be visible based on permissions
  const isItemVisible = React.useCallback(
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

  // Check if a link is active
  const isActiveLink = React.useCallback(
    (href: string): boolean => {
      if (href === "/") {
        return location.pathname === "/";
      }
      return location.pathname === href || location.pathname.startsWith(href + "/");
    },
    [location.pathname]
  );

  // Check if any child of an item is active
  const hasActiveChild = React.useCallback(
    (item: NavigationItem): boolean => {
      if (!item.children) return false;
      return item.children.some(child => child.href && isActiveLink(child.href));
    },
    [isActiveLink]
  );

  // Toggle section open/close
  const toggleSection = React.useCallback((section: string) => {
    setOpenSections(prev => (prev.includes(section) ? prev.filter(s => s !== section) : [...prev, section]));
  }, []);

  // Filter visible navigation items
  const visibleNavigationItems = React.useMemo(() => {
    return navigationItems.filter(item => isItemVisible(item));
  }, [isItemVisible]);

  // Render navigation item
  const renderNavigationItem = (item: NavigationItem) => {
    if (!isItemVisible(item)) return null;

    const isActive = item.href ? isActiveLink(item.href) : false;
    const hasActiveChildren = hasActiveChild(item);

    // Item with children (collapsible)
    if (item.children && item.children.length > 0) {
      const isOpen = openSections.includes(item.label);
      const visibleChildren = item.children.filter(child => isItemVisible(child));

      return (
        <SidebarMenuItem key={item.label}>
          <Collapsible open={isOpen} onOpenChange={() => toggleSection(item.label)}>
            <CollapsibleTrigger asChild>
              <SidebarMenuButton isActive={hasActiveChildren} className="w-full justify-between" tooltip={state === "collapsed" ? item.label : undefined}>
                <div className="flex items-center gap-2">
                  <item.icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <Badge variant={item.badgeVariant || "default"} className="text-xs">
                    {item.badge}
                  </Badge>
                )}
                <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
              </SidebarMenuButton>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarMenuSub>
                {visibleChildren.map(child => (
                  <SidebarMenuSubItem key={child.label}>
                    <SidebarMenuSubButton asChild isActive={child.href ? isActiveLink(child.href) : false}>
                      <Link to={child.href!}>
                        <child.icon className="h-4 w-4" />
                        <span>{child.label}</span>
                        {child.badge && (
                          <Badge variant={child.badgeVariant || "default"} className="ml-auto text-xs">
                            {child.badge}
                          </Badge>
                        )}
                      </Link>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                ))}
              </SidebarMenuSub>
            </CollapsibleContent>
          </Collapsible>
        </SidebarMenuItem>
      );
    }

    // Regular item (no children)
    return (
      <SidebarMenuItem key={item.label}>
        <SidebarMenuButton asChild isActive={isActive} tooltip={state === "collapsed" ? item.label : undefined}>
          <Link to={item.href!}>
            <item.icon className="h-4 w-4" />
            <span>{item.label}</span>
            {item.badge && (
              <Badge variant={item.badgeVariant || "default"} className="ml-auto text-xs">
                {item.badge}
              </Badge>
            )}
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  };

  return (
    <Sidebar>
      {/* Header */}
      <SidebarHeader>
        <div className="flex items-center justify-center py-2">
          <div className="flex items-center justify-center">
            <div className="relative flex items-center justify-center">{state === "expanded" && <img src={"/oops-logo.png"} alt="Logo" className="w-44" />}</div>
          </div>
        </div>
      </SidebarHeader>

      {/* Navigation Content */}
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>{visibleNavigationItems.map(item => renderNavigationItem(item))}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton className="w-full">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-teal-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-medium">{user?.firstName?.charAt(0)?.toUpperCase() || "U"}</span>
                    </div>
                    {state === "expanded" && (
                      <div className="flex-1 text-left">
                        <p className="text-sm font-medium">{user?.fullName || "User"}</p>
                        <p className="text-xs text-gray-500">{user?.username}</p>
                      </div>
                    )}
                  </div>
                  <ChevronRight className="h-4 w-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
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
                <DropdownMenuItem onClick={logout} className="text-red-600 hover:bg-red-50 hover:text-red-700">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
