import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PaginationInfo } from "@/types/inventory";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

type PaginationProps = {
  pagination: PaginationInfo;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  showPageSizeSelector?: boolean;
  className?: string;
};

export function Pagination({
  pagination,
  pageSize,
  onPageChange,
  onPageSizeChange,
  showPageSizeSelector = true,
  className = "",
}: PaginationProps) {
  if (!pagination || pagination.totalPages <= 1) {
    return null;
  }

  return (
    <div className={`flex items-center justify-end gap-4 ${className}`}>
      {/* Page Size Selector */}
      {showPageSizeSelector && (
        <div className="w-fit shrink-0">
          <Select value={pageSize.toString()} onValueChange={value => onPageSizeChange(parseInt(value))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="25">25 per page</SelectItem>
              <SelectItem value="50">50 per page</SelectItem>
              <SelectItem value="100">100 per page</SelectItem>
              <SelectItem value="200">200 per page</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Pagination Controls */}
      <div className="flex items-center gap-1">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => onPageChange(1)} 
          disabled={!pagination.hasPreviousPage} 
          className="h-10 px-3"
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => onPageChange(pagination.currentPage - 1)} 
          disabled={!pagination.hasPreviousPage} 
          className="h-10 px-3"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="px-3 py-2 text-sm font-medium bg-gray-50 rounded border">
          {pagination.currentPage}
        </span>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => onPageChange(pagination.currentPage + 1)} 
          disabled={!pagination.hasNextPage} 
          className="h-10 px-3"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => onPageChange(pagination.totalPages)} 
          disabled={!pagination.hasNextPage} 
          className="h-10 px-3"
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
