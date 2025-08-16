import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import DayOperationReportModal from "./DayOperationReportModal";

interface DayOperationReportModalExampleProps {
  dayOperationId?: number;
  reportId?: number;
}

const DayOperationReportModalExample: React.FC<DayOperationReportModalExampleProps> = ({
  dayOperationId,
  reportId
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleReportUpdated = () => {
    console.log("Report was updated");
    // You could refresh data or show a notification here
  };

  return (
    <div>
      <Button onClick={() => setIsModalOpen(true)}>
        {reportId ? "View Report" : "Generate Report"}
      </Button>

      <DayOperationReportModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        dayOperationId={dayOperationId}
        reportId={reportId}
        onReportUpdated={handleReportUpdated}
      />
    </div>
  );
};

export default DayOperationReportModalExample;
