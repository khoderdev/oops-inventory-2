/**
 * Utility functions for handling and formatting error messages
 */

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

/**
 * Get user-friendly error message based on error code and context
 */
export const getErrorMessage = (error: ApiError): string => {
  // Return the message from the backend if it's already user-friendly
  if (error.message && 
      !error.message.includes('Request failed') && 
      !error.message.includes('An unexpected error occurred') &&
      !error.message.includes('Login failed')) {
    return error.message;
  }

  // Fallback to code-based messages
  switch (error.code) {
    case "USER_NOT_FOUND":
      return "The username you entered doesn't exist. Please check your username and try again.";

    case "INVALID_PASSWORD":
      if (error.attemptsLeft !== undefined) {
        return error.attemptsLeft > 0 ? `Invalid password. You have ${error.attemptsLeft} attempt${error.attemptsLeft === 1 ? "" : "s"} remaining before your account is locked.` : "Invalid password. Your account will be locked after one more failed attempt.";
      }
      return "Invalid password. Please check your password and try again.";

    case "ACCOUNT_LOCKED":
      if (error.lockTimeLeft) {
        return `Your account has been temporarily locked due to multiple failed login attempts. Please try again in ${error.lockTimeLeft} minute${error.lockTimeLeft === 1 ? "" : "s"}.`;
      }
      return "Your account has been temporarily locked due to multiple failed login attempts. Please try again later.";

    case "MISSING_CREDENTIALS":
      if (error.fields) {
        return `Please enter your ${error.fields.join(" and ")}.`;
      }
      return "Please enter your username and password.";

    default:
      // Status-based fallbacks
      switch (error.status) {
        case 400:
          return "Please check your input and try again.";
        case 401:
          return "Invalid username or password.";
        case 403:
          return "Access denied. Please contact your administrator.";
        case 404:
          return "Service not found. Please try again later.";
        case 422:
          return "Invalid data provided. Please check your input.";
        case 429:
          return "Too many requests. Please wait a moment and try again.";
        case 500:
        case 502:
        case 503:
        case 504:
          return "Server error. Please try again later.";
        default:
          return error.message || "An unexpected error occurred. Please try again.";
      }
  }
};

/**
 * Get the field that has an error for form validation highlighting
 */
export const getErrorField = (error: ApiError): string | null => {
  return error.field || null;
};

/**
 * Get multiple fields that have errors for form validation highlighting
 */
export const getErrorFields = (error: ApiError): string[] => {
  return error.fields || (error.field ? [error.field] : []);
};

/**
 * Check if error is related to authentication
 */
export const isAuthError = (error: ApiError): boolean => {
  return ["USER_NOT_FOUND", "INVALID_PASSWORD", "ACCOUNT_LOCKED", "MISSING_CREDENTIALS"].includes(error.code || "") || [401, 403].includes(error.status || 0);
};

/**
 * Check if error is a validation error
 */
export const isValidationError = (error: ApiError): boolean => {
  return error.code === "MISSING_CREDENTIALS" || error.status === 400;
};

/**
 * Check if error is a server error
 */
export const isServerError = (error: ApiError): boolean => {
  return (error.status || 0) >= 500;
};
