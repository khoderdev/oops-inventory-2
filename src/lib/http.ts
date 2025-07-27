import axios, { AxiosError, AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from "axios";

// Define API response interface
interface ApiResponse<T> {
  data: T;
  status: number;
  message?: string;
}

// Define error response interface
interface ApiError {
  message: string;
  code?: string;
  status?: number;
  field?: string;
  fields?: string[];
  attemptsLeft?: number;
  lockTimeLeft?: number;
  details?: Record<string, unknown>;
}

// API configuration interface
interface ApiConfig {
  baseURL: string;
  timeout?: number;
  headers?: Record<string, string>;
}

// API client class
class ApiClient {
  private instance: AxiosInstance;

  constructor(config: ApiConfig) {
    this.instance = axios.create({
      baseURL: config.baseURL,
      timeout: config.timeout || 10000,
      headers: {
        "Content-Type": "application/json",
        ...config.headers
      }
    });

    // Setup request interceptor
    this.instance.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        // Add authentication token if available
        // Import tokenManager dynamically to avoid circular imports
        const token = localStorage.getItem("auth_token");
        if (token) {
          config.headers.set("Authorization", `Bearer ${token}`);
        }
        return config;
      },
      (error: AxiosError) => {
        return Promise.reject(error);
      }
    );

    // Setup response interceptor
    this.instance.interceptors.response.use(
      (response: AxiosResponse) => {
        return response;
      },
      (error: AxiosError<ApiError>) => {
        // Handle common error cases
        const errorResponse: ApiError = {
          message: error.response?.data?.message || "An error occurred",
          code: error.code,
          status: error.response?.status
        };

        // Handle specific status codes
        if (error.response?.status === 401) {
          // Handle unauthorized - trigger logout
          console.error("Unauthorized request - clearing session");
          localStorage.removeItem("auth_token");
          localStorage.removeItem("refresh_token");
          localStorage.removeItem("token_expiry");
          localStorage.removeItem("last_activity");
          localStorage.removeItem("session_id");

          // Trigger auth state reset
          window.dispatchEvent(new CustomEvent("authError", { detail: { status: 401 } }));
        } else if (error.response?.status === 403) {
          console.error("Forbidden request");
          window.dispatchEvent(new CustomEvent("authError", { detail: { status: 403 } }));
        }

        return Promise.reject(errorResponse);
      }
    );
  }

  // Generic GET request
  async get<T>(url: string, config?: InternalAxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await this.instance.get<T>(url, config);
      return {
        data: response.data,
        status: response.status,
        message: response.statusText
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Generic POST request
  async post<T, D>(url: string, data: D, config?: InternalAxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await this.instance.post<T>(url, data, config);
      return {
        data: response.data,
        status: response.status,
        message: response.statusText
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Generic PUT request
  async put<T, D>(url: string, data: D, config?: InternalAxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await this.instance.put<T>(url, data, config);
      return {
        data: response.data,
        status: response.status,
        message: response.statusText
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Generic PATCH request
  async patch<T, D>(url: string, data: D, config?: InternalAxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await this.instance.patch<T>(url, data, config);
      return {
        data: response.data,
        status: response.status,
        message: response.statusText
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Generic DELETE request
  async delete<T>(url: string, config?: InternalAxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await this.instance.delete<T>(url, config);
      return {
        data: response.data,
        status: response.status,
        message: response.statusText
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Error handler
  private handleError(error: unknown): ApiError {
    // Handle standard Axios errors
    if (axios.isAxiosError(error)) {
      const errorData = error.response?.data;
      
      return {
        message: errorData?.message || "Request failed",
        code: errorData?.code || error.code,
        status: error.response?.status,
        field: errorData?.field,
        fields: errorData?.fields,
        attemptsLeft: errorData?.attemptsLeft,
        lockTimeLeft: errorData?.lockTimeLeft,
        details: errorData
      };
    }
    
    // Handle case where error is already transformed but contains the right data
    const errorObj = error as Record<string, unknown>;
    if (errorObj && typeof errorObj === 'object' && errorObj.message) {
      return {
        message: errorObj.message as string,
        code: errorObj.code === 'ERR_BAD_REQUEST' ? undefined : (errorObj.code as string), // Ignore generic axios codes
        status: errorObj.status as number,
        field: errorObj.field as string,
        fields: errorObj.fields as string[],
        attemptsLeft: errorObj.attemptsLeft as number,
        lockTimeLeft: errorObj.lockTimeLeft as number,
        details: errorObj
      };
    }
    
    // Fallback for unknown error types
    return {
      message: "An unexpected error occurred"
    };
  }
}

// Create API instance
const api = new ApiClient({
  baseURL: "http://localhost:3000/api",
  timeout: 15000
});

export default api;
