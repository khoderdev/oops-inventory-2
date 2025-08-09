import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { usePermissions } from "@/hooks/usePermissions";
import { ArrowLeft, Construction, User, Shield, Clock } from "lucide-react";
import React from "react";
import { useNavigate } from "react-router-dom";

interface PlaceholderPageProps {
  title: string;
  description: string;
  icon?: React.ComponentType<{ className?: string }>;
  showBackButton?: boolean;
  showUserInfo?: boolean;
  children?: React.ReactNode;
}

const PlaceholderPage: React.FC<PlaceholderPageProps> = ({
  title,
  description,
  icon: Icon = Construction,
  showBackButton = true,
  showUserInfo = true,
  children
}) => {
  const navigate = useNavigate();
  const { user, userRole, grantedPermissions } = usePermissions();

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleGoHome = () => {
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          {showBackButton && (
            <Button
              variant="ghost"
              onClick={handleGoBack}
              className="mb-4 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          )}
          
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Icon className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
              <p className="text-gray-600 mt-1">{description}</p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Primary Content */}
          <div className="lg:col-span-2">
            <Card className="border-2 border-dashed border-gray-300 bg-white/50">
              <CardHeader className="text-center py-12">
                <div className="mx-auto mb-4 p-4 bg-orange-100 rounded-full w-fit">
                  <Construction className="h-12 w-12 text-orange-600" />
                </div>
                <CardTitle className="text-2xl text-gray-700">
                  Feature Under Development
                </CardTitle>
                <CardDescription className="text-lg text-gray-500 max-w-md mx-auto">
                  This feature is currently being developed and will be available in a future update.
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center pb-12">
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button onClick={handleGoHome} className="bg-blue-600 hover:bg-blue-700">
                    Go to Dashboard
                  </Button>
                  <Button variant="outline" onClick={handleGoBack}>
                    Go Back
                  </Button>
                </div>
                
                {children && (
                  <div className="mt-8 pt-8 border-t border-gray-200">
                    {children}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* User Information */}
            {showUserInfo && user && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <User className="h-5 w-5" />
                    User Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Name</p>
                    <p className="text-gray-900">{user.fullName}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Role</p>
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-blue-600" />
                      <span className="capitalize text-gray-900 font-medium">
                        {userRole}
                      </span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Permissions</p>
                    <p className="text-gray-600 text-sm">
                      {grantedPermissions.length} permissions granted
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Development Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Clock className="h-5 w-5" />
                  Development Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Planning</span>
                    <span className="text-green-600 font-medium">✓ Complete</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Design</span>
                    <span className="text-green-600 font-medium">✓ Complete</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Development</span>
                    <span className="text-orange-600 font-medium">⏳ In Progress</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Testing</span>
                    <span className="text-gray-400 font-medium">⏸ Pending</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Release</span>
                    <span className="text-gray-400 font-medium">⏸ Pending</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  variant="outline" 
                  className="w-full justify-start" 
                  onClick={handleGoHome}
                >
                  Dashboard
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start" 
                  onClick={() => navigate("/profile")}
                >
                  Profile Settings
                </Button>
                {userRole !== "staff" && (
                  <Button 
                    variant="outline" 
                    className="w-full justify-start" 
                    onClick={() => navigate("/reports")}
                  >
                    Reports
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlaceholderPage;
