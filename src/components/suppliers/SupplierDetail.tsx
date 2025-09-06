import React, { useState, useEffect } from "react";
import { SupplierDetailProps, SupplierPayment } from "@/types/suppliers";
import { useSuppliersContext } from "@/context/SuppliersContext";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Edit, Trash2, Mail, Phone, MapPin, FileText, ToggleLeft, Calendar, RefreshCw } from "lucide-react";
import PaymentsTable from "./PaymentsTable";
import PaymentForm from "./PaymentForm";
import { formatDate } from "@/utils/formatDate";
import { formatCurrency } from "@/utils/conversionLogic";
import { suppliersAPI } from "@/api/suppliers.api";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { StockEntry } from "@/types/inventory";
import { stockAPI } from "@/api/stock.api.ts";

export const SupplierDetail: React.FC<SupplierDetailProps> = ({ supplier, onEdit, onDelete }) => {
  const { toggleSupplierStatus, loading, refresh, deleteSupplierPayment } = useSuppliersContext();
  const [payments, setPayments] = useState<SupplierPayment[]>([]);
  const [editingPayment, setEditingPayment] = useState<SupplierPayment | null>(null);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  const [allStockEntries, setAllStockEntries] = useState<StockEntry[]>([]); // Changed from SuppliersStockEntries
  const [stockEntriesLoading, setStockEntriesLoading] = useState(false); // Changed from SuppliersStockEntriesLoading

  const [paymentStats, setPaymentStats] = useState<{
    totalPaid: number;
    totalDue: number;
    lastPaymentDate: string | null;
  } | null>(null);

  const [activeTab, setActiveTab] = useState("details");
  const [localSupplier, setLocalSupplier] = useState(supplier);

  useEffect(() => {
    if (activeTab === "payments") {
      // Fetch payment stats (existing code)
      setPaymentsLoading(true);
      suppliersAPI
        .getSupplierPaymentStats(localSupplier.id)
        .then(response => {
          const stats = response.data;
          if (stats) {
            const totalPaid = stats.paymentCountByStatus.filter(item => item.status === "paid").reduce((sum, item) => sum + item.total, 0);
            const totalDue = stats.paymentCountByStatus.filter(item => ["pending", "partial", "overdue"].includes(item.status)).reduce((sum, item) => sum + item.total, 0);
            const lastPaymentDate = stats.recentPayments.length > 0 ? stats.recentPayments[0].paymentDate : null;
            setPaymentStats({ totalPaid, totalDue, lastPaymentDate });
            setPayments(stats.recentPayments || []);
          }
          setPaymentsLoading(false);
        })
        .catch(error => {
          console.error("Error fetching payment stats:", error);
          setPaymentsLoading(false);
        });

      // NEW: Fetch ALL stock entries using stockAPI
      fetchAllStockEntries();
    }
  }, [activeTab, localSupplier.id]);

  // NEW: Function to fetch ALL stock entries using stockAPI
  const fetchAllStockEntries = async () => {
    try {
      setStockEntriesLoading(true);
      const entries = await stockAPI.getAllStockEntries();
      setAllStockEntries(entries);
    } catch (error) {
      console.error("Error fetching all stock entries:", error);
    } finally {
      setStockEntriesLoading(false);
    }
  };

  // // NEW: Function to fetch stock entries using context
  // const fetchSuppliersStockEntries = async () => {
  //   try {
  //     setSuppliersStockEntriesLoading(true);
  //     const entries = await getSupplierStockEntries(localSupplier.id);
  //     setSuppliersStockEntries(entries);
  //   } catch (error) {
  //     console.error("Error fetching stock entries:", error);
  //   } finally {
  //     setSuppliersStockEntriesLoading(false);
  //   }
  // };

  const handleToggleStatus = async () => {
    setLocalSupplier(prev => ({
      ...prev,
      isActive: !prev.isActive
    }));
    await toggleSupplierStatus(supplier.id);
  };

  const handleRefresh = async () => {
    await refresh();
  };

  const handleEditPayment = async (payment: SupplierPayment) => {
    try {
      setEditingPayment(payment);
      setShowPaymentForm(true);
    } catch (error) {
      console.error("Error preparing to edit payment:", error);
    }
  };

  const handleDeletePayment = async (payment: SupplierPayment) => {
    try {
      if (!confirm(`Are you sure you want to delete payment #${payment.referenceNumber || payment.id}?`)) {
        return;
      }
      const success = await deleteSupplierPayment(payment.id);
      if (success) {
        handleRefreshPayments();
      }
    } catch (error) {
      console.error("Error deleting payment:", error);
    }
  };

  const handleRefreshPayments = async () => {
    try {
      setPaymentsLoading(true);
      const response = await suppliersAPI.getSupplierPaymentStats(localSupplier.id);
      const stats = response.data;
      if (stats) {
        const totalPaid = stats.paymentCountByStatus.filter(item => item.status === "paid").reduce((sum, item) => sum + item.total, 0);
        const totalDue = stats.paymentCountByStatus.filter(item => ["pending", "partial", "overdue"].includes(item.status)).reduce((sum, item) => sum + item.total, 0);
        const lastPaymentDate = stats.recentPayments.length > 0 ? stats.recentPayments[0].paymentDate : null;
        setPaymentStats({ totalPaid, totalDue, lastPaymentDate });
        setPayments(stats.recentPayments || []);
      }
    } catch (error) {
      console.error("Error refreshing payments:", error);
    } finally {
      setPaymentsLoading(false);
    }
  };

  const handleAddPayment = () => {
    setEditingPayment(null);
    setShowPaymentForm(true);
  };

  const handlePaymentFormSuccess = () => {
    setShowPaymentForm(false);
    setEditingPayment(null);
    handleRefreshPayments();
  };

  const handlePaymentFormCancel = () => {
    setShowPaymentForm(false);
    setEditingPayment(null);
  };
  return (
    <>
      <Card className="w-full">
        <CardHeader className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 sm:gap-0">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-xl sm:text-2xl truncate">{localSupplier.name}</CardTitle>
              <CardDescription className="mt-2">
                {localSupplier.contactPerson && <span className="block text-sm sm:text-base">Contact: {localSupplier.contactPerson}</span>}
                <div className="flex flex-col sm:flex-row sm:items-center mt-1 gap-2 sm:gap-0">
                  <Badge variant={localSupplier.isActive ? "default" : "outline"} className="cursor-pointer w-fit" onClick={handleToggleStatus}>
                    {localSupplier.isActive ? "Active" : "Inactive"}
                  </Badge>
                  <span className="text-xs sm:text-sm text-muted-foreground flex items-center">
                    <Calendar className="h-3 w-3 mr-1 flex-shrink-0" />
                    Added {formatDate(localSupplier.createdAt)}
                  </span>
                </div>
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2 w-full sm:w-auto justify-start sm:justify-end">
              {onEdit && (
                <Button variant="outline" size="sm" onClick={onEdit} disabled={loading} className="flex-1 sm:flex-initial">
                  <Edit className="h-4 w-4 mr-1" />
                </Button>
              )}
              {onDelete && (
                <Button variant="destructive" size="sm" onClick={onDelete} disabled={loading} className="flex-1 sm:flex-initial">
                  <Trash2 className="h-4 w-4 mr-1" />
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={handleRefresh} disabled={loading} className="flex-1 sm:flex-initial">
                {loading && "Refreshing..."}
                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""} sm:ml-1`} />
              </Button>
            </div>
          </div>
        </CardHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 p-1">
            <TabsTrigger value="details" className="text-xs sm:text-sm py-2">
              Details
            </TabsTrigger>
            <TabsTrigger value="payments" className="text-xs sm:text-sm py-2">
              Payments
            </TabsTrigger>
          </TabsList>

          <TabsContent value="details">
            <CardContent className="pt-4 sm:pt-6 px-4 sm:px-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-3 sm:space-y-4">
                  {localSupplier.email && (
                    <div className="flex items-start">
                      <Mail className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-medium">Email</p>
                        <p className="text-xs sm:text-sm break-words">{localSupplier.email}</p>
                      </div>
                    </div>
                  )}

                  {localSupplier.phone && (
                    <div className="flex items-start">
                      <Phone className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-medium">Phone</p>
                        <p className="text-xs sm:text-sm">{localSupplier.phone}</p>
                      </div>
                    </div>
                  )}

                  {localSupplier.address && (
                    <div className="flex items-start">
                      <MapPin className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-medium">Address</p>
                        <p className="text-xs sm:text-sm whitespace-pre-line break-words">{localSupplier.address}</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-3 sm:space-y-4">
                  {localSupplier.notes && (
                    <div className="flex items-start">
                      <FileText className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-medium">Notes</p>
                        <p className="text-xs sm:text-sm whitespace-pre-line break-words">{localSupplier.notes}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-start">
                    <ToggleLeft className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs sm:text-sm font-medium">Status</p>
                      <p className="text-xs sm:text-sm">{localSupplier.isActive ? "Active supplier" : "Inactive supplier"}</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </TabsContent>

          <TabsContent value="payments">
            <CardContent className="pt-4 sm:pt-6 px-4 sm:px-6">
              {paymentStats && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
                  <Card className="sm:col-span-1">
                    <CardHeader className="py-3 sm:py-4 px-3 sm:px-6">
                      <CardTitle className="text-xs sm:text-sm font-medium">Total Paid</CardTitle>
                    </CardHeader>
                    <CardContent className="py-2 px-3 sm:px-6">
                      <p className="text-xl sm:text-2xl font-bold">{formatCurrency(paymentStats.totalPaid)}</p>
                    </CardContent>
                  </Card>

                  <Card className="sm:col-span-1">
                    <CardHeader className="py-3 sm:py-4 px-3 sm:px-6">
                      <CardTitle className="text-xs sm:text-sm font-medium">Total Due</CardTitle>
                    </CardHeader>
                    <CardContent className="py-2 px-3 sm:px-6">
                      <p className="text-xl sm:text-2xl font-bold">{formatCurrency(paymentStats.totalDue)}</p>
                    </CardContent>
                  </Card>

                  <Card className="sm:col-span-2 lg:col-span-1">
                    <CardHeader className="py-3 sm:py-4 px-3 sm:px-6">
                      <CardTitle className="text-xs sm:text-sm font-medium">Last Payment</CardTitle>
                    </CardHeader>
                    <CardContent className="py-2 px-3 sm:px-6">
                      <p className="text-xl sm:text-2xl font-bold text-center sm:text-left">{paymentStats.lastPaymentDate ? formatDate(paymentStats.lastPaymentDate) : "No payments"}</p>
                    </CardContent>
                  </Card>
                </div>
              )}

              <PaymentsTable supplierId={localSupplier.id} payments={payments} loading={paymentsLoading} onEdit={handleEditPayment} onDelete={handleDeletePayment} onRefresh={handleRefreshPayments} onAdd={handleAddPayment} />
            </CardContent>
          </TabsContent>
        </Tabs>

        <CardFooter className="border-t px-4 sm:px-6 py-3 sm:py-4">
          <p className="text-xs text-muted-foreground">
            Supplier ID: {localSupplier.id} • Last updated: {formatDate(localSupplier.updatedAt || localSupplier.createdAt)}
          </p>
        </CardFooter>
      </Card>
      <Dialog open={showPaymentForm} onOpenChange={setShowPaymentForm}>
        <DialogContent className="w-[95vw] max-w-[600px] sm:w-full">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">{editingPayment ? `Edit Payment #${editingPayment.referenceNumber || editingPayment.id}` : "Add New Payment"}</DialogTitle>
          </DialogHeader>
          <PaymentForm supplierId={localSupplier.id} payment={editingPayment || undefined} stockEntries={allStockEntries} stockEntriesLoading={stockEntriesLoading} onSuccess={handlePaymentFormSuccess} onCancel={handlePaymentFormCancel} />
        </DialogContent>
      </Dialog>
      {/* <Dialog open={showPaymentForm} onOpenChange={setShowPaymentForm}>
        <DialogContent className="w-[95vw] max-w-[600px] sm:w-full">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">{editingPayment ? `Edit Payment #${editingPayment.referenceNumber || editingPayment.id}` : "Add New Payment"}</DialogTitle>
          </DialogHeader>
          <PaymentForm
            supplierId={localSupplier.id}
            payment={editingPayment || undefined}
            SuppliersStockEntries={SuppliersStockEntries}
            SuppliersStockEntriesLoading={SuppliersStockEntriesLoading}
            onSuccess={handlePaymentFormSuccess}
            onCancel={handlePaymentFormCancel}
          />
        </DialogContent>
      </Dialog> */}
    </>
  );
};

export default SupplierDetail;
