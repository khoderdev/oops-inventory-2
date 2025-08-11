import { usePermissions } from "@/hooks/usePermissions";
import { Navigate, useLocation } from "react-router-dom";

export const RoleBasedRoute = ({ children, fallbackPath = "/pos", allowedPaths = ["/pos"] }: { children: React.ReactNode; fallbackPath?: string; allowedPaths?: string[] }) => {
  const { isStaffOnly } = usePermissions();
  const location = useLocation();
  if (isStaffOnly && !allowedPaths.some(path => location.pathname.startsWith(path))) {
    return <Navigate to={fallbackPath} replace />;
  }
  return <>{children}</>;
};
