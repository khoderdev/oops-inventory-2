/**
 * React Hooks for Stock Entry Logs
 * 
 * Comprehensive React hooks for managing stock entry logs state,
 * fetching data, and handling loading/error states with caching.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  logsApiClient,
  LogsQueryParams,
  StockEntryLog,
  LogsResponse,
  StockHistoryResponse,
  MaterialActivityResponse,
  UserActivityResponse,
  LogsSummaryResponse,
  LogsSearchResponse,
  SearchOptions,
  ExportOptions,
  LogsApiUtils
} from '../api/logs.api';

// ============================================================================
// Hook State Types
// ============================================================================

interface UseLogsState {
  data: StockEntryLog[];
  pagination: LogsResponse['data']['pagination'] | null;
  loading: boolean;
  error: string | null;
  filters: LogsQueryParams;
  lastFetch: number | null;
}

interface UseStockHistoryState {
  data: StockHistoryResponse['data'] | null;
  loading: boolean;
  error: string | null;
  lastFetch: number | null;
}

interface UseMaterialActivityState {
  data: MaterialActivityResponse['data'] | null;
  loading: boolean;
  error: string | null;
  lastFetch: number | null;
}

interface UseUserActivityState {
  data: UserActivityResponse['data'] | null;
  loading: boolean;
  error: string | null;
  lastFetch: number | null;
}

interface UseSummaryState {
  data: LogsSummaryResponse['data'] | null;
  loading: boolean;
  error: string | null;
  lastFetch: number | null;
}

interface UseSearchState {
  data: LogsSearchResponse['data'] | null;
  loading: boolean;
  error: string | null;
  lastSearch: string | null;
}

// ============================================================================
// Main Logs Hook
// ============================================================================

export function useLogs(initialParams: LogsQueryParams = {}) {
  const [state, setState] = useState<UseLogsState>({
    data: [],
    pagination: null,
    loading: false,
    error: null,
    filters: initialParams,
    lastFetch: null
  });

  const fetchLogs = useCallback(async (params: LogsQueryParams = {}) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const response = await logsApiClient.getAllLogs({ ...state.filters, ...params });
      setState(prev => ({
        ...prev,
        data: response.data.logs,
        pagination: response.data.pagination,
        filters: { ...prev.filters, ...params },
        loading: false,
        lastFetch: Date.now()
      }));
      return response.data.logs;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch logs';
      setState(prev => ({ ...prev, error: errorMessage, loading: false }));
      throw error;
    }
  }, [state.filters]);

  const updateFilters = useCallback((newFilters: Partial<LogsQueryParams>) => {
    setState(prev => ({ ...prev, filters: { ...prev.filters, ...newFilters } }));
  }, []);

  const clearFilters = useCallback(() => {
    setState(prev => ({ ...prev, filters: {} }));
  }, []);

  const refresh = useCallback(() => {
    return fetchLogs(state.filters);
  }, [fetchLogs, state.filters]);

  const nextPage = useCallback(() => {
    if (state.pagination?.hasNextPage) {
      return fetchLogs({ ...state.filters, page: state.pagination.currentPage + 1 });
    }
  }, [fetchLogs, state.filters, state.pagination]);

  const prevPage = useCallback(() => {
    if (state.pagination?.hasPrevPage) {
      return fetchLogs({ ...state.filters, page: state.pagination.currentPage - 1 });
    }
  }, [fetchLogs, state.filters, state.pagination]);

  const goToPage = useCallback((page: number) => {
    return fetchLogs({ ...state.filters, page });
  }, [fetchLogs, state.filters]);

  // Auto-fetch on mount and filter changes
  useEffect(() => {
    fetchLogs();
  }, []); // Only run on mount

  return {
    ...state,
    fetchLogs,
    updateFilters,
    clearFilters,
    refresh,
    nextPage,
    prevPage,
    goToPage,
    hasData: state.data.length > 0,
    isEmpty: !state.loading && state.data.length === 0,
    isFirstPage: state.pagination?.currentPage === 1,
    isLastPage: !state.pagination?.hasNextPage
  };
}

// ============================================================================
// Stock History Hook
// ============================================================================

export function useStockHistory(stockEntryId: number | null, options: {
  limit?: number;
  actionTypes?: string[];
  startDate?: string;
  endDate?: string;
  autoFetch?: boolean;
} = {}) {
  const { autoFetch = true, ...fetchOptions } = options;
  
  const [state, setState] = useState<UseStockHistoryState>({
    data: null,
    loading: false,
    error: null,
    lastFetch: null
  });

  const fetchHistory = useCallback(async (customOptions: typeof fetchOptions = {}) => {
    if (!stockEntryId) return;
    
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const response = await logsApiClient.getStockHistory(stockEntryId, {
        ...fetchOptions,
        ...customOptions
      });
      setState(prev => ({
        ...prev,
        data: response.data,
        loading: false,
        lastFetch: Date.now()
      }));
      return response.data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch stock history';
      setState(prev => ({ ...prev, error: errorMessage, loading: false }));
      throw error;
    }
  }, [stockEntryId, fetchOptions]);

  const refresh = useCallback(() => {
    return fetchHistory();
  }, [fetchHistory]);

  // Auto-fetch when stockEntryId changes
  useEffect(() => {
    if (autoFetch && stockEntryId) {
      fetchHistory();
    }
  }, [stockEntryId, autoFetch, fetchHistory]);

  return {
    ...state,
    fetchHistory,
    refresh,
    hasData: !!state.data,
    isEmpty: !state.loading && !state.data,
    summary: state.data?.summary || null,
    history: state.data?.history || []
  };
}

// ============================================================================
// Material Activity Hook
// ============================================================================

export function useMaterialActivity(materialId: number | null, options: {
  limit?: number;
  actionTypes?: string[];
  startDate?: string;
  endDate?: string;
  autoFetch?: boolean;
} = {}) {
  const { autoFetch = true, ...fetchOptions } = options;
  
  const [state, setState] = useState<UseMaterialActivityState>({
    data: null,
    loading: false,
    error: null,
    lastFetch: null
  });

  const fetchActivity = useCallback(async (customOptions: typeof fetchOptions = {}) => {
    if (!materialId) return;
    
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const response = await logsApiClient.getMaterialActivity(materialId, {
        ...fetchOptions,
        ...customOptions
      });
      setState(prev => ({
        ...prev,
        data: response.data,
        loading: false,
        lastFetch: Date.now()
      }));
      return response.data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch material activity';
      setState(prev => ({ ...prev, error: errorMessage, loading: false }));
      throw error;
    }
  }, [materialId, fetchOptions]);

  const refresh = useCallback(() => {
    return fetchActivity();
  }, [fetchActivity]);

  // Auto-fetch when materialId changes
  useEffect(() => {
    if (autoFetch && materialId) {
      fetchActivity();
    }
  }, [materialId, autoFetch, fetchActivity]);

  return {
    ...state,
    fetchActivity,
    refresh,
    hasData: !!state.data,
    isEmpty: !state.loading && !state.data,
    analytics: state.data?.analytics || null,
    activity: state.data?.activity || []
  };
}

// ============================================================================
// User Activity Hook
// ============================================================================

export function useUserActivity(userId: number | null, options: {
  limit?: number;
  startDate?: string;
  endDate?: string;
  autoFetch?: boolean;
} = {}) {
  const { autoFetch = true, ...fetchOptions } = options;
  
  const [state, setState] = useState<UseUserActivityState>({
    data: null,
    loading: false,
    error: null,
    lastFetch: null
  });

  const fetchActivity = useCallback(async (customOptions: typeof fetchOptions = {}) => {
    if (!userId) return;
    
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const response = await logsApiClient.getUserActivity(userId, {
        ...fetchOptions,
        ...customOptions
      });
      setState(prev => ({
        ...prev,
        data: response.data,
        loading: false,
        lastFetch: Date.now()
      }));
      return response.data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch user activity';
      setState(prev => ({ ...prev, error: errorMessage, loading: false }));
      throw error;
    }
  }, [userId, fetchOptions]);

  const refresh = useCallback(() => {
    return fetchActivity();
  }, [fetchActivity]);

  // Auto-fetch when userId changes
  useEffect(() => {
    if (autoFetch && userId) {
      fetchActivity();
    }
  }, [userId, autoFetch, fetchActivity]);

  return {
    ...state,
    fetchActivity,
    refresh,
    hasData: !!state.data,
    isEmpty: !state.loading && !state.data,
    analytics: state.data?.analytics || null,
    activity: state.data?.activity || []
  };
}

// ============================================================================
// Summary Hook
// ============================================================================

export function useSummary(options: {
  startDate?: string;
  endDate?: string;
  groupBy?: string;
  autoFetch?: boolean;
  refreshInterval?: number;
} = {}) {
  const { autoFetch = true, refreshInterval, ...fetchOptions } = options;
  
  const [state, setState] = useState<UseSummaryState>({
    data: null,
    loading: false,
    error: null,
    lastFetch: null
  });

  const fetchSummary = useCallback(async (customOptions: typeof fetchOptions = {}) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const response = await logsApiClient.getSummary({
        ...fetchOptions,
        ...customOptions
      });
      setState(prev => ({
        ...prev,
        data: response.data,
        loading: false,
        lastFetch: Date.now()
      }));
      return response.data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch summary';
      setState(prev => ({ ...prev, error: errorMessage, loading: false }));
      throw error;
    }
  }, [fetchOptions]);

  const refresh = useCallback(() => {
    return fetchSummary();
  }, [fetchSummary]);

  // Auto-fetch on mount
  useEffect(() => {
    if (autoFetch) {
      fetchSummary();
    }
  }, [autoFetch, fetchSummary]);

  // Auto-refresh interval
  useEffect(() => {
    if (refreshInterval && refreshInterval > 0) {
      const interval = setInterval(() => {
        fetchSummary();
      }, refreshInterval);
      
      return () => clearInterval(interval);
    }
  }, [refreshInterval, fetchSummary]);

  return {
    ...state,
    fetchSummary,
    refresh,
    hasData: !!state.data,
    isEmpty: !state.loading && !state.data,
    overview: state.data?.overview || null,
    actionBreakdown: state.data?.actionBreakdown || [],
    recentActivity: state.data?.recentActivity || [],
    topUsers: state.data?.topUsers || [],
    topMaterials: state.data?.topMaterials || []
  };
}

// ============================================================================
// Search Hook
// ============================================================================

export function useLogsSearch() {
  const [state, setState] = useState<UseSearchState>({
    data: null,
    loading: false,
    error: null,
    lastSearch: null
  });

  const search = useCallback(async (options: SearchOptions) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const response = await logsApiClient.searchLogs(options);
      setState(prev => ({
        ...prev,
        data: response.data,
        loading: false,
        lastSearch: options.q
      }));
      return response.data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to search logs';
      setState(prev => ({ ...prev, error: errorMessage, loading: false }));
      throw error;
    }
  }, []);

  const clear = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null,
      lastSearch: null
    });
  }, []);

  return {
    ...state,
    search,
    clear,
    hasResults: !!state.data?.logs.length,
    isEmpty: !state.loading && (!state.data || state.data.logs.length === 0),
    results: state.data?.logs || [],
    searchInfo: state.data?.searchInfo || null
  };
}

// ============================================================================
// Export Hook
// ============================================================================

export function useLogsExport() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const exportLogs = useCallback(async (options: ExportOptions = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await logsApiClient.exportLogs(options);
      
      if (options.format === 'csv') {
        // Handle CSV download
        const blob = new Blob([data], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `stock_logs_${Date.now()}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }
      
      setLoading(false);
      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to export logs';
      setError(errorMessage);
      setLoading(false);
      throw error;
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    exportLogs,
    loading,
    error,
    clearError
  };
}

// ============================================================================
// Convenience Hooks
// ============================================================================

/**
 * Hook for recent activity
 */
export function useRecentActivity(limit: number = 50) {
  const [data, setData] = useState<StockEntryLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRecentActivity = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const logs = await logsApiClient.getRecentActivity();
      setData(logs.slice(0, limit));
      setLoading(false);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch recent activity';
      setError(errorMessage);
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    fetchRecentActivity();
  }, [fetchRecentActivity]);

  return {
    data,
    loading,
    error,
    refresh: fetchRecentActivity,
    hasData: data.length > 0
  };
}

/**
 * Hook for today's logs
 */
export function useTodaysLogs() {
  const [data, setData] = useState<StockEntryLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTodaysLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const logs = await logsApiClient.getTodaysLogs();
      setData(logs);
      setLoading(false);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch today\'s logs';
      setError(errorMessage);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTodaysLogs();
  }, [fetchTodaysLogs]);

  return {
    data,
    loading,
    error,
    refresh: fetchTodaysLogs,
    hasData: data.length > 0,
    count: data.length
  };
}

/**
 * Hook for failed operations
 */
export function useFailedOperations(limit: number = 100) {
  const [data, setData] = useState<StockEntryLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFailedOperations = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const logs = await logsApiClient.getFailedOperations(limit);
      setData(logs);
      setLoading(false);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch failed operations';
      setError(errorMessage);
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    fetchFailedOperations();
  }, [fetchFailedOperations]);

  return {
    data,
    loading,
    error,
    refresh: fetchFailedOperations,
    hasData: data.length > 0,
    count: data.length
  };
}

// ============================================================================
// Utility Hooks
// ============================================================================

/**
 * Hook for date range utilities
 */
export function useDateRangeUtils() {
  return useMemo(() => ({
    formatDate: LogsApiUtils.formatDate,
    formatDateTime: LogsApiUtils.formatDateTime,
    getDateRange: LogsApiUtils.getDateRange,
    
    // Additional utility functions
    getToday: () => LogsApiUtils.getDateRange('today'),
    getYesterday: () => LogsApiUtils.getDateRange('yesterday'),
    getThisWeek: () => LogsApiUtils.getDateRange('week'),
    getThisMonth: () => LogsApiUtils.getDateRange('month'),
    getThisQuarter: () => LogsApiUtils.getDateRange('quarter'),
    
    // Custom date range
    getCustomRange: (days: number) => {
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - days);
      return {
        startDate: LogsApiUtils.formatDate(start),
        endDate: LogsApiUtils.formatDate(end)
      };
    }
  }), []);
}

/**
 * Hook for clearing all caches
 */
export function useCacheControl() {
  const clearCache = useCallback(() => {
    logsApiClient.clearCache();
  }, []);

  return {
    clearCache
  };
}
