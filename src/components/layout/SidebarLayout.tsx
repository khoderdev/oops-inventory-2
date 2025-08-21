import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { SidebarInset, SidebarProvider, SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { usePermissions } from "@/hooks/usePermissions";
import { Menu, Search, Settings, User } from "lucide-react";
import React from "react";
import { useNavigate } from "react-router-dom";
import { SideBarHeader } from "./SideBarHeader";

interface SidebarLayoutProps {
  children: React.ReactNode;
  showSearch?: boolean;
  showNotifications?: boolean;
  pageTitle?: string;
}

function SidebarLayoutContent({ children, showSearch = true, showNotifications = true, pageTitle }: SidebarLayoutProps) {
  const { user } = usePermissions();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = React.useState("");
  const { setOpen, open, openMobile, setOpenMobile, isMobile } = useSidebar();
  const [, setIsHovering] = React.useState(false);
  const [hoverTimeout, setHoverTimeout] = React.useState<NodeJS.Timeout | null>(null);
  const [leaveTimeout, setLeaveTimeout] = React.useState<NodeJS.Timeout | null>(null);
  const [isLocked, setIsLocked] = React.useState(() => {
    try {
      const saved = localStorage.getItem("sidebar-lock-state");
      return saved !== null ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });

  const handleToggleLock = React.useCallback(() => {
    if (isMobile) {
      setOpenMobile(!openMobile);
      return;
    }
    setIsLocked(prev => {
      const newLocked = !prev;
      try {
        localStorage.setItem("sidebar-lock-state", JSON.stringify(newLocked));
      } catch (error) {
        console.warn("Failed to save sidebar lock state:", error);
      }
      if (newLocked) {
        if (hoverTimeout) {
          clearTimeout(hoverTimeout);
          setHoverTimeout(null);
        }
        if (leaveTimeout) {
          clearTimeout(leaveTimeout);
          setLeaveTimeout(null);
        }
      }
      return newLocked;
    });
  }, [hoverTimeout, leaveTimeout, isMobile, openMobile, setOpenMobile]);

  const handleSidebarMouseEnter = React.useCallback(() => {
    if (isMobile || isLocked) return;
    if (leaveTimeout) {
      clearTimeout(leaveTimeout);
      setLeaveTimeout(null);
    }
    setIsHovering(true);
    const timeout = setTimeout(() => {
      setOpen(true);
    }, 75);
    setHoverTimeout(timeout);
  }, [isMobile, isLocked, leaveTimeout, setOpen]);

  const handleSidebarMouseLeave = React.useCallback(() => {
    if (isMobile || isLocked) return;
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
      setHoverTimeout(null);
    }
    setIsHovering(false);
    const timeout = setTimeout(() => {
      setOpen(false);
    }, 150);
    setLeaveTimeout(timeout);
  }, [isMobile, isLocked, hoverTimeout, setOpen]);

  // Cleanup timeouts on unmount
  React.useEffect(() => {
    return () => {
      if (hoverTimeout) clearTimeout(hoverTimeout);
      if (leaveTimeout) clearTimeout(leaveTimeout);
    };
  }, [hoverTimeout, leaveTimeout]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      console.log("Searching for:", searchQuery);
    }
  };

  return (
    <>
      {/* Desktop sidebar */}
      <div
        className="fixed inset-y-0 left-0 z-50 hidden md:block"
        onMouseEnter={handleSidebarMouseEnter}
        onMouseLeave={handleSidebarMouseLeave}
        style={{
          width: open ? "240px" : "50px",
          transition: "width 150ms ease-in-out cubic-bezier(0.4, 0, 0.2, 1)"
        }}
      >
        <SideBarHeader />
      </div>

      {/* Mobile sidebar is handled by the Sidebar component in sidebar.tsx */}
      <SidebarInset
        className="flex flex-col min-h-screen transition-all duration-200 ease-out"
        style={{
          marginLeft: isMobile ? "0px" : open ? "240px" : "55px",
          transition: "margin-left 150ms cubic-bezier(0.4, 0, 0.2, 1)"
        }}
      >
        <header className="flex h-16 shrink-0 items-center gap-2 border-b border-gray-200 bg-white sticky top-0 z-40 px-2 sm:px-4">
          <div className="flex items-center gap-2 sm:gap-4 w-full min-w-0">
            {/* Mobile menu button */}
            <Button variant="ghost" size="icon" className="md:hidden p-2 hover:bg-gray-100 rounded-full transition-colors duration-200 flex-shrink-0 h-10 w-10" onClick={() => setOpenMobile(true)}>
              <Menu className="h-5 w-5 text-gray-600" />
              <span className="sr-only">Menu</span>
            </Button>

            {/* Desktop sidebar toggle */}
            <SidebarTrigger className="hidden md:flex p-2 hover:bg-gray-100 rounded-full transition-colors duration-200 flex-shrink-0" onClick={handleToggleLock} />

            {/* Page title */}
            {pageTitle && <div className={`font-medium text-gray-900 ${showSearch ? "hidden sm:block" : "block"} truncate min-w-0 text-base sm:text-lg`}>{pageTitle}</div>}

            <div className="flex-1 min-w-0" />

            {/* Desktop search */}
            {showSearch && (
              <form onSubmit={handleSearch} className="hidden lg:flex items-center gap-2 flex-1 max-w-2xl mx-4 xl:mx-8">
                <div className="relative w-full">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500" />
                  <Input type="search" placeholder="Search" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-12 pr-4 h-10 sm:h-12 w-full bg-gray-100 border-0 rounded-full text-sm placeholder:text-gray-500 focus:bg-white focus:shadow-lg focus:ring-2 focus:ring-blue-500 transition-all duration-200" />
                </div>
              </form>
            )}

            {/* Mobile search button */}
            {showSearch && (
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden p-2 hover:bg-gray-100 rounded-full transition-colors duration-200 flex-shrink-0 h-10 w-10"
                onClick={() => {
                  console.log("Open mobile search");
                }}
              >
                <Search className="h-5 w-5 text-gray-600" />
                <span className="sr-only">Search</span>
              </Button>
            )}

            {/* Action buttons */}
            <div className="flex items-center gap-1 sm:gap-2">
              {showNotifications && (
                <Button variant="ghost" size="icon" className="relative p-1 sm:p-2 hover:bg-gray-100 rounded-full transition-colors duration-200 flex-shrink-0 h-9 w-9 sm:h-10 sm:w-10" onClick={() => navigate("/pos")}>
                  <img src="/pos.png" alt="POS" className="h-5 w-5 sm:h-6 sm:w-6 object-contain" />
                </Button>
              )}
            </div>

            {/* User menu */}
            <div className="flex-shrink-0 sm:hidden">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="p-1 hover:bg-gray-100 rounded-full transition-colors duration-200 h-9 w-9 sm:h-10 sm:w-10">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 bg-blue-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs sm:text-sm font-medium">{user?.firstName?.charAt(0)?.toUpperCase() || "U"}</span>
                    </div>
                    <span className="sr-only">User menu</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64 mr-2 sm:mr-4" sideOffset={8}>
                  <DropdownMenuLabel className="py-1.5">
                    <div className="flex flex-col space-y-1">
                      <p className="text-xs font-medium truncate">{user?.fullName || "User"}</p>
                      <p className="text-xs text-gray-500 truncate">@{user?.username}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate("/profile")} className="transition-all duration-200 cursor-pointer py-1.5 text-sm">
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/profile/sessions")} className="transition-all duration-200 cursor-pointer py-1.5 text-sm">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 flex flex-col min-h-0 overflow-hidden bg-gray-100">
          <div className="flex-1 flex flex-col">{children}</div>
        </main>
      </SidebarInset>
    </>
  );
}

export function SidebarLayout(props: SidebarLayoutProps) {
  // Read initial sidebar state from localStorage
  const getInitialSidebarState = () => {
    try {
      const savedLockState = localStorage.getItem("sidebar-lock-state");
      const isLocked = savedLockState !== null ? JSON.parse(savedLockState) : true;
      // If unlocked, start collapsed. If locked, start open.
      return isLocked;
    } catch {
      return true; // Default to open if error
    }
  };

  // Check if we're on mobile initially
  const isMobileInitial = window.innerWidth < 768;

  return (
    <SidebarProvider defaultOpen={!isMobileInitial && getInitialSidebarState()}>
      <SidebarLayoutContent {...props} />
    </SidebarProvider>
  );
}
