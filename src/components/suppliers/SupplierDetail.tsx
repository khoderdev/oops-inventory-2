// import React, { useState, useEffect } from "react";
// import { SupplierDetailProps, SupplierPayment } from "@/types/suppliers";
// import { useSuppliersContext } from "@/context/SuppliersContext";
// import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Badge } from "@/components/ui/badge";
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// import { Edit, Trash2, Mail, Phone, MapPin, FileText, ToggleLeft, Calendar } from "lucide-react";
// import PaymentsTable from "./PaymentsTable";
// import { formatDate } from "@/utils/formatDate";
// import { formatCurrency } from "@/utils/conversionLogic";
// import { suppliersAPI } from "@/api/suppliers.api";

// export const SupplierDetail: React.FC<SupplierDetailProps> = ({ supplier, onEdit, onDelete }) => {
//   const { toggleSupplierStatus, getSupplierPayments } = useSuppliersContext();
//   const [payments, setPayments] = useState<SupplierPayment[]>([]);
//   const [paymentsLoading, setPaymentsLoading] = useState(false);
//   const [paymentStats, setPaymentStats] = useState<{ totalPaid: number; totalDue: number; lastPaymentDate: string | null; } | null>(null);
//   const [activeTab, setActiveTab] = useState("details");
//   const [localSupplier, setLocalSupplier] = useState(supplier);

//   // Fetch payments when needed
//   useEffect(() => {
//     if (activeTab === "payments") {
//       setPaymentsLoading(true);
//       getSupplierPayments(localSupplier.id).then(response => {
//         if (response) {
//           setPayments(response);
//         }
//         setPaymentsLoading(false);
//       });
//     }
//   }, [activeTab, localSupplier.id, getSupplierPayments]);

//   // Fetch payment statistics when tab changes to payments
//   useEffect(() => {
//     if (activeTab === "payments") {
//       suppliersAPI.getSupplierPaymentStats(localSupplier.id).then(response => {
//         const stats = response.data;
//         if (stats) {
//           // Transform the API response into the format expected by the component
//           const totalPaid = stats.paymentCountByStatus.filter(item => item.status === "paid").reduce((sum, item) => sum + item.total, 0);

//           const totalDue = stats.paymentCountByStatus.filter(item => ["pending", "partial", "overdue"].includes(item.status)).reduce((sum, item) => sum + item.total, 0);

//           const lastPaymentDate = stats.recentPayments.length > 0 ? stats.recentPayments[0].paymentDate : null;

//           setPaymentStats({
//             totalPaid,
//             totalDue,
//             lastPaymentDate
//           });
//         }
//       });
//     }
//   }, [activeTab, localSupplier.id]);

//   // Handle toggle status
//   const handleToggleStatus = async () => {
//     // Update local state immediately for instant UI feedback
//     setLocalSupplier(prev => ({
//       ...prev,
//       isActive: !prev.isActive
//     }));

//     // Call API to update the server
//     await toggleSupplierStatus(supplier.id);
//   };

//   return (
//     <Card className="w-full">
//       <CardHeader>
//         <div className="flex justify-between items-start">
//           <div>
//             <CardTitle className="text-2xl">{localSupplier.name}</CardTitle>
//             <CardDescription>
//               {localSupplier.contactPerson && <span className="block">Contact: {localSupplier.contactPerson}</span>}
//               <div className="flex items-center mt-1">
//                 <Badge variant={localSupplier.isActive ? "default" : "outline"} className="cursor-pointer" onClick={handleToggleStatus}>
//                   {localSupplier.isActive ? "Active" : "Inactive"}
//                 </Badge>
//                 <span className="text-sm text-muted-foreground ml-2 flex items-center">
//                   <Calendar className="h-3 w-3 mr-1" />
//                   Added {formatDate(localSupplier.createdAt)}
//                 </span>
//               </div>
//             </CardDescription>
//           </div>
//           <div className="flex gap-2">
//             {onEdit && (
//               <Button variant="outline" size="sm" onClick={onEdit}>
//                 <Edit className="h-4 w-4 mr-1" /> Edit
//               </Button>
//             )}
//             {onDelete && (
//               <Button variant="destructive" size="sm" onClick={onDelete}>
//                 <Trash2 className="h-4 w-4 mr-1" /> Delete
//               </Button>
//             )}
//           </div>
//         </div>
//       </CardHeader>

//       <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
//         <TabsList className="grid w-full grid-cols-2">
//           <TabsTrigger value="details">Details</TabsTrigger>
//           <TabsTrigger value="payments">Payments</TabsTrigger>
//         </TabsList>

//         <TabsContent value="details">
//           <CardContent className="pt-6">
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//               <div className="space-y-4">
//                 {localSupplier.email && (
//                   <div className="flex items-start">
//                     <Mail className="h-5 w-5 mr-2 text-muted-foreground mt-0.5" />
//                     <div>
//                       <p className="text-sm font-medium">Email</p>
//                       <p className="text-sm">{localSupplier.email}</p>
//                     </div>
//                   </div>
//                 )}

//                 {localSupplier.phone && (
//                   <div className="flex items-start">
//                     <Phone className="h-5 w-5 mr-2 text-muted-foreground mt-0.5" />
//                     <div>
//                       <p className="text-sm font-medium">Phone</p>
//                       <p className="text-sm">{localSupplier.phone}</p>
//                     </div>
//                   </div>
//                 )}

//                 {localSupplier.address && (
//                   <div className="flex items-start">
//                     <MapPin className="h-5 w-5 mr-2 text-muted-foreground mt-0.5" />
//                     <div>
//                       <p className="text-sm font-medium">Address</p>
//                       <p className="text-sm whitespace-pre-line">{localSupplier.address}</p>
//                     </div>
//                   </div>
//                 )}
//               </div>

//               <div className="space-y-4">
//                 {localSupplier.notes && (
//                   <div className="flex items-start">
//                     <FileText className="h-5 w-5 mr-2 text-muted-foreground mt-0.5" />
//                     <div>
//                       <p className="text-sm font-medium">Notes</p>
//                       <p className="text-sm whitespace-pre-line">{localSupplier.notes}</p>
//                     </div>
//                   </div>
//                 )}

//                 <div className="flex items-start">
//                   <ToggleLeft className="h-5 w-5 mr-2 text-muted-foreground mt-0.5" />
//                   <div>
//                     <p className="text-sm font-medium">Status</p>
//                     <p className="text-sm">{localSupplier.isActive ? "Active supplier" : "Inactive supplier"}</p>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </CardContent>
//         </TabsContent>

//         <TabsContent value="payments">
//           <CardContent className="pt-6">
//             {paymentStats && (
//               <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
//                 <Card>
//                   <CardHeader className="py-4">
//                     <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
//                   </CardHeader>
//                   <CardContent className="py-2">
//                     <p className="text-2xl font-bold">{paymentStats.totalPaid}</p>
//                   </CardContent>
//                 </Card>

//                 <Card>
//                   <CardHeader className="py-4">
//                     <CardTitle className="text-sm font-medium">Total Due</CardTitle>
//                   </CardHeader>
//                   <CardContent className="py-2">
//                     <p className="text-2xl font-bold">{formatCurrency(paymentStats.totalDue)}</p>
//                   </CardContent>
//                 </Card>

//                 <Card>
//                   <CardHeader className="py-4">
//                     <CardTitle className="text-sm font-medium">Last Payment</CardTitle>
//                   </CardHeader>
//                   <CardContent className="py-2">
//                     <p className="text-2xl font-bold">{paymentStats.lastPaymentDate ? formatDate(paymentStats.lastPaymentDate) : "No payments"}</p>
//                   </CardContent>
//                 </Card>
//               </div>
//             )}

//             <PaymentsTable supplierId={localSupplier.id} payments={payments} loading={paymentsLoading} />
//           </CardContent>
//         </TabsContent>
//       </Tabs>

//       <CardFooter className="border-t px-6 py-4">
//         <p className="text-xs text-muted-foreground">
//           Supplier ID: {localSupplier.id} • Last updated: {formatDate(localSupplier.updatedAt || localSupplier.createdAt)}
//         </p>
//       </CardFooter>
//     </Card>
//   );
// };

// export default SupplierDetail;
import React, { useState, useEffect } from "react";
import { SupplierDetailProps, SupplierPayment } from "@/types/suppliers";
import { useSuppliersContext } from "@/context/SuppliersContext";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Edit, Trash2, Mail, Phone, MapPin, FileText, ToggleLeft, Calendar } from "lucide-react";
import PaymentsTable from "./PaymentsTable";
import { formatDate } from "@/utils/formatDate";
import { formatCurrency } from "@/utils/conversionLogic";
import { suppliersAPI } from "@/api/suppliers.api";

export const SupplierDetail: React.FC<SupplierDetailProps> = ({ supplier, onEdit, onDelete }) => {
  const { toggleSupplierStatus, getSupplierPayments, loading, refresh } = useSuppliersContext();
  const [payments, setPayments] = useState<SupplierPayment[]>([]);
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  
  const [paymentStats, setPaymentStats] = useState<{
    totalPaid: number;
    totalDue: number;
    lastPaymentDate: string | null;
  } | null>(null);

  const [activeTab, setActiveTab] = useState("details");
  const [localSupplier, setLocalSupplier] = useState(supplier);

  // Fetch payment statistics when tab changes to payments
  useEffect(() => {
    if (activeTab === "payments") {
      suppliersAPI.getSupplierPaymentStats(localSupplier.id).then(response => {
        const stats = response.data;
        if (stats) {
          // Transform the API response into the format expected by the component
          const totalPaid = stats.paymentCountByStatus.filter(item => item.status === "paid").reduce((sum, item) => sum + item.total, 0);

          const totalDue = stats.paymentCountByStatus.filter(item => ["pending", "partial", "overdue"].includes(item.status)).reduce((sum, item) => sum + item.total, 0);

          const lastPaymentDate = stats.recentPayments.length > 0 ? stats.recentPayments[0].paymentDate : null;

          setPaymentStats({
            totalPaid,
            totalDue,
            lastPaymentDate
          });
        }
      });
    }
  }, [activeTab, localSupplier.id]);

  // Handle toggle status
  const handleToggleStatus = async () => {
    // Update local state immediately for instant UI feedback
    setLocalSupplier(prev => ({
      ...prev,
      isActive: !prev.isActive
    }));

    // Call API to update the server
    await toggleSupplierStatus(supplier.id);
  };

  // Handle refresh
  const handleRefresh = async () => {
    await refresh();
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-2xl">{localSupplier.name}</CardTitle>
            <CardDescription>
              {localSupplier.contactPerson && <span className="block">Contact: {localSupplier.contactPerson}</span>}
              <div className="flex items-center mt-1">
                <Badge variant={localSupplier.isActive ? "default" : "outline"} className="cursor-pointer" onClick={handleToggleStatus}>
                  {localSupplier.isActive ? "Active" : "Inactive"}
                </Badge>
                <span className="text-sm text-muted-foreground ml-2 flex items-center">
                  <Calendar className="h-3 w-3 mr-1" />
                  Added {formatDate(localSupplier.createdAt)}
                </span>
              </div>
            </CardDescription>
          </div>
          <div className="flex gap-2">
            {onEdit && (
              <Button variant="outline" size="sm" onClick={onEdit} disabled={loading}>
                <Edit className="h-4 w-4 mr-1" /> Edit
              </Button>
            )}
            {onDelete && (
              <Button variant="destructive" size="sm" onClick={onDelete} disabled={loading}>
                <Trash2 className="h-4 w-4 mr-1" /> Delete
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={loading}>
              {loading ? "Refreshing..." : "Refresh"}
            </Button>
          </div>
        </div>
      </CardHeader>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
        </TabsList>

        <TabsContent value="details">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                {localSupplier.email && (
                  <div className="flex items-start">
                    <Mail className="h-5 w-5 mr-2 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Email</p>
                      <p className="text-sm">{localSupplier.email}</p>
                    </div>
                  </div>
                )}

                {localSupplier.phone && (
                  <div className="flex items-start">
                    <Phone className="h-5 w-5 mr-2 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Phone</p>
                      <p className="text-sm">{localSupplier.phone}</p>
                    </div>
                  </div>
                )}

                {localSupplier.address && (
                  <div className="flex items-start">
                    <MapPin className="h-5 w-5 mr-2 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Address</p>
                      <p className="text-sm whitespace-pre-line">{localSupplier.address}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                {localSupplier.notes && (
                  <div className="flex items-start">
                    <FileText className="h-5 w-5 mr-2 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Notes</p>
                      <p className="text-sm whitespace-pre-line">{localSupplier.notes}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-start">
                  <ToggleLeft className="h-5 w-5 mr-2 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Status</p>
                    <p className="text-sm">{localSupplier.isActive ? "Active supplier" : "Inactive supplier"}</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </TabsContent>

        <TabsContent value="payments">
          <CardContent className="pt-6">
            {paymentStats && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Card>
                  <CardHeader className="py-4">
                    <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
                  </CardHeader>
                  <CardContent className="py-2">
                    <p className="text-2xl font-bold">{formatCurrency(paymentStats.totalPaid)}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="py-4">
                    <CardTitle className="text-sm font-medium">Total Due</CardTitle>
                  </CardHeader>
                  <CardContent className="py-2">
                    <p className="text-2xl font-bold">{formatCurrency(paymentStats.totalDue)}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="py-4">
                    <CardTitle className="text-sm font-medium">Last Payment</CardTitle>
                  </CardHeader>
                  <CardContent className="py-2">
                    <p className="text-2xl font-bold">{paymentStats.lastPaymentDate ? formatDate(paymentStats.lastPaymentDate) : "No payments"}</p>
                  </CardContent>
                </Card>
              </div>
            )}

            <PaymentsTable supplierId={localSupplier.id} payments={payments} loading={paymentsLoading} />
          </CardContent>
        </TabsContent>
      </Tabs>

      <CardFooter className="border-t px-6 py-4">
        <p className="text-xs text-muted-foreground">
          Supplier ID: {localSupplier.id} • Last updated: {formatDate(localSupplier.updatedAt || localSupplier.createdAt)}
        </p>
      </CardFooter>
    </Card>
  );
};

export default SupplierDetail;
