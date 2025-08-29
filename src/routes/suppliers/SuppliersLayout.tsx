import { Outlet } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export function SuppliersLayout() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Suppliers</h1>
          <p className="text-muted-foreground">
            Manage your suppliers and track payments
          </p>
        </div>
        <Button asChild>
          <Link to="/suppliers/new">Add Supplier</Link>
        </Button>
      </div>
      <Outlet />
    </div>
  );
}
