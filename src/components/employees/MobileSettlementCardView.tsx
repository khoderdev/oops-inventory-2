import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, CheckCircle, DollarSign, Trash2 } from "lucide-react";
import { MobileSettlementCardViewProps, SettlementStatus } from "@/types/employee";
import { formatDate } from "@/utils/formatDate";
import { formatCurrency } from "@/utils/conversionLogic";

const MobileSettlementCardView = ({ settlements, onViewDetails, onApprove, onMarkAsPaid, onDelete, canDeleteSettlement, canForceDelete, statusColors }: MobileSettlementCardViewProps) => {
  return (
    <div className="space-y-4 p-4">
      {settlements.map(settlement => (
        <Card key={settlement.id} className="overflow-hidden shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-3 px-4 pt-4">
            <div className="flex justify-between items-start space-x-2">
              <div className="min-w-0">
                <div className="flex items-center space-x-2">
                  <CardTitle className="text-lg font-bold truncate">
                    {settlement.employee?.firstName} {settlement.employee?.lastName}
                  </CardTitle>
                </div>
                <div className="flex items-center mt-1 space-x-2">
                  <span className="text-sm text-muted-foreground">#{settlement.employee?.employeeNumber}</span>
                  <span className="text-muted-foreground">•</span>
                  <span className="text-sm text-muted-foreground">{formatDate(new Date(settlement.settlementDate), "MMM d, yyyy")}</span>
                </div>
              </div>
              <Badge variant="secondary" className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[settlement.status as SettlementStatus]}`}>
                {settlement.status}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="pb-4 px-4">
            {/* Usage Items Summary */}
            <div className="flex items-center justify-between bg-muted/30 rounded-lg px-3 py-2.5 mb-4">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium">Items:</span>
                <span className="text-sm text-muted-foreground">{settlement.usageItemsCount} usage items</span>
              </div>
            </div>

            {/* Financial Summary */}
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="space-y-1 p-3 bg-muted/50 rounded-lg">
                <div className="text-xs font-medium text-muted-foreground">Base Salary</div>
                <div className="font-mono text-base font-semibold">{formatCurrency(Number(settlement.baseSalary))}</div>
              </div>

              <div className="space-y-1 p-3 bg-muted/50 rounded-lg">
                <div className="text-xs font-medium text-muted-foreground">Deductions</div>
                <div className="font-mono text-base font-semibold text-destructive">-{formatCurrency(Number(settlement.totalDeduction))}</div>
              </div>

              <div className="space-y-1 p-3 bg-primary/5 rounded-lg  border border-primary/10">
                <div className="text-xs font-medium text-muted-foreground">Final Salary</div>
                <div className="font-mono text-lg font-bold text-primary">{formatCurrency(Number(settlement.finalSalary))}</div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between items-center pt-3 border-t">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={(e) => {
                  e.stopPropagation();
                  onViewDetails(settlement);
                }} 
                className="h-8 px-3 text-xs font-medium text-primary hover:bg-primary/5"
              >
                <Eye className="h-3.5 w-3.5 mr-1.5" />
                View Details
              </Button>

              <div className="flex items-center space-x-1">
                {settlement.status === "pending" && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={(e) => {
                      e.stopPropagation();
                      onApprove(settlement.id);
                    }} 
                    className="h-8 px-3 text-xs font-medium text-blue-600 hover:bg-blue-50"
                  >
                    <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
                    Approve
                  </Button>
                )}

                {settlement.status === "approved" && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={(e) => {
                      e.stopPropagation();
                      onMarkAsPaid(settlement.id);
                    }} 
                    className="h-8 px-3 text-xs font-medium text-green-600 hover:bg-green-50"
                  >
                    <DollarSign className="h-3.5 w-3.5 mr-1.5" />
                    Mark Paid
                  </Button>
                )}

                {(canDeleteSettlement(settlement) || canForceDelete) && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(settlement);
                    }} 
                    className="h-8 px-3 text-xs font-medium text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                    Delete
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {settlements.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="text-muted-foreground mb-2">No settlements found</div>
          <div className="text-sm text-muted-foreground/70">Create a new settlement to get started</div>
        </div>
      )}
    </div>
  );
};

export default MobileSettlementCardView;
