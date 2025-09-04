import { useState, useCallback, lazy, Suspense } from "react";
import { Supplier, SupplierPayment } from "@/types/suppliers";
import { SuppliersTable } from "@/components/suppliers/SuppliersTable";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useSuppliersContext } from "@/context/SuppliersContext";
import { Loader2 } from "lucide-react";

// Lazy load components to improve initial page load time
const SupplierForm = lazy(() => import("@/components/suppliers/SupplierForm"));
const SupplierDetail = lazy(() => import("@/components/suppliers/SupplierDetail"));
const PaymentForm = lazy(() => import("@/components/suppliers/PaymentForm"));

// Loading spinner component
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

  // Get all the supplier functions from our context
  const { refresh, deleteSupplier, deleteSupplierPayment } = useSuppliersContext();

  // Memoize handlers to prevent unnecessary re-renders
  const handleAdd = useCallback(() => {
    setSelectedSupplier(null);
    // Small delay to allow React to process state updates before opening modal
    setTimeout(() => setIsFormOpen(true), 10);
  }, []);

  const handleEdit = useCallback((supplier: Supplier) => {
    setSelectedSupplier(supplier);
    // Small delay to allow React to process state updates before opening modal
    setTimeout(() => setIsFormOpen(true), 10);
  }, []);

  const handleView = useCallback((supplier: Supplier) => {
    setSelectedSupplier(supplier);
    // Small delay to allow React to process state updates before opening modal
    setTimeout(() => setIsDetailOpen(true), 10);
  }, []);

  const handleDelete = useCallback((supplier: Supplier) => {
    setSelectedSupplier(supplier);
    // Small delay to allow React to process state updates before opening modal
    setTimeout(() => setIsDeleteDialogOpen(true), 10);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!selectedSupplier) return;

    try {
      const success = await deleteSupplier(selectedSupplier.id);
      if (success) {
        setIsDeleteDialogOpen(false);
        setSelectedSupplier(null);
        // The context already handles refreshing the data after deletion
      }
    } catch (error) {
      console.error("Error deleting supplier:", error);
    }
  }, [deleteSupplier, selectedSupplier]);

  // Memoized handlers for payment operations
  const handleAddPayment = useCallback(() => {
    setSelectedPayment(null);
    // Small delay to allow React to process state updates before opening modal
    setTimeout(() => setIsPaymentFormOpen(true), 10);
  }, []);

  const handleEditPayment = useCallback((payment: SupplierPayment) => {
    setSelectedPayment(payment);
    // Small delay to allow React to process state updates before opening modal
    setTimeout(() => setIsPaymentFormOpen(true), 10);
  }, []);

  const handleDeletePayment = useCallback((payment: SupplierPayment) => {
    setSelectedPayment(payment);
    // Small delay to allow React to process state updates before opening modal
    setTimeout(() => setIsDeletePaymentDialogOpen(true), 10);
  }, []);

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

  // Memoized success handlers
  const handleFormSuccess = useCallback(() => {
    setIsFormOpen(false);
    // Refresh table data to show the new supplier
    refresh();
  }, [refresh]);

  const handlePaymentFormSuccess = useCallback(() => {
    setIsPaymentFormOpen(false);
    // Refresh table data to show updated supplier data
    refresh();
  }, [refresh]);

  return (
    <div className="container py-6">
      {/* Suppliers Table */}
      <SuppliersTable onAdd={handleAdd} onEdit={handleEdit} onView={handleView} onDelete={handleDelete} />

      {/* Supplier Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedSupplier ? "Edit Supplier" : "Add New Supplier"}</DialogTitle>
            <DialogDescription>{selectedSupplier ? "Update the supplier details below." : "Fill in the supplier details below."}</DialogDescription>
          </DialogHeader>
          {/* Use Suspense to handle lazy loading */}
          <Suspense fallback={<LoadingSpinner />}>
            {isFormOpen && (
              <div className="pb-4">
                <SupplierForm supplier={selectedSupplier || undefined} onSuccess={handleFormSuccess} onCancel={() => setIsFormOpen(false)} />
              </div>
            )}
          </Suspense>
        </DialogContent>
      </Dialog>

      {/* Supplier Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          {/* Use Suspense to handle lazy loading */}
          <Suspense fallback={<LoadingSpinner />}>
            {isDetailOpen && selectedSupplier && (
              <div className="pb-4">
                <SupplierDetail
                  supplier={selectedSupplier}
                  onEdit={() => {
                    setIsDetailOpen(false);
                    // Small delay to prevent UI freezing during transition
                    setTimeout(() => setIsFormOpen(true), 10);
                  }}
                  onDelete={() => {
                    setIsDetailOpen(false);
                    // Small delay to prevent UI freezing during transition
                    setTimeout(() => setIsDeleteDialogOpen(true), 10);
                  }}
                />
              </div>
            )}
          </Suspense>
        </DialogContent>
      </Dialog>

      {/* Payment Form Dialog */}
      <Dialog open={isPaymentFormOpen} onOpenChange={setIsPaymentFormOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedPayment ? "Edit Payment" : "Add New Payment"}</DialogTitle>
            <DialogDescription>{selectedPayment ? "Update the payment details below." : "Fill in the payment details below."}</DialogDescription>
          </DialogHeader>
          {/* Use Suspense to handle lazy loading */}
          <Suspense fallback={<LoadingSpinner />}>
            {isPaymentFormOpen && selectedSupplier && (
              <div className="pb-4">
                <PaymentForm supplierId={selectedSupplier.id} payment={selectedPayment || undefined} onSuccess={handlePaymentFormSuccess} onCancel={() => setIsPaymentFormOpen(false)} />
              </div>
            )}
          </Suspense>
        </DialogContent>
      </Dialog>

      {/* Delete Supplier Confirmation */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the supplier
              {selectedSupplier && <strong> "{selectedSupplier.name}"</strong>} and all associated payment records.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Payment Confirmation */}
      <AlertDialog open={isDeletePaymentDialogOpen} onOpenChange={setIsDeletePaymentDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Payment Record?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone. This will permanently delete this payment record.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeletePayment} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
