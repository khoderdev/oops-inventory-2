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
        const token = localStorage.getItem("token");
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
          // Handle unauthorized (e.g., redirect to login)
          console.error("Unauthorized request");
          // Optionally trigger logout or redirect
        } else if (error.response?.status === 403) {
          console.error("Forbidden request");
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
    if (axios.isAxiosError(error)) {
      return {
        message: error.response?.data?.message || "Request failed",
        code: error.code,
        status: error.response?.status
      };
    }
    return {
      message: "An unexpected error occurred"
    };
  }
}

// Create API instance
const api = new ApiClient({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:3000",
  timeout: 15000
});

export default api;
