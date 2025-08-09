import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarMenuSub, SidebarMenuSubButton, SidebarMenuSubItem, useSidebar } from "@/components/ui/sidebar";
import { usePermissions } from "@/hooks/usePermissions";
import type { NavigationItem } from "@/types/inventory";
import { ChevronDown, LogOut, Shield, User } from "lucide-react";
import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { navigationItems } from "./navigationItems";

export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, hasRole, hasPermission } = usePermissions();
  const { state } = useSidebar();
  const [openSections, setOpenSections] = React.useState<string[]>([]);

  const isItemVisible = React.useCallback(
    (item: NavigationItem): boolean => {
      if (item.role && !hasRole(item.role)) {
        return false;
      }
      if (item.permission && !hasPermission(item.permission)) {
        return false;
      }
      if (item.children) {
        return item.children.some(child => isItemVisible(child));
      }
      return true;
    },
    [hasRole, hasPermission]
  );

  const isActiveLink = React.useCallback(
    (href: string): boolean => {
      if (href === "/") {
        return location.pathname === "/";
      }
      return location.pathname === href || location.pathname.startsWith(href + "/");
    },
    [location.pathname]
  );

  const hasActiveChild = React.useCallback(
    (item: NavigationItem): boolean => {
      if (!item.children) return false;
      return item.children.some(child => child.href && isActiveLink(child.href));
    },
    [isActiveLink]
  );

  const toggleSection = React.useCallback((section: string) => {
    setOpenSections(prev => (prev.includes(section) ? prev.filter(s => s !== section) : [...prev, section]));
  }, []);

  const visibleNavigationItems = React.useMemo(() => {
    return navigationItems.filter(item => isItemVisible(item));
  }, [isItemVisible]);

  const renderNavigationItem = (item: NavigationItem) => {
    if (!isItemVisible(item)) return null;

    const isActive = item.href ? isActiveLink(item.href) : false;
    const hasActiveChildren = hasActiveChild(item);

    if (item.children && item.children.length > 0) {
      const isOpen = openSections.includes(item.label);
      const visibleChildren = item.children.filter(child => isItemVisible(child));

      return (
        <SidebarMenuItem key={item.label}>
          {state === "expanded" ? (
            <Collapsible open={isOpen} onOpenChange={() => toggleSection(item.label)}>
              <CollapsibleTrigger asChild>
                <SidebarMenuButton isActive={hasActiveChildren} className="w-full justify-start transition-all duration-200 group" tooltip={state === "expanded" ? item.label : undefined}>
                  <div className="flex items-center gap-2.5 w-full">
                    <item.icon className="h-5 w-5 flex-shrink-0" />
                    <span className="truncate">{item.label}</span>
                    {item.badge && (
                      <Badge variant={item.badgeVariant || "default"} className="ml-auto text-xs px-1.5 py-0.5">
                        {item.badge}
                      </Badge>
                    )}
                    <ChevronDown className={`h-4 w-4 ml-auto transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
                  </div>
                </SidebarMenuButton>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarMenuSub>
                  {visibleChildren.map(child => (
                    <SidebarMenuSubItem key={child.label}>
                      <SidebarMenuSubButton asChild isActive={child.href ? isActiveLink(child.href) : false}>
                        <Link to={child.href!}>
                          <child.icon className="h-5 w-5" />
                          <span className="truncate">{child.label}</span>
                          {child.badge && (
                            <Badge variant={child.badgeVariant || "default"} className="ml-auto text-xs px-1.5 py-0.5">
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
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton isActive={hasActiveChildren} className="w-full justify-center transition-all duration-200 group" tooltip={item.label}>
                  <div className="flex items-center justify-center gap-2.5 w-full">
                    <item.icon className="h-5 w-5 flex-shrink-0" />
                    {item.badge && (
                      <Badge variant={item.badgeVariant || "default"} className="absolute top-0 right-0 text-xs px-1.5 py-0.5">
                        {item.badge}
                      </Badge>
                    )}
                  </div>
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" side="right" className="w-56 z-popover">
                <DropdownMenuLabel className="font-normal">{item.label}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {visibleChildren.map(child => (
                  <DropdownMenuItem key={child.label} asChild className="transition-all duration-200">
                    <Link to={child.href!} className={`flex items-center gap-2 ${child.href && isActiveLink(child.href) ? "bg-sidebar-accent text-sidebar-accent-foreground" : ""}`}>
                      <child.icon className="h-4 w-4" />
                      <span className="truncate">{child.label}</span>
                      {child.badge && (
                        <Badge variant={child.badgeVariant || "default"} className="ml-auto text-xs px-1.5 py-0.5">
                          {child.badge}
                        </Badge>
                      )}
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </SidebarMenuItem>
      );
    }

    return (
      <SidebarMenuItem key={item.label}>
        <SidebarMenuButton asChild isActive={isActive} tooltip={state === "collapsed" ? item.label : undefined} className="group">
          <Link to={item.href!}>
            <div className="flex items-center gap-2.5 w-full justify-start group-data-[state=collapsed]:justify-center">
              <item.icon className="h-5 w-5 flex-shrink-0" />
              <span className="truncate group-data-[state=collapsed]:hidden">{item.label}</span>
              {item.badge && state === "expanded" && (
                <Badge variant={item.badgeVariant || "default"} className="ml-auto text-xs px-1.5 py-0.5 group-data-[state=collapsed]:hidden">
                  {item.badge}
                </Badge>
              )}
              {item.badge && state === "collapsed" && (
                <Badge variant={item.badgeVariant || "default"} className="absolute top-0 right-0 text-xs px-1.5 py-0.5">
                  {item.badge}
                </Badge>
              )}
            </div>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  };

  return (
    <Sidebar className="border-r border-sidebar-border transition-all duration-300 ease-in-out">
      <SidebarHeader className="border-b border-sidebar-border h-16 flex items-center justify-center">
        <div className="flex items-center justify-center transition-all duration-300 ease-in-out">
          <div className="relative flex items-center justify-center">{state === "expanded" ? <img onClick={() => navigate("/")} src="/oops-logo.png" alt="Restaurant Management System" className="w-36 h-auto transition-all duration-300 crisp-edges" /> : <img onClick={() => navigate("/")} src="/oops-icon.png" alt="POS" className="w-28" />}</div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>{visibleNavigationItems.map(item => renderNavigationItem(item))}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton className="w-full transition-all duration-200 hover:bg-sidebar-accent group">
                  <div className="flex items-center gap-3 w-full justify-start group-data-[state=collapsed]:justify-center">
                    <div className="w-9 h-9 bg-primary rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300">
                      <span className="text-primary-foreground text-base font-medium">{user?.firstName?.charAt(0)?.toUpperCase() || "U"}</span>
                    </div>
                    {state === "expanded" && (
                      <div className="flex-1 text-left min-w-0">
                        <p className="text-sm font-medium text-sidebar-foreground truncate">{user?.fullName || "User"}</p>
                        <p className="text-xs text-muted-foreground truncate">{user?.username}</p>
                      </div>
                    )}
                  </div>
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 z-popover">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user?.fullName || "User"}</p>
                    <p className="text-xs leading-none text-muted-foreground">@{user?.username}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/profile")} className="cursor-pointer transition-all duration-200">
                  <User className="mr-2 h-4 w-4" />
                  Profile Settings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/profile/sessions")} className="cursor-pointer transition-all duration-200">
                  <Shield className="mr-2 h-4 w-4" />
                  Active Sessions
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="text-destructive hover:bg-destructive/10 hover:text-destructive cursor-pointer transition-all duration-200">
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
