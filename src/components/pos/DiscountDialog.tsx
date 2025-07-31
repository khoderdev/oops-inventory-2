import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogTitle } from "@/components/ui/dialog";
import { DiscountDialogProps } from "@/types/orders";
import { Banknote } from "lucide-react";
import React from "react";

export const DiscountDialog: React.FC<DiscountDialogProps> = ({ isOpen, onClose, discountAmount, onDiscountAmountChange, onDiscount }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose} modal={true}>
      <DialogContent className="w-full h-full sm:w-[95vw] sm:h-[95vh] md:w-[90vw] md:h-[98vh] lg:w-[85vw] lg:h-[98vh] xl:w-[80vw] xl:h-[98vh] max-w-7xl max-h-screen z-50 m-0 p-0 bg-gray-50 overflow-hidden border-0 rounded-none sm:rounded-lg">
        <div className="w-full h-full flex flex-col overflow-hidden">
          <DialogTitle className="flex items-center justify-center space-x-2 text-lg sm:text-xl lg:text-2xl font-bold bg-gradient-to-r from-primary to-primary/90 text-white py-3 sm:py-4 shadow-lg">
            <Banknote className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7" />
            <span className="tracking-wide">Discount</span>
          </DialogTitle>

          <div className="flex-1 overflow-y-auto min-h-0">This Is Discounts</div>

          {/* Compact Footer */}
          <DialogFooter className="flex-shrink-0 bg-gradient-to-r from-gray-50 to-slate-50 py-4">
            <div className="w-full space-y-3 ">
              <div className="flex w-full space-x-3 sm:space-x-4 px-2">
                <Button variant="outline" size="lg" onClick={onClose} className="flex-1 h-12 sm:h-14 text-base sm:text-lg font-bold border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-all duration-200">
                  Cancel
                </Button>
                <Button variant="outline" size="lg" onClick={onDiscount} className="flex-1 h-12 sm:h-14 text-base sm:text-lg font-bold border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-all duration-200">
                  Apply
                </Button>
              </div>
            </div>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};
