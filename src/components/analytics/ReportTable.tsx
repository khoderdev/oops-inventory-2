import { getTableHeaders } from "@/utils/getTableHeaders";
import { ReportType } from "./configs";
import { FileText } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { formatCellValue } from "./formatCellValue";

// Dynamic Report Table Component
interface ReportTableProps {
  reportType: ReportType;
  data: Record<string, unknown>[];
}

export function ReportTable({ reportType, data }: ReportTableProps) {
  const headers = getTableHeaders(reportType);

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[200px] p-6 sm:p-8 text-center">
        <div className="rounded-full bg-muted p-3 mb-4">
          <FileText className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="text-sm sm:text-base font-medium text-muted-foreground mb-2">No Data Available</h3>
        <p className="text-xs sm:text-sm text-muted-foreground/80 max-w-md">No records found for the selected criteria. Try adjusting your filters or date range.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Table Header - Sticky */}
      <div className="flex-shrink-0 border-b bg-muted/50 rounded-t-lg">
        <Table>
          <TableHeader>
            <TableRow>
              {headers.map(header => (
                <TableHead key={header} className="font-semibold text-xs sm:text-sm py-3 px-2 sm:px-4">
                  {header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
        </Table>
      </div>

      {/* Scrollable Table Body */}
      <div
        className="flex-1 overflow-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-muted-foreground/20 hover:scrollbar-thumb-muted-foreground/40 min-h-0"
        style={{
          maxHeight: "calc(100vh - 300px)",
          minHeight: "200px"
        }}
      >
        <Table>
          <TableBody>
            {data.map((row, index) => (
              <TableRow key={index} className="hover:bg-muted/50 transition-colors border-b last:border-b-0">
                {headers.map(header => (
                  <TableCell key={header} className="text-xs sm:text-sm py-3 px-2 sm:px-4 align-top">
                    {formatCellValue(row, header, reportType)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Footer with row count */}
      <div className="flex-shrink-0 border-t bg-muted/30 px-4 py-2 rounded-b-lg">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Showing {data.length} {data.length === 1 ? "record" : "records"}
          </span>
          <span className="hidden sm:inline">Scroll to view more data</span>
        </div>
      </div>
    </div>
  );
}
