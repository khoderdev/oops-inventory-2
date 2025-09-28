/**
 * Utility function that only logs to console in development mode
 * This prevents unnecessary console logs in production
 */
export const logDevOnly = (...args: any[]): void => {
  if (process.env.NODE_ENV === 'development') {
    console.log(...args);
  }
};

/**
 * Utility function that only logs errors to console in development mode
 * This prevents unnecessary console errors in production
 */
export const logErrorDevOnly = (...args: any[]): void => {
  if (process.env.NODE_ENV === 'development') {
    console.error(...args);
  }
};

export default logDevOnly;
