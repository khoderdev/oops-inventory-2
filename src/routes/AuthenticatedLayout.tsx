import { SidebarLayout } from "@/components/layout/SidebarLayout";

export const AuthenticatedLayout = ({ children, pageTitle, showSearch = true, showNotifications = true }: { children: React.ReactNode; pageTitle?: string; showSearch?: boolean; showNotifications?: boolean }) => {
  return (
    <div className="min-h-screen bg-background">
      <SidebarLayout pageTitle={pageTitle} showSearch={showSearch} showNotifications={showNotifications}>
        <div className="animate-fade-in">{children}</div>
      </SidebarLayout>
    </div>
  );
};
