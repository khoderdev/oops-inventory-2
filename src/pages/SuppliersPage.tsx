import { useState, useCallback, lazy, Suspense } from "react";
import { Supplier, SupplierPayment } from "@/types/suppliers";
import { SuppliersTable } from "@/components/suppliers/SuppliersTable";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useSuppliersContext } from "@/context/SuppliersContext";
import { Loader2 } from "lucide-react";

const SupplierForm = lazy(() => import("@/components/suppliers/SupplierForm"));
const SupplierDetail = lazy(() => import("@/components/suppliers/SupplierDetail"));
const PaymentForm = lazy(() => import("@/components/suppliers/PaymentForm"));

const LoadingSpinner = () => (
  <div className="flex justify-center items-center p-8">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

export default function SuppliersPage() {
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<SupplierPayment | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isPaymentFormOpen, setIsPaymentFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeletePaymentDialogOpen, setIsDeletePaymentDialogOpen] = useState(false);
  const { refresh, deleteSupplier, deleteSupplierPayment } = useSuppliersContext();

  const handleAdd = useCallback(() => {
    setSelectedSupplier(null);
    setTimeout(() => setIsFormOpen(true), 10);
  }, []);

  const handleEdit = useCallback((supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setTimeout(() => setIsFormOpen(true), 10);
  }, []);

  const handleView = useCallback((supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setTimeout(() => setIsDetailOpen(true), 10);
  }, []);

  const handleDelete = useCallback((supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setTimeout(() => setIsDeleteDialogOpen(true), 10);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!selectedSupplier) return;
    try {
      const success = await deleteSupplier(selectedSupplier.id);
      if (success) {
        setIsDeleteDialogOpen(false);
        setSelectedSupplier(null);
      }
    } catch (error) {
      console.error("Error deleting supplier:", error);
    }
  }, [deleteSupplier, selectedSupplier]);

  const confirmDeletePayment = useCallback(async () => {
    if (!selectedPayment) return;
    try {
      const success = await deleteSupplierPayment(selectedPayment.id);
      if (success) {
        setIsDeletePaymentDialogOpen(false);
        setSelectedPayment(null);
      }
    } catch (error) {
      console.error("Error deleting payment:", error);
    }
  }, [deleteSupplierPayment, selectedPayment]);

  const handleFormSuccess = useCallback(() => {
    setIsFormOpen(false);
    refresh();
  }, [refresh]);

  const handlePaymentFormSuccess = useCallback(() => {
    setIsPaymentFormOpen(false);
    refresh();
  }, [refresh]);

  return (
    <div className="container py-4 md:py-6 px-3 sm:px-4">
      <SuppliersTable onAdd={handleAdd} onEdit={handleEdit} onView={handleView} onDelete={handleDelete} />

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="w-[95vw] max-w-[600px] max-h-[90vh] overflow-y-auto sm:w-full">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">{selectedSupplier ? "Edit Supplier" : "Add New Supplier"}</DialogTitle>
            <DialogDescription className="text-sm sm:text-base">{selectedSupplier ? "Update the supplier details below." : "Fill in the supplier details below."}</DialogDescription>
          </DialogHeader>
          <Suspense fallback={<LoadingSpinner />}>
            {isFormOpen && (
              <div className="pb-4">
                <SupplierForm supplier={selectedSupplier || undefined} onSuccess={handleFormSuccess} onCancel={() => setIsFormOpen(false)} />
              </div>
            )}
          </Suspense>
        </DialogContent>
      </Dialog>

      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="w-[95vw] max-w-[800px] max-h-[90vh] overflow-y-auto sm:w-full p-3 sm:p-6">
          <Suspense fallback={<LoadingSpinner />}>
            {isDetailOpen && selectedSupplier && (
              <div className="pb-4">
                <SupplierDetail
                  supplier={selectedSupplier}
                  onEdit={() => {
                    setIsDetailOpen(false);
                    setTimeout(() => setIsFormOpen(true), 10);
                  }}
                  onDelete={() => {
                    setIsDetailOpen(false);
                    setTimeout(() => setIsDeleteDialogOpen(true), 10);
                  }}
                />
              </div>
            )}
          </Suspense>
        </DialogContent>
      </Dialog>

      <Dialog open={isPaymentFormOpen} onOpenChange={setIsPaymentFormOpen}>
        <DialogContent className="w-[95vw] max-w-[500px] max-h-[90vh] overflow-y-auto sm:w-full">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">{selectedPayment ? "Edit Payment" : "Add New Payment"}</DialogTitle>
            <DialogDescription className="text-sm sm:text-base">{selectedPayment ? "Update the payment details below." : "Fill in the payment details below."}</DialogDescription>
          </DialogHeader>
          <Suspense fallback={<LoadingSpinner />}>
            {isPaymentFormOpen && selectedSupplier && (
              <div className="pb-4">
                <PaymentForm supplierId={selectedSupplier.id} payment={selectedPayment || undefined} onSuccess={handlePaymentFormSuccess} onCancel={() => setIsPaymentFormOpen(false)} />
              </div>
            )}
          </Suspense>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="w-[95vw] max-w-[450px] sm:w-full">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg sm:text-xl">Are you sure?</AlertDialogTitle>
            <AlertDialogDescription className="text-sm sm:text-base">
              This action cannot be undone. This will permanently delete the supplier
              {selectedSupplier && <strong> "{selectedSupplier.name}"</strong>} and all associated payment records.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-0">
            <AlertDialogCancel className="mt-0 sm:mt-0">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isDeletePaymentDialogOpen} onOpenChange={setIsDeletePaymentDialogOpen}>
        <AlertDialogContent className="w-[95vw] max-w-[450px] sm:w-full">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg sm:text-xl">Delete Payment Record?</AlertDialogTitle>
            <AlertDialogDescription className="text-sm sm:text-base">This action cannot be undone. This will permanently delete this payment record.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-0">
            <AlertDialogCancel className="mt-0 sm:mt-0">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeletePayment} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
