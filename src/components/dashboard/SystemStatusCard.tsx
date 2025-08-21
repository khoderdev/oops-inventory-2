import React from "react";
import { Activity, Calendar, Clock, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface SystemStatusCardProps {
  user: {
    role?: string;
  };
  currentDay?: {
    status: string;
    openedAt: string;
  };
}

export const SystemStatusCard: React.FC<SystemStatusCardProps> = ({ user, currentDay }) => {
  return (
    <Card className="bg-gradient-to-br from-slate-50 to-gray-100 border-slate-200">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl flex items-center gap-3">
          <div className="p-2 bg-green-100 rounded-lg">
            <Activity className="h-6 w-6 text-green-600" />
          </div>
          System Status
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white sm:p-6 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-center mb-3">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse mr-2"></div>
              <span className="text-xs font-medium text-green-700 uppercase tracking-wide">Live</span>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 mb-1">Online</div>
              <div className="text-xs text-gray-500 font-medium">System Status</div>
            </div>
          </div>
          
          <div className="bg-white sm:p-6 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-center mb-3">
              <Calendar className="h-4 w-4 text-blue-600 mr-2" />
              <span className="text-xs font-medium text-blue-700 uppercase tracking-wide">Today</span>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 mb-1">
                {new Date().toLocaleDateString("en-US", { 
                  month: "short", 
                  day: "numeric" 
                })}
              </div>
              <div className="text-xs text-gray-500 font-medium">
                {new Date().toLocaleDateString("en-US", { 
                  weekday: "long",
                  year: "numeric"
                })}
              </div>
            </div>
          </div>
          
          <div className="bg-white sm:p-6 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-center mb-3">
              <div className="p-1 bg-purple-100 rounded-full mr-2">
                <Users className="h-3 w-3 text-purple-600" />
              </div>
              <span className="text-xs font-medium text-purple-700 uppercase tracking-wide">Role</span>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600 mb-1 capitalize">
                {user?.role}
              </div>
              <div className="text-xs text-gray-500 font-medium">Access Level</div>
            </div>
          </div>
          
          <div className="bg-white sm:p-6 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-center mb-3">
              <Clock className="h-4 w-4 text-orange-600 mr-2" />
              <span className="text-xs font-medium text-orange-700 uppercase tracking-wide">
                {currentDay?.status === "opened" ? "Opened" : "Status"}
              </span>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600 mb-1">
                {currentDay && currentDay.status === "opened" 
                  ? new Date(currentDay.openedAt).toLocaleTimeString("en-US", { 
                      hour: "2-digit", 
                      minute: "2-digit",
                      hour12: true 
                    })
                  : 'Closed'
                }
              </div>
              <div className="text-xs text-gray-500 font-medium">
                {currentDay?.status === "opened" ? "Day Started" : "Day Status"}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SystemStatusCard;
