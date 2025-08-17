import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Table } from "@/types/inventory";

function ClearTableModal({ showClearDialog, setShowClearDialog, tableToClear, confirmClearTable, setTableToClear }: { showClearDialog: boolean; setShowClearDialog: (value: boolean) => void; tableToClear: Table | null; confirmClearTable: () => void; setTableToClear: (value: Table | null) => void }) {
  return (
    <AlertDialog open={showClearDialog} onOpenChange={setShowClearDialog}>
      <AlertDialogContent className="flex flex-col justify-center !rounded-xl overflow-hidden !p-0 !mx-auto !w-[400px] sm:!w-full !border-transparent !border-0">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-center text-2xl text-red-500 font-bold !p-8">Clear table confirmation</AlertDialogTitle>
          <AlertDialogDescription className="text-gray-700 text-center text-lg !px-8 !pb-8 !m-0">{tableToClear ? `This will clear the orders/reservations for Table ${tableToClear.number}.` : "This will clear the orders/reservations for the selected table."}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="!flex !flex-row !justify-stretch !text-center !gap-0 !p-0 !m-0 !border-none">
          <AlertDialogCancel
            className="!rounded-none !m-0 !flex-1 !border-r !border-t-0 !border-b-0 !border-l-0 !bg-primary hover:!bg-teal-700 !text-white !font-bold !py-4"
            onClick={() => {
              setShowClearDialog(false);
              setTableToClear(null);
            }}
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction className="!rounded-none !m-0 !flex-1 bg-red-500 hover:bg-red-600 text-white font-bold !py-4 !border-0" onClick={confirmClearTable}>
            Clear
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default ClearTableModal;
