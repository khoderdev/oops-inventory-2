import React, { useState, useEffect } from "react";
import { Banknote, Calendar } from "lucide-react";
import DayOperationsModal, { DayOperationsFormData } from "../DayOperationsModal/DayOperationsModal";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface DayOperationsButtonProps {
  className?: string;
}

const DayOperationsButton: React.FC<DayOperationsButtonProps> = ({ className }) => {
  const { user } = useAuth();
  const [showDayOperationsModal, setShowDayOperationsModal] = useState(false);
  const [dayOperationType, setDayOperationType] = useState<"open" | "close">("open");
  const [isLoading, setIsLoading] = useState(false);
  const [currentDay, setCurrentDay] = useState<{ expectedCash?: number } | null>(null);
  const [formData, setFormData] = useState<DayOperationsFormData>({
    openingCash: 0,
    closingCash: 0,
    openedBy: user?.username || "",
    closedBy: user?.username || "",
    notes: ""
  });

  // Check if day is open or closed
  const [isDayOpen, setIsDayOpen] = useState(false);

  // Fetch current day status on component mount
  useEffect(() => {
    const checkDayStatus = async () => {
      try {
        // This would be replaced with your actual API call
        // const response = await dayOperationsAPI.getCurrentDay();
        // setIsDayOpen(response.isOpen);
        // setCurrentDay(response.data);
        
        // For now, we'll simulate this
        setIsDayOpen(false); // Assume day is closed by default
        setCurrentDay({ expectedCash: 500 }); // Simulate expected cash
      } catch (error) {
        console.error("Failed to fetch day status:", error);
        toast.error("Failed to check day status");
      }
    };

    checkDayStatus();
  }, []);

  // Update form data when user changes
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      openedBy: user?.username || "",
      closedBy: user?.username || ""
    }));
  }, [user]);

  const handleOpenDayOperationsModal = (type: "open" | "close") => {
    setDayOperationType(type);
    setShowDayOperationsModal(true);
  };

  const handleFormChange = (data: DayOperationsFormData) => {
    setFormData(data);
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      // This would be replaced with your actual API call
      // if (dayOperationType === "open") {
      //   await dayOperationsAPI.openDay(formData);
      // } else {
      //   await dayOperationsAPI.closeDay(formData);
      // }

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setIsDayOpen(dayOperationType === "open");
      toast.success(dayOperationType === "open" ? "Day opened successfully" : "Day closed successfully");
      setShowDayOperationsModal(false);
    } catch (error) {
      console.error(`Failed to ${dayOperationType} day:`, error);
      toast.error(`Failed to ${dayOperationType} day`);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `$${amount.toFixed(2)}`;
  };

  return (
    <>
      <button 
        onClick={() => handleOpenDayOperationsModal(isDayOpen ? "close" : "open")}
        className={`group relative select-none transition-all duration-300 hover:scale-105 active:scale-95 ${className}`}
      >
        <div className={`absolute inset-0 ${isDayOpen ? "bg-gradient-to-r from-red-500/20 to-orange-500/20" : "bg-gradient-to-r from-green-500/20 to-emerald-500/20"} rounded-xl blur-sm group-hover:blur-none transition-all duration-300`} />
        <div className="relative flex items-center space-x-2 bg-white/10 dark:bg-white/5 backdrop-blur-sm rounded-xl px-3 h-9 border border-white/20 dark:border-white/10 transition-all duration-300 hover:bg-white/20 cursor-pointer">
          {isDayOpen ? (
            <Banknote className="w-4 h-4 text-red-300 group-hover:text-red-200 transition-colors" />
          ) : (
            <Calendar className="w-4 h-4 text-green-300 group-hover:text-green-200 transition-colors" />
          )}
          <span className="text-xs font-medium text-white/90 group-hover:text-white transition-colors">
            {isDayOpen ? "Close Day" : "Open Day"}
          </span>
        </div>
      </button>

      <DayOperationsModal
        open={showDayOperationsModal}
        onOpenChange={setShowDayOperationsModal}
        onSubmit={handleSubmit}
        type={dayOperationType}
        formData={formData}
        onFormChange={handleFormChange}
        isLoading={isLoading}
        currentDay={currentDay}
        formatCurrency={formatCurrency}
      />
    </>
  );
};

export default DayOperationsButton;
