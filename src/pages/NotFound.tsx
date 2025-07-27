import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Home, ArrowLeft, Search, RefreshCw } from "lucide-react";
import { Button } from "../components/ui/button";
import { LOGO_CONFIGS, useCachedLogo } from "../utils/logoCache";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isAnimating, setIsAnimating] = useState(false);
  
  // Use cached logo for consistent branding
  const { logoSrc, isLoaded } = useCachedLogo(LOGO_CONFIGS.MAIN_LOGO);

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
    
    // Trigger animation on mount
    setIsAnimating(true);
  }, [location.pathname]);

  const handleGoHome = () => {
    navigate("/");
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-700 flex items-center justify-center p-4 overflow-hidden relative">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-400/20 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-400/10 rounded-full blur-3xl animate-pulse delay-500" />
      </div>

      {/* Main Content */}
      <div className={`relative z-10 text-center max-w-2xl mx-auto transition-all duration-1000 transform ${
        isAnimating ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
      }`}>
        
        {/* Logo Section */}
        <div className="mb-8 flex justify-center">
          <div className="relative">
            {!isLoaded && (
              <div className="w-32 h-16 bg-white/20 rounded-lg animate-pulse" />
            )}
            <img 
              src={logoSrc} 
              alt={LOGO_CONFIGS.MAIN_LOGO.alt}
              className={`h-16 w-auto transition-opacity duration-500 ${
                isLoaded ? 'opacity-100' : 'opacity-0'
              }`}
              style={{
                filter: 'drop-shadow(0 4px 12px rgba(0, 0, 0, 0.1))'
              }}
            />
          </div>
        </div>

        {/* 404 Number with Animation */}
        <div className="mb-6 relative">
          <h1 className="text-8xl md:text-9xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 animate-pulse">
            404
          </h1>
          <div className="absolute inset-0 text-8xl md:text-9xl font-black text-blue-600/10 animate-ping">
            404
          </div>
        </div>

        {/* Error Message */}
        <div className="mb-8 space-y-3">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-slate-100">
            Oops! Page Not Found
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-300 max-w-md mx-auto leading-relaxed">
            The page you're looking for seems to have wandered off into the digital void.
          </p>
          <div className="text-sm text-slate-500 dark:text-slate-400 font-mono bg-slate-100 dark:bg-slate-800 px-3 py-2 rounded-lg inline-block">
            Path: {location.pathname}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button 
            onClick={handleGoHome}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center gap-2"
          >
            <Home className="w-4 h-4" />
            Go Home
          </Button>
          
          <Button 
            onClick={handleGoBack}
            variant="outline"
            className="border-2 border-slate-300 dark:border-slate-600 hover:border-blue-400 dark:hover:border-blue-500 px-6 py-3 rounded-lg shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </Button>
          
          <Button 
            onClick={handleRefresh}
            variant="ghost"
            className="text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 px-6 py-3 rounded-lg hover:bg-white/50 dark:hover:bg-slate-800/50 transform hover:scale-105 transition-all duration-200 flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
        </div>

        {/* Helpful Links */}
        <div className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-700">
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
            Looking for something specific?
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <button 
              onClick={() => navigate("/inventory")}
              className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline transition-colors duration-200"
            >
              Inventory
            </button>
            <button 
              onClick={() => navigate("/pos")}
              className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline transition-colors duration-200"
            >
              POS System
            </button>
            <button 
              onClick={() => navigate("/sales")}
              className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline transition-colors duration-200"
            >
              Sales History
            </button>
            <button 
              onClick={() => navigate("/reports")}
              className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline transition-colors duration-200"
            >
              Reports
            </button>
          </div>
        </div>

        {/* Fun Animation Element */}
        <div className="mt-8 flex justify-center">
          <div className="w-16 h-1 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-full animate-pulse" />
        </div>
      </div>

      {/* Floating Elements */}
      <div className="absolute top-20 left-10 w-4 h-4 bg-blue-400/30 rounded-full animate-bounce delay-300" />
      <div className="absolute top-40 right-20 w-3 h-3 bg-purple-400/30 rounded-full animate-bounce delay-700" />
      <div className="absolute bottom-32 left-20 w-5 h-5 bg-indigo-400/30 rounded-full animate-bounce delay-1000" />
      <div className="absolute bottom-20 right-10 w-2 h-2 bg-pink-400/30 rounded-full animate-bounce delay-500" />
    </div>
  );
};

export default NotFound;
