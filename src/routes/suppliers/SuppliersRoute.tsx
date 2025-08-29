import { SupplierList } from "@/components/suppliers/SupplierList";
import { SupplierSummary } from "@/components/suppliers/SupplierSummary";

export function SuppliersRoute() {
  return (
    <>
      <SupplierSummary />
      <SupplierList />
    </>
  );
}
