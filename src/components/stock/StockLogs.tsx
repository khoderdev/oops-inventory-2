import React, { useState, useEffect, useCallback } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  ChevronLeft, 
  ChevronRight, 
  RefreshCw, 
  Search, 
  Filter,
  Download,
  Calendar,
  User,
  Package,
  Activity,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { 
  StockEntryLog, 
  LogsQueryParams, 
  LogsResponse,
  PaginationInfo,
  logsApiClient 
} from '@/api/logs.api';

// Status badge variants
const getStatusBadge = (status: string) => {
  switch (status) {
    case 'success':
      return (
        <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-200">
          <CheckCircle className="w-3 h-3 mr-1" />
          Success
        </Badge>
      );
    case 'failure':
      return (
        <Badge variant="destructive" className="bg-red-100 text-red-800 hover:bg-red-200">
          <XCircle className="w-3 h-3 mr-1" />
          Failed
        </Badge>
      );
    case 'warning':
      return (
        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">
          <AlertTriangle className="w-3 h-3 mr-1" />
          Warning
        </Badge>
      );
    default:
      return (
        <Badge variant="outline">
          <Clock className="w-3 h-3 mr-1" />
          {status}
        </Badge>
      );
  }
};

// Action type badge with colors
const getActionTypeBadge = (actionType: string) => {
  const actionColors: Record<string, string> = {
    'create': 'bg-blue-100 text-blue-800',
    'update': 'bg-purple-100 text-purple-800',
    'delete': 'bg-red-100 text-red-800',
    'add_to_stock': 'bg-green-100 text-green-800',
    'waste_from_stock': 'bg-orange-100 text-orange-800',
    'pos_toggle': 'bg-indigo-100 text-indigo-800'
  };

  const colorClass = actionColors[actionType] || 'bg-gray-100 text-gray-800';
  
  return (
    <Badge variant="outline" className={colorClass}>
      {actionType.replace(/_/g, ' ').toUpperCase()}
    </Badge>
  );
};

// Format currency
const formatCurrency = (amount: number | undefined | null) => {
  if (amount === undefined || amount === null) return '-';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(amount);
};

// Format quantity with proper decimals
const formatQuantity = (quantity: number | undefined | null) => {
  if (quantity === undefined || quantity === null) return '-';
  return quantity.toLocaleString('en-US', { maximumFractionDigits: 2 });
};

// Format date
const formatDate = (dateString: string) => {
  try {
    return format(new Date(dateString), 'MMM dd, yyyy HH:mm:ss');
  } catch {
    return dateString;
  }
};

const StockLogs: React.FC = () => {
  // State management
  const [logs, setLogs] = useState<StockEntryLog[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 1,
    totalPages: 1,
    totalRecords: 0,
    recordsPerPage: 20,
    hasNextPage: false,
    hasPrevPage: false
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filter states
  const [filters, setFilters] = useState<LogsQueryParams>({
    page: 1,
    limit: 20,
    sortBy: 'actionTimestamp',
    sortOrder: 'DESC'
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [actionTypeFilter, setActionTypeFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<string>('all');

  // Fetch logs function
  const fetchLogs = useCallback(async (queryParams: LogsQueryParams = {}) => {
    try {
      setLoading(true);
      setError(null);
      
      const response: LogsResponse = await logsApiClient.getAllLogs({
        ...filters,
        ...queryParams
      });
      
      if (response.success) {
        setLogs(response.data.logs);
        setPagination(response.data.pagination);
      } else {
        throw new Error(response.message || 'Failed to fetch logs');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch stock logs';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Error fetching logs:', err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Initial load
  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Apply filters
  const applyFilters = useCallback(() => {
    const newFilters: LogsQueryParams = {
      page: 1,
      limit: filters.limit,
      sortBy: filters.sortBy,
      sortOrder: filters.sortOrder
    };

    // Apply search term
    if (searchTerm.trim()) {
      newFilters.materialName = searchTerm.trim();
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      newFilters.status = statusFilter as 'success' | 'failure' | 'warning';
    }

    // Apply action type filter
    if (actionTypeFilter !== 'all') {
      newFilters.actionType = actionTypeFilter;
    }

    // Apply date range filter
    if (dateRange !== 'all') {
      const dateRangeOptions = {
        today: { startDate: new Date().toISOString().split('T')[0], endDate: new Date().toISOString().split('T')[0] },
        week: { startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], endDate: new Date().toISOString().split('T')[0] },
        month: { startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], endDate: new Date().toISOString().split('T')[0] }
      };
      const selectedRange = dateRangeOptions[dateRange as keyof typeof dateRangeOptions];
      if (selectedRange) {
        newFilters.startDate = selectedRange.startDate;
        newFilters.endDate = selectedRange.endDate;
      }
    }

    setFilters(newFilters);
  }, [searchTerm, statusFilter, actionTypeFilter, dateRange, filters.limit, filters.sortBy, filters.sortOrder]);

  // Handle pagination
  const handlePageChange = useCallback((newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setFilters(prev => ({ ...prev, page: newPage }));
    }
  }, [pagination.totalPages]);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    logsApiClient.clearCache();
    fetchLogs();
    toast.success('Stock logs refreshed');
  }, [fetchLogs]);

  // Handle export
  const handleExport = useCallback(async (format: 'csv' | 'json') => {
    try {
      const exportData = await logsApiClient.exportLogs({
        format,
        ...filters
      });
      
      if (format === 'csv') {
        const blob = new Blob([exportData], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `stock-logs-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `stock-logs-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
      
      toast.success(`Stock logs exported as ${format.toUpperCase()}`);
    } catch (err) {
      toast.error('Failed to export logs');
      console.error('Export error:', err);
    }
  }, [filters]);

  return (
    <div className="h-full flex flex-col space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Stock Entry Logs</h1>
          <p className="text-gray-600 mt-1">
            Track all stock entry operations and changes
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleRefresh}
            variant="outline"
            size="sm"
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            onClick={() => handleExport('csv')}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search materials..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="failure">Failed</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
              </SelectContent>
            </Select>

            {/* Action Type Filter */}
            <Select value={actionTypeFilter} onValueChange={setActionTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Actions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="create">Create</SelectItem>
                <SelectItem value="update">Update</SelectItem>
                <SelectItem value="delete">Delete</SelectItem>
                <SelectItem value="add_to_stock">Add to Stock</SelectItem>
                <SelectItem value="waste_from_stock">Waste from Stock</SelectItem>
                <SelectItem value="pos_toggle">POS Toggle</SelectItem>
              </SelectContent>
            </Select>

            {/* Date Range Filter */}
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger>
                <SelectValue placeholder="All Time" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">Last 7 Days</SelectItem>
                <SelectItem value="month">Last 30 Days</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end mt-4">
            <Button onClick={applyFilters} className="flex items-center gap-2">
              <Search className="w-4 h-4" />
              Apply Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results Summary */}
      <div className="flex items-center justify-between text-sm text-gray-600">
        <span>
          Showing {logs.length} of {pagination.totalRecords} logs
        </span>
        <span>
          Page {pagination.currentPage} of {pagination.totalPages}
        </span>
      </div>

      {/* Table */}
      <Card className="flex-1 flex flex-col">
        <CardContent className="flex-1 p-0">
          {error ? (
            <div className="flex items-center justify-center h-64 text-red-600">
              <div className="text-center">
                <XCircle className="w-12 h-12 mx-auto mb-4" />
                <p className="text-lg font-medium">Error Loading Logs</p>
                <p className="text-sm">{error}</p>
                <Button onClick={handleRefresh} className="mt-4">
                  Try Again
                </Button>
              </div>
            </div>
          ) : (
            <div className="overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Material</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Quantity Δ</TableHead>
                    <TableHead>Cost Δ</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Description</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    Array.from({ length: 5 }).map((_, index) => (
                      <TableRow key={index}>
                        {Array.from({ length: 8 }).map((_, cellIndex) => (
                          <TableCell key={cellIndex}>
                            <div className="h-4 bg-gray-200 rounded animate-pulse" />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : logs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-12">
                        <div className="text-gray-500">
                          <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
                          <p className="text-lg font-medium">No logs found</p>
                          <p className="text-sm">Try adjusting your filters</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    logs.map((log) => (
                      <TableRow key={log.id} className="hover:bg-gray-50">
                        <TableCell className="font-mono text-sm">
                          {formatDate(log.actionTimestamp)}
                        </TableCell>
                        <TableCell>
                          {getActionTypeBadge(log.actionType)}
                        </TableCell>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <Package className="w-4 h-4 text-gray-400" />
                            {log.materialName}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-gray-400" />
                            {log.userName || 'System'}
                          </div>
                        </TableCell>
                        <TableCell className={`font-mono ${
                          log.quantityDelta && log.quantityDelta > 0 
                            ? 'text-green-600' 
                            : log.quantityDelta && log.quantityDelta < 0 
                            ? 'text-red-600' 
                            : 'text-gray-500'
                        }`}>
                          {log.quantityDelta !== undefined && log.quantityDelta !== null
                            ? (log.quantityDelta > 0 ? '+' : '') + formatQuantity(log.quantityDelta)
                            : '-'
                          }
                        </TableCell>
                        <TableCell className={`font-mono ${
                          log.costDelta && log.costDelta > 0 
                            ? 'text-green-600' 
                            : log.costDelta && log.costDelta < 0 
                            ? 'text-red-600' 
                            : 'text-gray-500'
                        }`}>
                          {log.costDelta !== undefined && log.costDelta !== null
                            ? (log.costDelta > 0 ? '+' : '') + formatCurrency(log.costDelta)
                            : '-'
                          }
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(log.status)}
                        </TableCell>
                        <TableCell className="max-w-xs truncate" title={log.actionDescription || log.errorMessage}>
                          {log.errorMessage || log.actionDescription || '-'}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Showing {((pagination.currentPage - 1) * pagination.recordsPerPage) + 1} to {Math.min(pagination.currentPage * pagination.recordsPerPage, pagination.totalRecords)} of {pagination.totalRecords} entries
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(pagination.currentPage - 1)}
              disabled={!pagination.hasPrevPage || loading}
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </Button>
            <span className="text-sm font-medium px-3 py-1 bg-gray-100 rounded">
              {pagination.currentPage} / {pagination.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(pagination.currentPage + 1)}
              disabled={!pagination.hasNextPage || loading}
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default StockLogs;
