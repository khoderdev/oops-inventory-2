import { Modal } from "@/components/pos/Modal";
import { Table } from "@/types/inventory";
import { AlertTriangle } from "lucide-react";

function ClearTableModal({ showClearDialog, setShowClearDialog, tableToClear, confirmClearTable, setTableToClear }: { showClearDialog: boolean; setShowClearDialog: (value: boolean) => void; tableToClear: Table | null; confirmClearTable: () => void; setTableToClear: (value: Table | null) => void }) {
  return (
    <Modal
      isOpen={showClearDialog}
      onClose={() => {
        setShowClearDialog(false);
        setTableToClear(null);
      }}
      title={
        <div className="flex items-center gap-2 text-red-500">
          <AlertTriangle className="w-6 h-6" />
          Clear Table Confirmation
        </div>
      }
      maxWidth="max-w-md"
      showCloseButton={true}
      actions={[
        {
          label: "Cancel",
          onClick: () => {
            setShowClearDialog(false);
            setTableToClear(null);
          },
          variant: "secondary"
        },
        {
          label: "Clear",
          onClick: confirmClearTable,
          variant: "danger"
        }
      ]}
    >
      <div className="text-gray-700 text-center text-lg py-4">{tableToClear ? `This will clear the orders/reservations for Table ${tableToClear.number}.` : "This will clear the orders/reservations for the selected table."}</div>
    </Modal>
  );
}

export default ClearTableModal;
