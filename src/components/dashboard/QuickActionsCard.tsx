import React from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface QuickAction {
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  permission?: string;
  badge?: string | number;
  color: string;
}

interface QuickActionsCardProps {
  actions: QuickAction[];
}

export const QuickActionsCard: React.FC<QuickActionsCardProps> = ({ actions }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Quick Actions</CardTitle>
        <CardDescription>Navigate to key areas of your restaurant management system</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
          {actions.map(action => (
            <Link key={action.href} to={action.href}>
              <Card className="bg-white sm:p-6 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-200 transform hover:scale-105">
                <CardContent className="p-4">
                  <div className="flex flex-col items-center text-center space-y-2">
                    <div className={`p-3 rounded-full text-white ${action.color} relative`}>
                      {action.icon}
                      {action.badge && (
                        <Badge variant="destructive" className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                          {action.badge}
                        </Badge>
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm">{action.title}</h3>
                      <p className="text-xs text-gray-600 mt-1">{action.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default QuickActionsCard;
