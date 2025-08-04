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
    <SidebarProvider defaultOpen={false}>
      <AppSidebar />
      <SidebarInset className="flex flex-col min-h-screen transition-all duration-300 ease-in-out">
        <header className="flex h-16 shrink-0 items-center gap-3 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40 safe-area-top">
          <div className="flex items-center gap-3 px-4 w-full">
            <SidebarTrigger className="-ml-1 btn-touch" />
            {pageTitle && <div className={`font-semibold text-foreground ${showSearch ? "hidden sm:block" : "block"} truncate`}>{pageTitle}</div>}
            <div className="flex-1" />
            {showSearch && (
              <form onSubmit={handleSearch} className="hidden md:flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input type="search" placeholder="Search..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9 w-64 h-9 text-responsive transition-all duration-200 focus:w-80" />
                </div>
              </form>
            )}
            {showSearch && (
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden btn-touch"
                onClick={() => {
                  console.log("Open mobile search");
                }}
              >
                <Search className="h-5 w-5" />
                <span className="sr-only">Search</span>
              </Button>
            )}
            {showNotifications && (
              <Button variant="ghost" size="icon" className="relative btn-touch sm:mx-6" onClick={() => navigate("/pos")}>
                <img src="/pos.png" alt="POS" className="h-7 w-7 object-contain" />
              </Button>
            )}
            <div className="block md:hidden">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="btn-touch transition-all duration-200">
                    <div className="w-9 h-9 bg-primary rounded-full flex items-center justify-center">
                      <span className="text-primary-foreground text-base font-medium">{user?.firstName?.charAt(0)?.toUpperCase() || "U"}</span>
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
                  <DropdownMenuItem onClick={() => navigate("/profile")} className="transition-all duration-200">
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/profile/sessions")} className="transition-all duration-200">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>
        <main className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 flex flex-col gap-4 animate-fade-in">{children}</div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
