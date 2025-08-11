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
  
  // Force expanded state on mobile
  const [isMobile, setIsMobile] = React.useState(false);
  
  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024); // lg breakpoint
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  const effectiveState = isMobile ? "expanded" : state;

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
          {effectiveState === "expanded" ? (
            <Collapsible open={isOpen} onOpenChange={() => toggleSection(item.label)}>
              <CollapsibleTrigger asChild>
                <SidebarMenuButton isActive={hasActiveChildren} className="w-full justify-start transition-all duration-200 group min-h-[44px] px-3" tooltip={undefined}>
                  <div className="flex items-center gap-2 sm:gap-2.5 w-full min-w-0">
                    <item.icon className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                    <span className="truncate text-xs sm:text-sm">{item.label}</span>
                    {item.badge && (
                      <Badge variant={item.badgeVariant || "default"} className="ml-auto text-xs px-1.5 py-0.5 flex-shrink-0">
                        {item.badge}
                      </Badge>
                    )}
                    <ChevronDown className={`h-3 w-3 sm:h-4 sm:w-4 ml-auto flex-shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
                  </div>
                </SidebarMenuButton>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarMenuSub className="ml-2 sm:ml-4">
                  {visibleChildren.map(child => (
                    <SidebarMenuSubItem key={child.label}>
                      <SidebarMenuSubButton asChild isActive={child.href ? isActiveLink(child.href) : false} className="min-h-[40px] px-3">
                        <Link to={child.href!} className="flex items-center gap-2 sm:gap-2.5 w-full min-w-0">
                          <child.icon className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                          <span className="truncate text-xs sm:text-sm">{child.label}</span>
                          {child.badge && (
                            <Badge variant={child.badgeVariant || "default"} className="ml-auto text-xs px-1.5 py-0.5 flex-shrink-0">
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
                <SidebarMenuButton isActive={hasActiveChildren} className="w-full justify-center transition-all duration-200 group min-h-[44px] relative" tooltip={item.label}>
                  <div className="flex items-center justify-center gap-2.5 w-full">
                    <item.icon className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                    {item.badge && (
                      <Badge variant={item.badgeVariant || "default"} className="absolute -top-1 -right-1 text-xs px-1.5 py-0.5 min-w-[20px] h-5">
                        {item.badge}
                      </Badge>
                    )}
                  </div>
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" side="right" className="w-56 z-popover ml-2" sideOffset={8}>
                <DropdownMenuLabel className="font-normal flex items-center gap-2">
                  <item.icon className="h-4 w-4 flex-shrink-0" />
                  {item.label}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {visibleChildren.map(child => (
                  <DropdownMenuItem key={child.label} asChild className="transition-all duration-200 cursor-pointer">
                    <Link to={child.href!} className={`flex items-center gap-2 min-w-0 ${child.href && isActiveLink(child.href) ? "bg-sidebar-accent text-sidebar-accent-foreground" : ""}`}>
                      <child.icon className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate">{child.label}</span>
                      {child.badge && (
                        <Badge variant={child.badgeVariant || "default"} className="ml-auto text-xs px-1.5 py-0.5 flex-shrink-0">
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
        <SidebarMenuButton asChild isActive={isActive} tooltip={state === "collapsed" ? item.label : undefined} className="group min-h-[44px] px-3 relative">
          <Link to={item.href!}>
            <div className="flex items-center gap-2 sm:gap-2.5 w-full justify-start group-data-[state=collapsed]:justify-center min-w-0">
              <item.icon className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
              <span className="truncate group-data-[state=collapsed]:hidden text-xs sm:text-sm">{item.label}</span>
              {item.badge && effectiveState === "expanded" && (
                <Badge variant={item.badgeVariant || "default"} className="ml-auto text-xs px-1.5 py-0.5 group-data-[state=collapsed]:hidden flex-shrink-0">
                  {item.badge}
                </Badge>
              )}
              {item.badge && effectiveState === "collapsed" && (
                <Badge variant={item.badgeVariant || "default"} className="absolute -top-1 -right-1 text-xs px-1.5 py-0.5 min-w-[20px] h-5">
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
      <SidebarHeader className="border-b border-sidebar-border h-16 flex items-center justify-center px-2 sm:px-4">
        <div className="flex items-center justify-center transition-all duration-300 ease-in-out w-full">
          <div className="relative flex items-center justify-center cursor-pointer" onClick={() => navigate("/")}>
            {effectiveState === "expanded" ? (
              <img 
                src="/oops-logo.png" 
                alt="Restaurant Management System" 
                className="w-28 sm:w-32 lg:w-36 h-auto transition-all duration-300 crisp-edges max-w-full" 
              />
            ) : (
              <img 
                src="/oops-icon.png" 
                alt="POS" 
                className="w-8 sm:w-10 lg:w-12 h-auto transition-all duration-300 crisp-edges" 
              />
            )}
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="overflow-y-auto scrollbar-thin scrollbar-thumb-sidebar-border scrollbar-track-transparent">
        <SidebarGroup className="px-2 sm:px-3">
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">{visibleNavigationItems.map(item => renderNavigationItem(item))}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-2 sm:p-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton className="w-full transition-all duration-200 hover:bg-sidebar-accent group min-h-[52px] px-3">
                  <div className="flex items-center gap-2 sm:gap-3 w-full justify-start group-data-[state=collapsed]:justify-center min-w-0">
                    <div className="w-8 h-8 sm:w-9 sm:h-9 bg-primary rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300">
                      <span className="text-primary-foreground text-sm sm:text-base font-medium">{user?.firstName?.charAt(0)?.toUpperCase() || "U"}</span>
                    </div>
                    {effectiveState === "expanded" && (
                      <div className="flex-1 text-left min-w-0">
                        <p className="text-xs sm:text-sm font-medium text-sidebar-foreground truncate">{user?.fullName || "User"}</p>
                        <p className="text-[10px] sm:text-xs text-muted-foreground truncate">@{user?.username}</p>
                      </div>
                    )}
                  </div>
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 sm:w-64 z-popover mb-2" sideOffset={8}>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none truncate">{user?.fullName || "User"}</p>
                    <p className="text-xs leading-none text-muted-foreground truncate">@{user?.username}</p>
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
