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

interface SideBarHeaderProps {
  onMobileMenuItemClick?: () => void;
}

export function SideBarHeader({ onMobileMenuItemClick }: SideBarHeaderProps = {}) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, hasRole, hasPermission } = usePermissions();
  const { state, isMobile } = useSidebar();
  const [openSections, setOpenSections] = React.useState<string[]>([]);
  
  // Force expanded state on mobile
  const [isLargeMobile, setIsLargeMobile] = React.useState(false);
  
  React.useEffect(() => {
    const checkMobile = () => {
      setIsLargeMobile(window.innerWidth < 1024); // lg breakpoint
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);


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
      return item.children.some(child => {
        if (child.href && isActiveLink(child.href)) {
          return true;
        }
        // Also check nested children if any
        if (child.children) {
          return child.children.some(grandchild => grandchild.href && isActiveLink(grandchild.href));
        }
        return false;
      });
    },
    [isActiveLink]
  );
  
  // Auto-expand sections with active submenu items and ensure they stay expanded
  React.useEffect(() => {
    // Ensure this effect runs after all dependencies are properly initialized
    if (!location.pathname) return;
    
    try {
      // Find all sections that have active children
      const activeMenuSections = navigationItems
        .filter(item => {
          // Check if this item has any active children
          if (!item.children) return false;
          
          // Check each child to see if it's active
          return item.children.some(child => {
            // Direct match for child
            if (child.href && isActiveLink(child.href)) return true;
            
            // Check nested children if any
            if (child.children) {
              return child.children.some(grandchild => 
                grandchild.href && isActiveLink(grandchild.href)
              );
            }
            
            return false;
          });
        })
        .map(item => item.label);
      
      // If we found active sections, make sure they're expanded
      if (activeMenuSections.length > 0) {
        setOpenSections(prev => {
          const newSections = [...prev];
          activeMenuSections.forEach(section => {
            if (!newSections.includes(section)) {
              newSections.push(section);
            }
          });
          return newSections;
        });
      }
    } catch (error) {
      console.error('Error in auto-expand effect:', error);
    }
  }, [location.pathname, isActiveLink, navigationItems]);
  
  const effectiveState = isLargeMobile ? "expanded" : state;

  // Handle menu item clicks on mobile
  const handleMenuItemClick = React.useCallback(() => {
    if (isMobile && onMobileMenuItemClick) {
      onMobileMenuItemClick();
    }
  }, [isMobile, onMobileMenuItemClick]);

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
                <SidebarMenuButton isActive={isActive || hasActiveChildren} className="w-full justify-start transition-all duration-300 ease-in-out group min-h-[40px] px-3 hover:bg-gray-200 rounded-lg text-gray-700 data-[active=true]:bg-blue-100 data-[active=true]:text-blue-700 data-[active=true]:font-medium" tooltip={undefined}>
                  <div className="flex items-center gap-3 w-full min-w-0">
                    <item.icon className="h-5 w-5 flex-shrink-0" />
                    <span className="truncate text-sm font-medium">{item.label}</span>
                    {item.badge && (
                      <Badge variant={item.badgeVariant || "default"} className="ml-auto text-xs px-2 py-0.5 flex-shrink-0 bg-blue-100 text-blue-700 border-0">
                        {item.badge}
                      </Badge>
                    )}
                    <ChevronDown className={`h-4 w-4 ml-auto flex-shrink-0 transition-transform duration-200 text-gray-500 ${isOpen ? "rotate-180" : ""}`} />
                  </div>
                </SidebarMenuButton>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarMenuSub className="ml-6">
                  {visibleChildren.map(child => (
                    <SidebarMenuSubItem key={child.label}>
                      <SidebarMenuSubButton asChild isActive={child.href ? isActiveLink(child.href) : false} className="min-h-[36px] px-3 hover:bg-gray-200 rounded-lg text-gray-600 data-[active=true]:bg-blue-100 data-[active=true]:text-blue-700 data-[active=true]:font-medium transition-all duration-300 ease-in-out">
                        <Link to={child.href!} onClick={handleMenuItemClick} className="flex items-center gap-3 w-full min-w-0">
                          <child.icon className="h-4 w-4 flex-shrink-0" />
                          <span className="truncate text-sm">{child.label}</span>
                          {child.badge && (
                            <Badge variant={child.badgeVariant || "default"} className="ml-auto text-xs px-2 py-0.5 flex-shrink-0 bg-blue-100 text-blue-700 border-0">
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
                <SidebarMenuButton isActive={isActive || hasActiveChildren} className="w-full justify-center transition-all duration-300 ease-in-out group min-h-[44px] relative" tooltip={item.label}>
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
                    <Link to={child.href!} onClick={handleMenuItemClick} className={`flex items-center gap-2 min-w-0 ${child.href && isActiveLink(child.href) ? "bg-sidebar-accent text-sidebar-accent-foreground" : ""}`}>
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
        <SidebarMenuButton asChild isActive={isActive} tooltip={state === "collapsed" ? item.label : undefined} className="group min-h-[40px] px-3 relative hover:bg-gray-200 rounded-lg text-gray-700 data-[active=true]:bg-blue-100 data-[active=true]:text-blue-700">
          <Link to={item.href!} onClick={handleMenuItemClick}>
            <div className="flex items-center gap-3 w-full justify-start group-data-[state=collapsed]:justify-center min-w-0">
              <item.icon className="h-5 w-5 flex-shrink-0" />
              <span className="truncate group-data-[state=collapsed]:hidden text-sm font-medium">{item.label}</span>
              {item.badge && effectiveState === "expanded" && (
                <Badge variant={item.badgeVariant || "default"} className="ml-auto text-xs px-2 py-0.5 group-data-[state=collapsed]:hidden flex-shrink-0 bg-blue-100 text-blue-700 border-0">
                  {item.badge}
                </Badge>
              )}
              {item.badge && effectiveState === "collapsed" && (
                <Badge variant={item.badgeVariant || "default"} className="absolute -top-1 -right-1 text-xs px-1.5 py-0.5 min-w-[20px] h-5 bg-blue-600 text-white">
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
    <Sidebar className="border-r border-gray-200 transition-all duration-300 ease-in-out bg-gray-50">
      <SidebarHeader className="border-b border-gray-200 h-16 flex items-center justify-center px-4">
        <div className="flex items-center justify-center transition-all duration-300 ease-in-out w-full">
          <div className="relative flex items-center justify-center cursor-pointer" onClick={() => navigate("/")}>
            {effectiveState === "expanded" ? (
              <img 
                src="/oops-logo.png" 
                alt="Restaurant Management System" 
                className="w-32 h-auto transition-all duration-300 crisp-edges max-w-full" 
              />
            ) : (
              <img 
                src="/oops-icon.png" 
                alt="POS" 
                className="w-10 h-auto transition-all duration-300 crisp-edges" 
              />
            )}
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
        <SidebarGroup className="px-3 py-2">
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">{visibleNavigationItems.map(item => renderNavigationItem(item))}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-gray-200 p-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton className="w-full transition-all duration-200 hover:bg-gray-200 group min-h-[48px] px-3 rounded-lg">
                  <div className="flex items-center gap-3 w-full justify-start group-data-[state=collapsed]:justify-center min-w-0">
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300">
                      <span className="text-white text-sm font-medium">{user?.firstName?.charAt(0)?.toUpperCase() || "U"}</span>
                    </div>
                    {effectiveState === "expanded" && (
                      <div className="flex-1 text-left min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{user?.fullName || "User"}</p>
                        <p className="text-xs text-gray-500 truncate">@{user?.username}</p>
                      </div>
                    )}
                  </div>
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 z-popover mb-2" sideOffset={8}>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none truncate">{user?.fullName || "User"}</p>
                    <p className="text-xs leading-none text-gray-500 truncate">@{user?.username}</p>
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
                <DropdownMenuItem onClick={logout} className="text-red-600 hover:bg-red-50 hover:text-red-700 cursor-pointer transition-all duration-200">
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
