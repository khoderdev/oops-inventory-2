import { useParams } from "react-router-dom";
import { useSupplier } from "@/hooks/useSuppliers";
import { SupplierDetail } from "@/components/suppliers/SupplierDetail";
import { Skeleton } from "@/components/ui/skeleton";

export function SupplierDetailRoute() {
  const { id } = useParams<{ id: string }>();
  const { data: supplier, isLoading, isError } = useSupplier(id || "", {
    includeInvoices: true,
    includeSettlements: true,
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-1/3" />
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (isError || !supplier) {
    return (
      <div className="text-center py-12">
        <h3 className="mt-4 text-lg font-medium">Supplier not found</h3>
        <p className="mt-2 text-muted-foreground">The requested supplier could not be loaded.</p>
      </div>
    );
  }

  return <SupplierDetail supplier={supplier} />;
}
