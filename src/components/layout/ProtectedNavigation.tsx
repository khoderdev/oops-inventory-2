// import { cn } from "@/lib/utils";
// import { NavigationItem } from "@/types/inventory";
// import { ChevronDown, ChevronLeft, ChevronRight, LogOut, Menu, Shield, User, X } from "lucide-react";
// import React, { useCallback, useEffect, useMemo, useState } from "react";
// import { Link, useLocation, useNavigate } from "react-router-dom";
// import { useAuth } from "../../contexts/AuthContext";
// import { useSidebar } from "../../contexts/SidebarContext";
// import { LOGO_CONFIGS, useCachedLogo } from "../../utils/logoCache";
// import { Badge } from "../ui/badge";
// import { Button } from "../ui/button";
// import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../ui/collapsible";
// import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "../ui/dropdown-menu";
// import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
// import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
// import { navigationItems } from "./navigationItems";

// const ProtectedNavigation: React.FC = () => {
//   const { logout, hasPermission, hasRole } = useAuth();
//   const { isCollapsed, isMobileMenuOpen, toggleCollapse, closeMobileMenu, toggleMobileMenu } = useSidebar();
//   const location = useLocation();
//   const navigate = useNavigate();
//   const [openSections, setOpenSections] = useState<string[]>([]);
//   const [hoveredSection, setHoveredSection] = useState<string | null>(null);

//   // Cached logos with preloading and fallback - different logos for collapsed/expanded states
//   const logoConfig = isCollapsed ? LOGO_CONFIGS.SIDEBAR_ICON : LOGO_CONFIGS.SIDEBAR_LOGO;
//   const { logoSrc, isLoaded, error } = useCachedLogo(logoConfig);

//   // Performance optimizations with useCallback
//   const handleLogout = useCallback(async () => {
//     try {
//       await logout();
//       navigate("/login");
//     } catch (error) {
//       console.error("Logout failed:", error);
//     }
//   }, [logout, navigate]);

//   const toggleSection = useCallback((label: string) => {
//     setOpenSections(prev => (prev.includes(label) ? prev.filter(section => section !== label) : [...prev, label]));
//   }, []);

//   // Auto-close mobile menu on route change
//   useEffect(() => {
//     closeMobileMenu();
//   }, [location.pathname, closeMobileMenu]);

//   // Memoized visibility check for performance
//   const isItemVisible = useCallback(
//     (item: NavigationItem): boolean => {
//       // Check role requirement
//       if (item.role && !hasRole(item.role)) {
//         return false;
//       }

//       // Check permission requirement
//       if (item.permission && !hasPermission(item.permission)) {
//         return false;
//       }

//       // If item has children, check if any child is visible
//       if (item.children) {
//         return item.children.some(child => isItemVisible(child));
//       }

//       return true;
//     },
//     [hasRole, hasPermission]
//   );

//   const isActiveLink = useCallback(
//     (href: string): boolean => {
//       if (href === "/") {
//         return location.pathname === "/";
//       }
//       // Use startsWith for parent routes but ensure we don't match partial segments
//       return location.pathname === href || location.pathname.startsWith(href + "/");
//     },
//     [location.pathname]
//   );

//   // Check if any child of an item is active (for parent highlighting)
//   const hasActiveChild = useCallback(
//     (item: NavigationItem): boolean => {
//       if (!item.children) return false;
//       return item.children.some(child => child.href && isActiveLink(child.href));
//     },
//     [isActiveLink]
//   );

//   // Memoized filtered navigation items
//   const visibleNavigationItems = useMemo(() => {
//     return navigationItems.filter(item => isItemVisible(item));
//   }, [navigationItems, isItemVisible]);

//   // Enhanced child menu component for collapsed state
//   const CollapsedChildMenu = useCallback(
//     ({ item, children }: { item: NavigationItem; children: NavigationItem[] }) => {
//       const visibleChildren = children.filter(child => isItemVisible(child));

//       if (visibleChildren.length === 0) return null;

//       return (
//         <Popover>
//           <PopoverTrigger asChild>
//             <Button variant="ghost" className={cn("w-full h-12 p-0 justify-center relative group transition-all duration-200", "hover:bg-gray-100", hasActiveChild(item) ? "bg-blue-600 text-white" : "text-gray-600")} onMouseEnter={() => setHoveredSection(item.label)} onMouseLeave={() => setHoveredSection(null)}>
//               <div className="flex flex-col items-center gap-1">
//                 <item.icon className="h-5 w-5 flex-shrink-0" />
//                 {item.badge && (
//                   <Badge variant={item.badgeVariant || "default"} className="text-[10px] px-1 py-0 h-4 min-w-4">
//                     {item.badge}
//                   </Badge>
//                 )}
//               </div>
//             </Button>
//           </PopoverTrigger>
//           <PopoverContent side="right" align="start" className="w-64 p-3 ml-2 shadow-lg border border-gray-200 bg-white rounded-lg" sideOffset={8}>
//             <div className="space-y-2">
//               <div className="px-2 py-2 border-b border-gray-100">
//                 <div className="flex items-center gap-2">
//                   <item.icon className="h-4 w-4 text-gray-600" />
//                   <span className="font-medium text-sm text-gray-900">{item.label}</span>
//                   {item.badge && (
//                     <Badge variant={item.badgeVariant || "default"} className="text-xs">
//                       {item.badge}
//                     </Badge>
//                   )}
//                 </div>
//               </div>
//               <div className="space-y-1">
//                 {visibleChildren.map(child => (
//                   <Link key={child.label} to={child.href!} onClick={closeMobileMenu}>
//                     <Button variant="ghost" className={cn("w-full justify-start text-left font-medium h-10 px-3 transition-all duration-200 rounded-md", child.href && isActiveLink(child.href) ? "bg-blue-600 text-white shadow-sm" : "text-gray-700 hover:bg-gray-100")}>
//                       <child.icon className="h-4 w-4 mr-3 flex-shrink-0" />
//                       <span className="truncate">{child.label}</span>
//                       {child.badge && (
//                         <Badge variant={child.badgeVariant || "default"} className="ml-auto text-xs">
//                           {child.badge}
//                         </Badge>
//                       )}
//                     </Button>
//                   </Link>
//                 ))}
//               </div>
//             </div>
//           </PopoverContent>
//         </Popover>
//       );
//     },
//     [isItemVisible, isActiveLink, closeMobileMenu, setHoveredSection, hasActiveChild]
//   );

//   const renderNavigationItem = useCallback(
//     (item: NavigationItem, level: number = 0): React.ReactNode => {
//       if (!isItemVisible(item)) return null;

//       const paddingClass = level === 0 ? "px-3" : "px-6";
//       const isActive = item.href ? isActiveLink(item.href) : false;
//       const hasActiveChildren = hasActiveChild(item);

//       // For parent items: only show as active if they have active children AND no direct active state
//       // For child items: show as active if they match the current route
//       const shouldShowAsActive = level === 0 ? hasActiveChildren && !isActive : isActive;
//       const shouldShowAsActiveChild = level > 0 ? isActive : false;

//       // Collapsed sidebar - show icons only
//       if (isCollapsed) {
//         if (item.children && item.children.length > 0) {
//           return <CollapsedChildMenu key={item.label} item={item} children={item.children} />;
//         }

//         return (
//           <Tooltip key={item.label}>
//             <TooltipTrigger asChild>
//               <Link to={item.href!}>
//                 <Button variant="ghost" className={cn("w-full h-12 p-0 justify-center transition-all duration-200", "hover:bg-gray-100", isActive ? "bg-blue-600 text-white" : "text-gray-600")} onClick={closeMobileMenu}>
//                   <div className="flex flex-col items-center gap-1">
//                     <item.icon className="h-5 w-5 flex-shrink-0" />
//                     {item.badge && (
//                       <Badge variant={item.badgeVariant || "default"} className="text-xs px-1 py-0 h-4 min-w-4">
//                         {item.badge}
//                       </Badge>
//                     )}
//                   </div>
//                 </Button>
//               </Link>
//             </TooltipTrigger>
//             <TooltipContent side="right">{item.label}</TooltipContent>
//           </Tooltip>
//         );
//       }

//       // Expanded sidebar
//       if (item.children && item.children.length > 0) {
//         const isOpen = openSections.includes(item.label);
//         return (
//           <Collapsible key={item.label} open={isOpen} onOpenChange={() => toggleSection(item.label)}>
//             <CollapsibleTrigger asChild>
//               <Button variant="ghost" className={cn("w-full justify-start text-left font-medium h-12 transition-all duration-200 rounded-lg", paddingClass, shouldShowAsActive ? "bg-blue-50 text-blue-700 border-l-4 border-blue-500" : "text-gray-700 hover:bg-gray-100")}>
//                 <div className="flex items-center gap-3 flex-1">
//                   <item.icon className="h-4 w-4 flex-shrink-0" />
//                   <span className="truncate flex-1">{item.label}</span>
//                   {item.badge && (
//                     <Badge variant={item.badgeVariant || "default"} className="text-xs">
//                       {item.badge}
//                     </Badge>
//                   )}
//                 </div>
//                 <ChevronDown className={cn("h-4 w-4 transition-transform duration-200 flex-shrink-0", { "rotate-180": isOpen })} />
//               </Button>
//             </CollapsibleTrigger>
//             <CollapsibleContent className="space-y-1 mt-1">
//               <div className="ml-4 pl-4 space-y-1">{item.children?.map(child => renderNavigationItem(child, level + 1))}</div>
//             </CollapsibleContent>
//           </Collapsible>
//         );
//       }

//       // Regular item
//       return (
//         <Link key={item.label} to={item.href!}>
//           <Button variant="ghost" className={cn("w-full justify-start text-left font-medium h-11 transition-all duration-200 rounded-lg", paddingClass, shouldShowAsActiveChild ? "bg-blue-600 text-white shadow-sm" : "text-gray-700 hover:bg-gray-100")} onClick={closeMobileMenu}>
//             <item.icon className="h-4 w-4 mr-3 flex-shrink-0" />
//             <span className="truncate flex-1">{item.label}</span>
//             {item.badge && (
//               <Badge variant={item.badgeVariant || "default"} className="ml-auto text-xs">
//                 {item.badge}
//               </Badge>
//             )}
//           </Button>
//         </Link>
//       );
//     },
//     [openSections, isCollapsed, closeMobileMenu, isActiveLink, hasActiveChild, isItemVisible, CollapsedChildMenu, toggleSection]
//   );

//   return (
//     <>
//       {/* Mobile Menu Button */}
//       <Button variant="outline" size="sm" onClick={toggleMobileMenu} className="lg:hidden fixed top-4 left-4 z-50 shadow-lg bg-white hover:bg-gray-100 transition-all duration-200 hover:shadow-xl">
//         {isMobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
//       </Button>

//       {/* Mobile Overlay */}
//       {isMobileMenuOpen && <div className="lg:hidden fixed inset-0 bg-black/50 z-30 backdrop-blur-sm transition-opacity duration-300" onClick={closeMobileMenu} />}

//       {/* Sidebar */}
//       <aside className={cn("fixed top-0 left-0 z-40 h-screen bg-white border-r border-gray-100 shadow-sm transition-all duration-300 ease-in-out flex flex-col", isCollapsed ? "w-16" : "w-72", isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0")}>
//         {/* Collapse Toggle Button */}
//         <div className="hidden lg:block absolute -right-3 top-6 z-50">
//           <Button variant="outline" size="sm" onClick={toggleCollapse} className="h-6 w-6 p-0 rounded-full bg-white shadow-md hover:shadow-lg transition-all duration-200 border-gray-200 hover:border-gray-300">
//             {isCollapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
//           </Button>
//         </div>

//         <div className="flex flex-col h-full">
//           {/* Header */}
//           <div className="px-6 py-5 flex items-center justify-center border-b border-gray-100">
//             <div className="flex items-center justify-center">
//               <div className={cn("relative flex items-center justify-center transition-all duration-300", isCollapsed ? "w-12 h-12" : "w-36 h-12")}>
//                 {!isLoaded && (
//                   <div className="absolute inset-0 flex items-center justify-center">
//                     <div className={cn("border-2 border-blue-500 border-t-transparent rounded-full animate-spin", isCollapsed ? "w-6 h-6" : "w-8 h-8")} />
//                   </div>
//                 )}
//                 <img
//                   src={logoSrc}
//                   alt={logoConfig.alt}
//                   className={cn("transition-all duration-300 object-contain", {
//                     "opacity-100": isLoaded,
//                     "opacity-0": !isLoaded,
//                     "w-10 h-10": isCollapsed,
//                     "w-36 h-auto": !isCollapsed
//                   })}
//                 />
//                 {error && !isLoaded && <span className="absolute inset-0 flex items-center justify-center text-xs text-gray-500 font-semibold">{isCollapsed ? "oO" : "oOps Resto"}</span>}
//               </div>
//             </div>
//           </div>

//           {/* Navigation */}
//           <nav className="flex-1 overflow-y-auto py-4">
//             <div className={cn("space-y-1 transition-all duration-300", isCollapsed ? "px-2" : "px-3")}>{visibleNavigationItems.map(item => renderNavigationItem(item))}</div>
//           </nav>

//           {/* Footer */}
//           <div className="p-3 border-t border-gray-100">
//             <DropdownMenu>
//               <DropdownMenuTrigger asChild>
//                 <Button variant="ghost" className={cn("w-full transition-all duration-200 hover:bg-gray-100", isCollapsed ? "justify-center h-12 p-0" : "justify-start h-10")}>
//                   {isCollapsed ? (
//                     <User className="h-5 w-5" />
//                   ) : (
//                     <>
//                       <User className="h-4 w-4 mr-3" />
//                       <span className="flex-1 text-left">Account</span>
//                       <ChevronDown className="h-4 w-4" />
//                     </>
//                   )}
//                 </Button>
//               </DropdownMenuTrigger>
//               <DropdownMenuContent align={isCollapsed ? "center" : "start"} side={isCollapsed ? "right" : "top"} className="w-56 shadow-xl border-0 bg-white/95 backdrop-blur-sm" sideOffset={isCollapsed ? 8 : 4}>
//                 <DropdownMenuLabel className="text-gray-700">My Account</DropdownMenuLabel>
//                 <DropdownMenuSeparator />
//                 <DropdownMenuItem onClick={() => navigate("/profile")} className="hover:bg-blue-50 transition-colors duration-200">
//                   <User className="mr-2 h-4 w-4" />
//                   Profile Settings
//                 </DropdownMenuItem>
//                 <DropdownMenuItem onClick={() => navigate("/profile/sessions")} className="hover:bg-blue-50 transition-colors duration-200">
//                   <Shield className="mr-2 h-4 w-4" />
//                   Active Sessions
//                 </DropdownMenuItem>
//                 <DropdownMenuSeparator />
//                 <DropdownMenuItem onClick={handleLogout} className="text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors duration-200">
//                   <LogOut className="mr-2 h-4 w-4" />
//                   Sign Out
//                 </DropdownMenuItem>
//               </DropdownMenuContent>
//             </DropdownMenu>
//           </div>
//         </div>
//       </aside>
//     </>
//   );
// };

// export default ProtectedNavigation;
