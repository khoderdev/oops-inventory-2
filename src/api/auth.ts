import api from "../lib/http";
import type { ChangePasswordRequest, CreateUserRequest, LoginRequest, LoginResponse, ResetPasswordRequest, Session, UpdateProfileRequest, UpdateUserRequest, User, UserActivityResponse, UsersResponse } from "../types/auth";

export const authAPI = {
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse, LoginRequest>("/auth/login", credentials);
    return response.data;
  },

  logout: async (): Promise<void> => {
    await api.post<void, Record<string, never>>("/auth/logout", {});
  },

  logoutAll: async (): Promise<{ message: string; revokedSessions: number }> => {
    const response = await api.post<{ message: string; revokedSessions: number }, Record<string, never>>("/auth/logout-all", {});
    return response.data;
  },

  getProfile: async (): Promise<{ user: User }> => {
    const response = await api.get<{ user: User }>("/auth/profile");
    return response.data;
  },

  updateProfile: async (data: UpdateProfileRequest): Promise<{ message: string; user: User }> => {
    const response = await api.put<{ message: string; user: User }, UpdateProfileRequest>("/auth/profile", data);
    return response.data;
  },

  changePassword: async (data: ChangePasswordRequest): Promise<{ message: string }> => {
    const response = await api.put<{ message: string }, ChangePasswordRequest>("/auth/change-password", data);
    return response.data;
  },

  refreshToken: async (): Promise<{ message: string; token: string; expiresAt: string }> => {
    const response = await api.post<{ message: string; token: string; expiresAt: string }, Record<string, never>>("/auth/refresh-token", {});
    return response.data;
  },

  getSessions: async (): Promise<Session[]> => {
    const response = await api.get<{ sessions: Session[] }>("/auth/sessions");
    return response.data.sessions;
  },

  revokeSession: async (sessionId: string): Promise<{ message: string }> => {
    const response = await api.delete<{ message: string }>(`/auth/sessions/${sessionId}`);
    return response.data;
  },

  revokeAllOtherSessions: async (): Promise<{ message: string; revokedSessions: number }> => {
    const response = await api.post<{ message: string; revokedSessions: number }, Record<string, never>>("/auth/logout-all", {});
    return response.data;
  }
};

export const userAPI = {
  getAllUsers: async (params?: { page?: number; limit?: number; search?: string; role?: string; isActive?: boolean }): Promise<UsersResponse> => {
    const response = await api.get<UsersResponse>("/users", {
      params,
      headers: undefined
    });
    return response.data;
  },

  getUserById: async (id: number): Promise<{ user: User }> => {
    const response = await api.get<{ user: User }>(`/users/${id}`);
    return response.data;
  },

  createUser: async (data: CreateUserRequest): Promise<{ message: string; user: User }> => {
    const response = await api.post<{ message: string; user: User }, CreateUserRequest>("/users", data);
    return response.data;
  },

  updateUser: async (id: number, data: UpdateUserRequest): Promise<{ message: string; user: User }> => {
    const response = await api.put<{ message: string; user: User }, UpdateUserRequest>(`/users/${id}`, data);
    return response.data;
  },

  deleteUser: async (id: number): Promise<{ message: string }> => {
    const response = await api.delete<{ message: string }>(`/users/${id}`);
    return response.data;
  },

  resetUserPassword: async (id: number, data: ResetPasswordRequest): Promise<{ message: string }> => {
    const response = await api.put<{ message: string }, ResetPasswordRequest>(`/users/${id}/reset-password`, data);
    return response.data;
  },

  unlockUser: async (id: number): Promise<{ message: string }> => {
    const response = await api.put<{ message: string }, Record<string, never>>(`/users/${id}/unlock`, {});
    return response.data;
  },

  getUserActivity: async (
    id: number,
    params?: {
      page?: number;
      limit?: number;
    }
  ): Promise<UserActivityResponse> => {
    const response = await api.get<UserActivityResponse>(`/users/${id}/activity`, { params, headers: undefined });
    return response.data;
  }
};

export const tokenManager = {
  TOKEN_KEY: "auth_token",
  REFRESH_TOKEN_KEY: "refresh_token",
  TOKEN_EXPIRY_KEY: "token_expiry",
  LAST_ACTIVITY_KEY: "last_activity",
  SESSION_ID_KEY: "session_id",
  REFRESH_THRESHOLD: 5 * 60 * 1000,
  ACTIVITY_TIMEOUT: Number.MAX_SAFE_INTEGER,
  MAX_SESSION_DURATION: Number.MAX_SAFE_INTEGER,
  _refreshTimeout: null as NodeJS.Timeout | null,

  getToken: (): string | null => {
    try {
      const token = localStorage.getItem(tokenManager.TOKEN_KEY);
      if (!token) return null;
      tokenManager.updateLastActivity();
      return token;
    } catch (error) {
      console.error("Error getting token:", error);
      return null;
    }
  },

  setToken: (token: string, refreshToken?: string, expiresAt?: string): void => {
    try {
      localStorage.setItem(tokenManager.TOKEN_KEY, token);
      if (expiresAt) {
        const expiryTime = new Date(expiresAt).getTime();
        localStorage.setItem(tokenManager.TOKEN_EXPIRY_KEY, Math.floor(expiryTime / 1000).toString());
        tokenManager.scheduleTokenRefresh(expiryTime);
      }
      localStorage.setItem(tokenManager.SESSION_ID_KEY, Date.now().toString());
      if (refreshToken) {
        localStorage.setItem(tokenManager.REFRESH_TOKEN_KEY, refreshToken);
      }
      tokenManager.updateLastActivity();
    } catch (error) {
      console.error("Error setting token:", error);
      throw error;
    }
  },

  removeToken: (): void => {
    tokenManager.clearSession();
  },

  clearSession: (): void => {
    localStorage.removeItem(tokenManager.TOKEN_KEY);
    localStorage.removeItem(tokenManager.REFRESH_TOKEN_KEY);
    localStorage.removeItem(tokenManager.TOKEN_EXPIRY_KEY);
    localStorage.removeItem(tokenManager.LAST_ACTIVITY_KEY);
    localStorage.removeItem(tokenManager.SESSION_ID_KEY);
    if (tokenManager._refreshTimeout) {
      clearTimeout(tokenManager._refreshTimeout);
      tokenManager._refreshTimeout = null;
    }
  },

  getRefreshToken: (): string | null => {
    return localStorage.getItem(tokenManager.REFRESH_TOKEN_KEY);
  },

  getSessionId: (): string | null => {
    return localStorage.getItem(tokenManager.SESSION_ID_KEY);
  },

  isTokenExpired: (token?: string): boolean => {
    return false;
  },

  shouldRefreshToken: (token?: string): boolean => {
    return false;
  },

  isSessionInactive: (): boolean => {
    return false;
  },

  updateLastActivity: (): void => {
    localStorage.setItem(tokenManager.LAST_ACTIVITY_KEY, Date.now().toString());
  },

  decodeToken: (token: string): { exp: number; sessionId?: string; [key: string]: unknown } | null => {
    try {
      const parts = token.split(".");
      if (parts.length !== 3) {
        return null;
      }
      const payload = JSON.parse(atob(parts[1]));
      return payload;
    } catch {
      return null;
    }
  },

  scheduleTokenRefresh: (expiryTime: number): void => {
    if (tokenManager._refreshTimeout) {
      clearTimeout(tokenManager._refreshTimeout);
      tokenManager._refreshTimeout = null;
    }
  },

  getSessionInfo: () => {
    const token = localStorage.getItem(tokenManager.TOKEN_KEY);
    const lastActivity = localStorage.getItem(tokenManager.LAST_ACTIVITY_KEY);
    const sessionId = localStorage.getItem(tokenManager.SESSION_ID_KEY);
    const expiryStr = localStorage.getItem(tokenManager.TOKEN_EXPIRY_KEY);
    if (!token || !lastActivity) return null;
    const expiry = expiryStr ? parseInt(expiryStr, 10) * 1000 : Date.now() + 24 * 60 * 60 * 1000;
    return {
      sessionId,
      expiresAt: new Date(expiry),
      lastActivity: new Date(parseInt(lastActivity, 10)),
      isExpired: false,
      shouldRefresh: false,
      isInactive: false
    };
  }
};
