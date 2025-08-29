import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Users, CreditCard, Activity } from "lucide-react";
import { useSupplierSummary } from "@/hooks/useSuppliers";
import { Skeleton } from "@/components/ui/skeleton";

export function SupplierSummary() {
  const { data: summary, isLoading } = useSupplierSummary();

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-[100px]" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-[100px] mt-2" />
              <Skeleton className="h-4 w-[120px] mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!summary) {
    return null;
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const cards = [
    {
      title: "Total Suppliers",
      value: summary.totalSuppliers,
      description: `${summary.activeSuppliers} active, ${summary.inactiveSuppliers} inactive`,
      icon: Users,
    },
    {
      title: "Total Outstanding",
      value: formatCurrency(summary.totalOutstandingBalance),
      description: "Across all suppliers",
      icon: DollarSign,
    },
    {
      title: "Avg. Days to Pay",
      value: summary.avgDaysToPay.toFixed(1),
      description: "Average payment period",
      icon: CreditCard,
    },
    {
      title: "Active Contracts",
      value: summary.activeContracts,
      description: "With active agreements",
      icon: Activity,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              <p className="text-xs text-muted-foreground">{card.description}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
