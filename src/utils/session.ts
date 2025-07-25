/**
 * Session management utilities
 */

/**
 * Throttle function to limit the rate of function calls
 * @param func - Function to throttle
 * @param delay - Delay in milliseconds
 * @returns Throttled function
 */
export const throttle = (func: (...args: any[]) => void, delay: number) => {
  let timeoutId: NodeJS.Timeout | null = null;
  let lastExecTime = 0;
  
  return function (...args: any[]) {
    const currentTime = Date.now();
    
    if (currentTime - lastExecTime > delay) {
      func(...args);
      lastExecTime = currentTime;
    } else {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        func(...args);
        lastExecTime = Date.now();
      }, delay - (currentTime - lastExecTime));
    }
  };
};

/**
 * Debounce function to delay function execution
 * @param func - Function to debounce
 * @param delay - Delay in milliseconds
 * @returns Debounced function
 */
export const debounce = (func: (...args: any[]) => void, delay: number) => {
  let timeoutId: NodeJS.Timeout | null = null;
  
  return function (...args: any[]) {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

/**
 * Format time remaining until expiry
 * @param expiryDate - Date when session expires
 * @returns Formatted time string
 */
export const formatTimeUntilExpiry = (expiryDate: Date): string => {
  const now = new Date().getTime();
  const expiry = expiryDate.getTime();
  const diff = expiry - now;

  if (diff <= 0) {
    return 'Expired';
  }

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  } else {
    return `${seconds}s`;
  }
};

/**
 * Check if a session is close to expiry
 * @param expiryDate - Date when session expires
 * @param thresholdMinutes - Minutes before expiry to consider "close"
 * @returns True if session is close to expiry
 */
export const isSessionCloseToExpiry = (expiryDate: Date, thresholdMinutes: number = 5): boolean => {
  const now = new Date().getTime();
  const expiry = expiryDate.getTime();
  const diff = expiry - now;
  const threshold = thresholdMinutes * 60 * 1000;

  return diff <= threshold && diff > 0;
};

/**
 * Activity events to track for session management
 */
export const ACTIVITY_EVENTS = [
  'mousedown',
  'mousemove', 
  'keypress',
  'scroll',
  'touchstart',
  'click'
] as const;

/**
 * Session storage keys
 */
export const SESSION_STORAGE_KEYS = {
  TOKEN: 'auth_token',
  REFRESH_TOKEN: 'refresh_token',
  TOKEN_EXPIRY: 'token_expiry',
  LAST_ACTIVITY: 'last_activity',
  SESSION_ID: 'session_id'
} as const;
