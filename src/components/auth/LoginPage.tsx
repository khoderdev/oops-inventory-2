import { AlertCircle, Eye, EyeOff, Loader2, Lock, User } from "lucide-react";
import React, { useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { getErrorFields, getErrorMessage } from "../../utils/errorUtils";
import { Alert, AlertDescription } from "../ui/alert";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { Input } from "../ui/input";
import { Label } from "../ui/label";

// Type for API error responses
interface ApiErrorResponse {
  response?: { 
    data?: Record<string, unknown>;
    status?: number;
  }; 
  message?: string; 
  code?: string; 
  status?: number; 
  field?: string; 
  fields?: string[]; 
  attemptsLeft?: number; 
  lockTimeLeft?: number;
}

const LoginPage: React.FC = () => {
  const { login, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  const [formData, setFormData] = useState({
    username: "",
    password: ""
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect if already authenticated
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || "/";
  if (isAuthenticated && !isLoading) {
    return <Navigate to={from} replace />;
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear errors when user starts typing
    if (error) {
      setError("");
      setFieldErrors([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setFieldErrors([]);
    setIsSubmitting(true);

    try {
      await login(formData);
      // Navigation will be handled by the Navigate component above
    } catch (err: unknown) {
      console.error("Login error:", err);

      // The error from HTTP client is already processed by handleError method
      const apiError = err as ApiErrorResponse;

      // Transform to match ApiError interface
      const transformedError = {
        message: apiError.message || "Login failed",
        code: apiError.code,
        status: apiError.status,
        field: apiError.field,
        fields: apiError.fields,
        attemptsLeft: apiError.attemptsLeft,
        lockTimeLeft: apiError.lockTimeLeft,
        details: apiError.response?.data
      };
      
      const errorMessage = getErrorMessage(transformedError);
      const errorFields = getErrorFields(transformedError);

      setError(errorMessage);
      setFieldErrors(errorFields);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = formData.username.trim() && formData.password.trim();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">oOps BackOffice</h1>
        </div>

        <Card>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6 py-8">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-4">
                <div>
                  <Label htmlFor="username" className={fieldErrors.includes("username") ? "text-red-600" : ""}>
                    Username or Email
                  </Label>
                  <div className="relative mt-1">
                    <Input id="username" name="username" type="text" autoComplete="username" required value={formData.username} onChange={handleInputChange} placeholder="Enter your username" className={`pl-10 ${fieldErrors.includes("username") ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""}`} disabled={isSubmitting} />
                    <User className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${fieldErrors.includes("username") ? "text-red-400" : "text-gray-400"}`} />
                  </div>
                  {fieldErrors.includes("username") && <p className="mt-1 text-sm text-red-600">Please check your username</p>}
                </div>

                <div>
                  <Label htmlFor="password" className={fieldErrors.includes('password') ? 'text-red-600' : ''}>Password</Label>
                  <div className="relative mt-1">
                    <Input 
                      id="password" 
                      name="password" 
                      type={showPassword ? "text" : "password"} 
                      autoComplete="current-password" 
                      required 
                      value={formData.password} 
                      onChange={handleInputChange} 
                      placeholder="Enter your password" 
                      className={`pl-10 pr-10 ${
                        fieldErrors.includes('password') 
                          ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
                          : ''
                      }`} 
                      disabled={isSubmitting} 
                    />
                    <Lock className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${
                      fieldErrors.includes('password') ? 'text-red-400' : 'text-gray-400'
                    }`} />
                    <button 
                      type="button" 
                      onClick={() => setShowPassword(!showPassword)} 
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600" 
                      disabled={isSubmitting}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {fieldErrors.includes('password') && (
                    <p className="mt-1 text-sm text-red-600">Please check your password</p>
                  )}
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={!isFormValid || isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign in"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LoginPage;
