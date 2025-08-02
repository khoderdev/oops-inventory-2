import React, { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { authAPI, tokenManager } from "../api/auth";
import type { User, AuthContextType, LoginRequest, UpdateProfileRequest, ChangePasswordRequest, SessionInfo } from "../types/auth";
import { throttle, ACTIVITY_EVENTS } from "../utils/session";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null);

  const isAuthenticated = !!user && !!token;

  // Initialize auth state and setup session monitoring
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedToken = tokenManager.getToken();
        if (storedToken) {
          setToken(storedToken);
          setSessionInfo(tokenManager.getSessionInfo());
          
          // Fetch user profile
          const profileResponse = await authAPI.getProfile();
          setUser(profileResponse.user);
          
          console.log('✅ Session restored successfully - no expiration checks');
        } else {
          // No token found
          console.log('ℹ️ No stored token found');
        }
      } catch (error) {
        console.error("Failed to initialize auth:", error);
        tokenManager.clearSession();
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Setup event listeners for session management (no automatic refresh)
  useEffect(() => {

    const handleAuthError = async (event: CustomEvent) => {
      console.error("Auth error received:", event.detail);
      setUser(null);
      setToken(null);
      setSessionInfo(null);
      tokenManager.clearSession();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isAuthenticated) {
        // Update activity when user returns to tab
        tokenManager.updateLastActivity();
        setSessionInfo(tokenManager.getSessionInfo());
        
        console.log('👀 Tab became visible - activity updated (no session validation)');
      }
    };

    const handleUserActivity = () => {
      if (isAuthenticated) {
        tokenManager.updateLastActivity();
        setSessionInfo(tokenManager.getSessionInfo());
      }
    };

    // Add event listeners
    window.addEventListener('authError', handleAuthError as EventListener);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Track user activity
    const throttledActivity = throttle(handleUserActivity, 30000); // Throttle to once per 30 seconds
    
    ACTIVITY_EVENTS.forEach(event => {
      document.addEventListener(event, throttledActivity, true);
    });

    return () => {
      window.removeEventListener('authError', handleAuthError as EventListener);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      
      ACTIVITY_EVENTS.forEach(event => {
        document.removeEventListener(event, throttledActivity, true);
      });
    };
  }, [isAuthenticated]);

  // Session monitoring disabled - sessions only expire on manual logout or browser close
  // Update session info periodically for UI display purposes only
  useEffect(() => {
    if (!isAuthenticated) return;

    const interval = setInterval(() => {
      const currentSessionInfo = tokenManager.getSessionInfo();
      setSessionInfo(currentSessionInfo);
      
      console.log('🔍 Session Info Update (no auto-logout):', {
        hasSessionInfo: !!currentSessionInfo,
        lastActivity: currentSessionInfo?.lastActivity,
        sessionId: currentSessionInfo?.sessionId
      });
    }, 300000); // Update session info every 5 minutes for UI display only

    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const login = async (credentials: LoginRequest): Promise<void> => {
    try {
      setIsLoading(true);
      const response = await authAPI.login(credentials);
      
      setUser(response.user);
      setToken(response.token);
      tokenManager.setToken(response.token, response.refreshToken, response.expiresAt);
      setSessionInfo(tokenManager.getSessionInfo());
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      if (token) {
        await authAPI.logout();
      }
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setUser(null);
      setToken(null);
      setSessionInfo(null);
      tokenManager.clearSession();
    }
  };

  const updateProfile = async (data: UpdateProfileRequest): Promise<void> => {
    try {
      const response = await authAPI.updateProfile(data);
      setUser(response.user);
    } catch (error) {
      console.error("Profile update failed:", error);
      throw error;
    }
  };

  const changePassword = async (data: ChangePasswordRequest): Promise<void> => {
    try {
      await authAPI.changePassword(data);
    } catch (error) {
      console.error("Password change failed:", error);
      throw error;
    }
  };

  const refreshToken = async (): Promise<void> => {
    try {
      const response = await authAPI.refreshToken();
      setToken(response.token);
      tokenManager.setToken(response.token, undefined, response.expiresAt);
      setSessionInfo(tokenManager.getSessionInfo());
      
      console.log('Token refreshed successfully');
    } catch (error) {
      console.error("Token refresh failed:", error);
      setUser(null);
      setToken(null);
      setSessionInfo(null);
      tokenManager.clearSession();
      throw error;
    }
  };

  const refreshUser = async (): Promise<void> => {
    try {
      const profileResponse = await authAPI.getProfile();
      setUser(profileResponse.user);
    } catch (error) {
      console.error("User refresh failed:", error);
      throw error;
    }
  };

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;

    // Check specific user permissions first
    if (user.specificPermissions && user.specificPermissions[permission] !== undefined) {
      return user.specificPermissions[permission];
    }

    // Fall back to role-based permissions
    return user.permissions[permission] || false;
  };

  const hasRole = (role: string | string[]): boolean => {
    if (!user) return false;

    const roles = Array.isArray(role) ? role : [role];
    return roles.includes(user.role);
  };



  const contextValue: AuthContextType = {
    user,
    token,
    isAuthenticated,
    isLoading,
    sessionInfo,
    login,
    logout,
    updateProfile,
    changePassword,
    hasPermission,
    hasRole,
    refreshToken,
    refreshUser
  };

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export default AuthContext;
