import { FileText } from "lucide-react";
import React from "react";

interface ViewReportButtonProps {
  date: string;
  onClick: (date: string) => void;
  loading?: boolean;
  className?: string;
}

const ViewReportButton: React.FC<ViewReportButtonProps> = ({ 
  date, 
  onClick, 
  loading = false, 
  className = "" 
}) => (
  <button
    onClick={() => onClick(date)}
    disabled={loading}
    className={`text-blue-600 hover:text-blue-900 flex items-center ${className} ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
  >
    <FileText className="h-4 w-4 mr-1" />
    {loading ? 'Loading...' : 'View Report'}
  </button>
);

export default ViewReportButton;
