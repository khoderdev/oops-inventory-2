import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useSupplier } from "@/hooks/useSuppliers";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { Pencil, ArrowLeft, DollarSign, FileText, Calendar, CreditCard, AlertCircle } from "lucide-react";
import { SettlementList } from "./SettlementList";
import { OutstandingInvoices } from "./OutstandingInvoices";

export function SupplierDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const {
    data: supplier,
    isLoading,
    isError
  } = useSupplier(id || "", {
    includeInvoices: true,
    includeSettlements: true
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-1/3" />
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map(i => (
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
        <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
        <h3 className="mt-4 text-lg font-medium">Supplier not found</h3>
        <p className="mt-2 text-muted-foreground">The requested supplier could not be loaded.</p>
        <Button className="mt-4" onClick={() => navigate(-1)}>
          Go back
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h2 className="text-2xl font-bold">{supplier.name}</h2>
          <Badge variant={supplier.isActive ? "default" : "secondary"}>{supplier.isActive ? "Active" : "Inactive"}</Badge>
        </div>
        <Button onClick={() => navigate(`/suppliers/${supplier.id}/edit`)}>
          <Pencil className="mr-2 h-4 w-4" />
          Edit
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Contact Info</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <p className="font-medium">{supplier.contactPerson || "N/A"}</p>
              <p className="text-sm text-muted-foreground">{supplier.email || "No email"}</p>
              <p className="text-sm text-muted-foreground">{supplier.phone || "No phone"}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Payment Terms</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center">
                <CreditCard className="mr-2 h-4 w-4 text-muted-foreground" />
                <span>{supplier.paymentTerms} days</span>
              </div>
              <div className="flex items-center">
                <DollarSign className="mr-2 h-4 w-4 text-muted-foreground" />
                <span>Credit Limit: ${supplier.creditLimit?.toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center">
                <FileText className="mr-2 h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Tax ID: {supplier.taxId || "N/A"}</span>
              </div>
              <div className="flex items-center">
                <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Member since {format(new Date(supplier.createdAt), "MMM d, yyyy")}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="invoices" className="space-y-4">
        <TabsList>
          <TabsTrigger value="invoices">Outstanding Invoices</TabsTrigger>
          <TabsTrigger value="settlements">Payment History</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="invoices" className="space-y-4">
          <OutstandingInvoices supplierId={supplier.id} />
        </TabsContent>

        <TabsContent value="settlements" className="space-y-4">
          <SettlementList supplierId={supplier.id} />
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <div className="rounded-md border p-4">
            <p className="text-sm text-muted-foreground">Activity log coming soon.</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
