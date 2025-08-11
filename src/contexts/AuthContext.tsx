import React, { createContext, ReactNode, useContext, useEffect, useState, startTransition } from "react";
import { authAPI, tokenManager } from "../api/auth";
import type { User, AuthContextType, LoginRequest, UpdateProfileRequest, ChangePasswordRequest, SessionInfo } from "../types/auth";
import { throttle, ACTIVITY_EVENTS } from "../utils/session";
import { sessionRenewalService } from "../services/sessionRenewalService";
import SessionTimeoutWarning from "../components/auth/SessionTimeoutWarning";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null);
  const [showSessionWarning, setShowSessionWarning] = useState(false);
  const [sessionTimeRemaining, setSessionTimeRemaining] = useState(0);
  const isAuthenticated = !!user && !!token;

  const startSessionRenewalService = () => {
    sessionRenewalService.onSessionWarning(timeRemaining => {
      startTransition(() => {
        setSessionTimeRemaining(timeRemaining);
        setShowSessionWarning(true);
      });
    });
    sessionRenewalService.onSessionExpired(() => {
      startTransition(() => {
        handleSessionExpired();
      });
    });
    sessionRenewalService.start();
  };

  const handleSessionExpired = () => {
    console.log("🔒 Session expired, logging out");
    sessionRenewalService.stop();
    startTransition(() => {
      setShowSessionWarning(false);
      setTimeout(() => {
        setUser(null);
        setToken(null);
        setSessionInfo(null);
        tokenManager.clearSession();
      }, 1000);
    });
  };

  const handleExtendSession = async (): Promise<boolean> => {
    try {
      const success = await sessionRenewalService.renewSession();
      if (success) {
        startTransition(() => {
          const currentSessionInfo = tokenManager.getSessionInfo();
          setSessionInfo(currentSessionInfo);
          setShowSessionWarning(false);
        });
      }
      return success;
    } catch (error) {
      console.error("Failed to extend session:", error);
      return false;
    }
  };

  const handleCloseSessionWarning = () => {
    startTransition(() => {
      setShowSessionWarning(false);
    });
  };

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedToken = tokenManager.getToken();
        if (storedToken) {
          startTransition(() => {
            setToken(storedToken);
            setSessionInfo(tokenManager.getSessionInfo());
          });
          const profileResponse = await authAPI.getProfile();
          startTransition(() => {
            setUser(profileResponse.user);
          });
          console.log("✅ Session restored successfully");
          startSessionRenewalService();
        } else {
          console.log("ℹ️ No stored session found");
        }
      } catch (error) {
        console.error("Failed to restore session:", error);
        startTransition(() => {
          handleSessionExpired();
        });
      } finally {
        startTransition(() => {
          setIsLoading(false);
        });
      }
    };

    initializeAuth();
  }, []);

  useEffect(() => {
    const handleAuthError = async (event: CustomEvent) => {
      console.warn("Auth error received:", event.detail);
      const sessionStatus = sessionRenewalService.getSessionStatus();
      if (!sessionStatus.isValid) {
        startTransition(() => {
          handleSessionExpired();
        });
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && isAuthenticated) {
        tokenManager.updateLastActivity();
        startTransition(() => {
          setSessionInfo(tokenManager.getSessionInfo());
        });
        console.log("👀 Tab became visible - checking session status");
        const sessionStatus = sessionRenewalService.getSessionStatus();
        if (!sessionStatus.isValid) {
          startTransition(() => {
            handleSessionExpired();
          });
        }
      }
    };

    const handleUserActivity = () => {
      if (isAuthenticated) {
        tokenManager.updateLastActivity();
        startTransition(() => {
          setSessionInfo(tokenManager.getSessionInfo());
        });
      }
    };

    window.addEventListener("authError", handleAuthError as EventListener);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    const throttledActivity = throttle(handleUserActivity, 30000);
    ACTIVITY_EVENTS.forEach(event => {
      document.addEventListener(event, throttledActivity, true);
    });

    return () => {
      window.removeEventListener("authError", handleAuthError as EventListener);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      ACTIVITY_EVENTS.forEach(event => {
        document.removeEventListener(event, throttledActivity, true);
      });
    };
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      startSessionRenewalService();
    } else {
      sessionRenewalService.stop();
    }
    return () => {
      sessionRenewalService.stop();
    };
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const interval = setInterval(() => {
      startTransition(() => {
        const currentSessionInfo = tokenManager.getSessionInfo();
        setSessionInfo(currentSessionInfo);
      });
    }, 60000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const login = async (credentials: LoginRequest): Promise<void> => {
    try {
      startTransition(() => {
        setIsLoading(true);
      });
      const response = await authAPI.login(credentials);
      startTransition(() => {
        setUser(response.user);
        setToken(response.token);
        tokenManager.setToken(response.token, response.refreshToken, response.expiresAt);
        setSessionInfo(tokenManager.getSessionInfo());
        startSessionRenewalService();
      });
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    } finally {
      startTransition(() => {
        setIsLoading(false);
      });
    }
  };

  const logout = async (): Promise<void> => {
    try {
      sessionRenewalService.stop();
      startTransition(() => {
        setShowSessionWarning(false);
      });
      if (token) {
        await authAPI.logout();
      }
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      startTransition(() => {
        setUser(null);
        setToken(null);
        setSessionInfo(null);
        tokenManager.clearSession();
      });
    }
  };

  const updateProfile = async (data: UpdateProfileRequest): Promise<void> => {
    try {
      const response = await authAPI.updateProfile(data);
      startTransition(() => {
        setUser(response.user);
      });
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
      startTransition(() => {
        setToken(response.token);
        tokenManager.setToken(response.token, undefined, response.expiresAt);
        setSessionInfo(tokenManager.getSessionInfo());
      });
      console.log("✅ Token refreshed successfully");
    } catch (error) {
      console.error("Token refresh failed:", error);
      startTransition(() => {
        handleSessionExpired();
      });
      throw error;
    }
  };

  const refreshUser = async (): Promise<void> => {
    try {
      const profileResponse = await authAPI.getProfile();
      startTransition(() => {
        setUser(profileResponse.user);
      });
    } catch (error) {
      console.error("User refresh failed:", error);
      throw error;
    }
  };

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    if (user.specificPermissions && user.specificPermissions[permission] !== undefined) {
      return user.specificPermissions[permission];
    }
    return user.permissions[permission] || false;
  };

  const hasRole = (role: string | string[]): boolean => {
    if (!user) return false;
    const roles = Array.isArray(role) ? role : [role];
    return roles.includes(user.role);
  };

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated, isLoading, sessionInfo, login, logout, updateProfile, changePassword, refreshToken, refreshUser, hasPermission, hasRole }}>
      {children}
      <SessionTimeoutWarning isOpen={showSessionWarning} timeRemaining={sessionTimeRemaining} onExtendSession={handleExtendSession} onLogout={logout} onClose={handleCloseSessionWarning} />
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export default AuthContext;
