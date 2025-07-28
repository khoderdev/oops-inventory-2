import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { usePermissions } from "@/hooks/usePermissions";
import { Search, Settings, User } from "lucide-react";
import React from "react";
import { useNavigate } from "react-router-dom";
import { AppSidebar } from "./AppSidebar";

interface SidebarLayoutProps {
  children: React.ReactNode;
  showSearch?: boolean;
  showNotifications?: boolean;
  pageTitle?: string;
}

export function SidebarLayout({ children, showSearch = true, showNotifications = true, pageTitle }: SidebarLayoutProps) {
  const { user } = usePermissions();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = React.useState("");
  const [notificationCount] = React.useState(3); // Mock notification count

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Implement global search functionality
      console.log("Searching for:", searchQuery);
    }
  };

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="flex flex-col min-h-screen">
        {/* Enhanced Header with better responsive design */}
        <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-fixed safe-area-top">
          <div className="flex items-center gap-2 px-4 w-full">
            {/* Sidebar Trigger */}
            <SidebarTrigger className="-ml-1 btn-touch" />

            {/* Page Title - Hidden on small screens when search is visible */}
            {pageTitle && <div className={`font-semibold text-foreground ${showSearch ? "hidden sm:block" : "block"}`}>{pageTitle}</div>}

            {/* Spacer */}
            <div className="flex-1" />

            {/* Search Bar - Responsive */}
            {showSearch && (
              <form onSubmit={handleSearch} className="hidden md:flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input type="search" placeholder="Search..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9 w-64 h-9 text-responsive transition-smooth focus:w-80" />
                </div>
              </form>
            )}

            {/* Mobile Search Button */}
            {showSearch && (
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden btn-touch"
                onClick={() => {
                  // Implement mobile search modal
                  console.log("Open mobile search");
                }}
              >
                <Search className="h-4 w-4" />
                <span className="sr-only">Search</span>
              </Button>
            )}

            {/* POS */}
            {showNotifications && (
              <Button variant="ghost" size="icon" className="relative btn-touch" onClick={() => navigate("/pos")}>
                <img src="/pos.png" alt="POS" className="h-6 w-6 object-contain" />
                <span className="sr-only">Point of Sale</span>
              </Button>
            )}

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="btn-touch">
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                    <span className="text-primary-foreground text-sm font-medium">{user?.firstName?.charAt(0)?.toUpperCase() || "U"}</span>
                  </div>
                  <span className="sr-only">User menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">{user?.fullName || "User"}</p>
                    <p className="text-xs text-muted-foreground">{user?.username}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/profile")}>
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/profile/sessions")}>
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Main Content Area with responsive padding */}
        <main className="flex-1 flex flex-col min-h-0 safe-area-padding safe-area-bottom">
          <div className="spacing-responsive flex-1 flex flex-col gap-4 animate-fade-in">{children}</div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
