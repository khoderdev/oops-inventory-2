import React, { useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { getErrorMessage } from "../../utils/errorUtils";
import LockScreen from "../LockScreen";

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
  const { loginWithPin, isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();
  const [, setError] = useState("");
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname;
  
  if (isAuthenticated && !isLoading) {
    // Redirect staff users to /pos by default, others to their intended destination or dashboard
    const redirectTo = from || (user?.role === "staff" ? "/pos" : "/");
    return <Navigate to={redirectTo} replace />;
  }

  const handleSignIn = async (pin: string) => {
    try {
      setError("");
      await loginWithPin(pin, {
        deviceType: "web",
        deviceName: "Web Browser"
      });
    } catch (err) {
      const apiError = err as ApiErrorResponse;
      const errorWithMessage = {
        ...apiError,
        message: apiError.message || "An unexpected error occurred"
      };
      setError(getErrorMessage(errorWithMessage));
    }
  };

  const handleClear = () => {
    setError("");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return <LockScreen onSignIn={handleSignIn} onClear={handleClear} businessName="/oops-logo.png" region="oOps Resto-Café" version="1.0.0" />;
};

export default LoginPage;
