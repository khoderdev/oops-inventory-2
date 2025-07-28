import { AlertCircle, Eye, EyeOff, Loader2, Lock, User } from "lucide-react";
import React, { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { getErrorFields, getErrorMessage } from "../../utils/errorUtils";
import { Alert, AlertDescription } from "../ui/alert";
import { Button } from "../ui/button";
import { CardContent } from "../ui/card";
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
  const [isClient, setIsClient] = useState(false);

  // Handle client-side rendering
  useEffect(() => {
    setIsClient(true);
  }, []);

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
    } catch (err: unknown) {
      console.error("Login error:", err);
      const apiError = err as ApiErrorResponse;
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

  if (!isClient || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#4682b4] to-[#6ba4d3] dark:from-gray-900 dark:to-gray-800">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-100 dark:text-blue-300" />
          <div className="h-10 w-64 bg-blue-200/30 dark:bg-gray-700 rounded animate-pulse" />
          <div className="h-64 w-96 bg-blue-200/30 dark:bg-gray-700 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-start justify-center bg-cover bg-center relative p-4 sm:p-6 lg:p-16 overflow-hidden" style={{ backgroundImage: "url('/bg.jpe')" }}>
      <div className="absolute inset-0 bg-[#4682b4] opacity-80 z-0" />

      <div className="max-w-md w-full space-y-8 z-10 relative">
        <div className="flex flex-col items-center justify-center space-y-4">
          <h1 className="text-7xl sm:text-9xl font-serif font-bold text-white tracking-tight">oOps</h1>
          <p className="text-2xl font-semibold !mt-6 text-gray-200">BackOffice</p>
        </div>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <Alert variant="destructive" className="animate-in fade-in slide-in-from-top-5">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-4">
              <div>
                <Label htmlFor="username" className={`transition-colors ${fieldErrors.includes("username") ? "text-red-600" : "text-gray-700 dark:text-gray-300"}`}>
                  Username
                </Label>
                <div className="relative mt-1">
                  <Input
                    id="username"
                    name="username"
                    type="text"
                    autoComplete="username"
                    autoFocus
                    required
                    value={formData.username}
                    onChange={handleInputChange}
                    placeholder="Enter your username"
                    className={`
                        pl-10 transition-all duration-300
                        ${fieldErrors.includes("username") ? "border-red-500 focus:border-red-500 focus:ring-red-500" : "border-gray-300 dark:border-gray-600 focus:border-amber-500 focus:ring-amber-500"}
                        bg-white dark:bg-gray-900
                        hover:border-amber-400
                      `}
                    disabled={isSubmitting}
                  />
                  <User
                    className={`
                        absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4
                        ${fieldErrors.includes("username") ? "text-red-400" : "text-gray-400 dark:text-gray-500"}
                      `}
                  />
                </div>
                {fieldErrors.includes("username") && <p className="mt-1 text-sm text-red-600 animate-in fade-in">Please check your username</p>}
              </div>

              <div>
                <Label htmlFor="password" className={`transition-colors ${fieldErrors.includes("password") ? "text-red-600" : "text-gray-700 dark:text-gray-300"}`}>
                  Password
                </Label>
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
                    className={`
                        pl-10 pr-10 transition-all duration-300
                        ${fieldErrors.includes("password") ? "border-red-500 focus:border-red-500 focus:ring-red-500" : "border-gray-300 dark:border-gray-600 focus:border-amber-500 focus:ring-amber-500"}
                        bg-white dark:bg-gray-900
                        hover:border-amber-400
                      `}
                    disabled={isSubmitting}
                  />
                  <Lock
                    className={`
                        absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4
                        ${fieldErrors.includes("password") ? "text-red-400" : "text-gray-400 dark:text-gray-500"}
                      `}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors" disabled={isSubmitting} aria-label={showPassword ? "Hide password" : "Show password"}>
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {fieldErrors.includes("password") && <p className="mt-1 text-sm text-red-600 animate-in fade-in">Please check your password</p>}
              </div>
            </div>

            <Button
              type="submit"
              className="
                  w-full bg-teal-500 hover:bg-teal-600 
                  dark:bg-teal-500 dark:hover:bg-teal-600   
                  text-white font-semibold 
                  transition-all duration-300 
                  transform hover:scale-105
                  disabled:bg-teal-400 disabled:cursor-not-allowed
                "
              disabled={!isFormValid || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Logging in...
                </>
              ) : (
                "Log In"
              )}
            </Button>
          </form>
        </CardContent>
      </div>
    </div>
  );
};

export default LoginPage;
