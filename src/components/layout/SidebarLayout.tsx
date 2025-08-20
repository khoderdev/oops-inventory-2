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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      console.log("Searching for:", searchQuery);
    }
  };

  return (
    <SidebarProvider defaultOpen={true}>
      <AppSidebar />
      <SidebarInset className="flex flex-col min-h-screen transition-all duration-300 ease-in-out">
        <header className="flex h-12 shrink-0 items-center gap-2 sm:gap-3 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40 safe-area-top">
          <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 w-full min-w-0">
            <SidebarTrigger className="-ml-1 btn-touch flex-shrink-0" />
            {pageTitle && <div className={`font-semibold text-foreground ${showSearch ? "hidden sm:block" : "block"} truncate min-w-0 text-sm sm:text-base`}>{pageTitle}</div>}
            <div className="flex-1 min-w-0" />
            {showSearch && (
              <form onSubmit={handleSearch} className="hidden lg:flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input type="search" placeholder="Search..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9 w-48 lg:w-64 h-9 text-responsive transition-all duration-200 focus:w-64 lg:focus:w-80" />
                </div>
              </form>
            )}
            {showSearch && (
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden btn-touch flex-shrink-0 h-9 w-9"
                onClick={() => {
                  console.log("Open mobile search");
                }}
              >
                <Search className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="sr-only">Search</span>
              </Button>
            )}
            {showNotifications && (
              <Button variant="ghost" size="icon" className="relative btn-touch flex-shrink-0 h-9 w-9 sm:h-10 sm:w-10 sm:mx-2 lg:mx-6" onClick={() => navigate("/pos")}>
                <img src="/pos.png" alt="POS" className="h-5 w-5 sm:h-6 sm:w-6 lg:h-7 lg:w-7 object-contain" />
              </Button>
            )}
            <div className="block lg:hidden flex-shrink-0">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="btn-touch transition-all duration-200 h-9 w-9 sm:h-10 sm:w-10">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 bg-primary rounded-full flex items-center justify-center">
                      <span className="text-primary-foreground text-sm sm:text-base font-medium">{user?.firstName?.charAt(0)?.toUpperCase() || "U"}</span>
                    </div>
                    <span className="sr-only">User menu</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 mr-2 sm:mr-4" sideOffset={8}>
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium truncate">{user?.fullName || "User"}</p>
                      <p className="text-xs text-muted-foreground truncate">@{user?.username}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate("/profile")} className="transition-all duration-200 cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/profile/sessions")} className="transition-all duration-200 cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>
        <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <div className="flex-1 flex flex-col gap-4 animate-fade-in">{children}</div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
