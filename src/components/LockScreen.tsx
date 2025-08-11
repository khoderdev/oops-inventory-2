import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Delete, Power } from "lucide-react";

interface LockScreenProps {
  onSignIn?: (pin: string) => void;
  onClockIn?: (pin: string) => void;
  onClockOut?: (pin: string) => void;
  onClear?: () => void;
  onResetMerchant?: () => void;
  businessName?: string;
  currentDate?: string;
  region?: string;
  version?: string;
  className?: string;
}

const LockScreen: React.FC<LockScreenProps> = ({ onSignIn, onClockIn, onClockOut, onClear, onResetMerchant, businessName = "oOps POS", currentDate, region = "Batroun Seaside", version = "5.2.3.5", className }) => {
  const [pin, setPin] = useState("");
  const [displayDate, setDisplayDate] = useState("");

  useEffect(() => {
    if (currentDate) {
      setDisplayDate(currentDate);
    } else {
      const now = new Date();
      const options: Intl.DateTimeFormatOptions = {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric"
      };
      setDisplayDate(now.toLocaleDateString("en-US", options));
    }
  }, [currentDate]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const handledKeys = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "Backspace", "Delete", "Enter", "Escape", "c", "C"];
      if (handledKeys.includes(event.key)) {
        event.preventDefault();
      }
      if (/^[0-9]$/.test(event.key)) {
        handleNumberPress(event.key);
      } else if (event.key === "Backspace" || event.key === "Delete") {
        handleBackspace();
      } else if (event.key === "Enter") {
        handleSignIn();
      } else if (event.key === "Escape" || event.key.toLowerCase() === "c") {
        handleClear();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [pin]);

  const handleNumberPress = (number: string) => {
    if (pin.length < 6) {
      setPin(prev => prev + number);
    }
  };

  const handleClear = () => {
    setPin("");
    onClear?.();
  };

  const handleBackspace = () => {
    setPin(prev => prev.slice(0, -1));
  };

  const handleSignIn = () => {
    if (pin.length > 0) {
      onSignIn?.(pin);
      setPin("");
    }
  };

  const handleClockIn = () => {
    if (pin.length > 0) {
      onClockIn?.(pin);
      setPin("");
    }
  };

  const handleClockOut = () => {
    if (pin.length > 0) {
      onClockOut?.(pin);
      setPin("");
    }
  };

  return (
    <div className={cn("flex flex-col min-h-screen w-full relative overflow-hidden", "bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900", className)}>
      {/* Background blur overlay */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      {/* Blurred background elements for visual depth */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-orange-500/20 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl" />

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between p-4 md:p-6">
        {/* Date Display */}
        <div className="text-lg md:text-xl font-light text-white/80 ">{displayDate}</div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-400 hover:bg-red-500/10" onClick={onResetMerchant}>
            <Power className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative w-fit self-center z-10 flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <h1 className="text-white text-3xl md:text-4xl lg:text-6xl font-semibold mb-12 text-center">{businessName}</h1>

        {/* PIN Display */}
        <div className="flex items-center justify-center mb-8 gap-3 w-full">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="w-10 h-10 rounded-full bg-white/30 flex items-center justify-center">
              {index < pin.length && <div className="w-2 h-2 rounded-full bg-white" />}
            </div>
          ))}
        </div>

        {/* Keypad */}
        <div className="grid grid-cols-4 gap-3 mb-8">
          {/* Row 1: 1, 2, 3, Sign In (spans 2 rows) */}
          <Button variant="secondary" className="aspect-square text-xl md:text-2xl font-semibold bg-white/20 hover:bg-white/30 text-white border-none backdrop-blur-sm w-16 h-16 md:w-20 md:h-20" onClick={() => handleNumberPress("1")}>
            1
          </Button>
          <Button variant="secondary" className="aspect-square text-xl md:text-2xl font-semibold bg-white/20 hover:bg-white/30 text-white border-none backdrop-blur-sm w-16 h-16 md:w-20 md:h-20" onClick={() => handleNumberPress("2")}>
            2
          </Button>
          <Button variant="secondary" className="aspect-square text-xl md:text-2xl font-semibold bg-white/20 hover:bg-white/30 text-white border-none backdrop-blur-sm w-16 h-16 md:w-20 md:h-20" onClick={() => handleNumberPress("3")}>
            3
          </Button>
          <Button className="row-span-2 text-sm md:text-base font-semibold bg-blue-600 hover:bg-blue-700 text-white w-16 h-32 md:w-20 md:h-44" onClick={handleSignIn}>
            Sign In
          </Button>

          {/* Row 2: 4, 5, 6 */}
          <Button variant="secondary" className="aspect-square text-xl md:text-2xl font-semibold bg-white/20 hover:bg-white/30 text-white border-none backdrop-blur-sm w-16 h-16 md:w-20 md:h-20" onClick={() => handleNumberPress("4")}>
            4
          </Button>
          <Button variant="secondary" className="aspect-square text-xl md:text-2xl font-semibold bg-white/20 hover:bg-white/30 text-white border-none backdrop-blur-sm w-16 h-16 md:w-20 md:h-20" onClick={() => handleNumberPress("5")}>
            5
          </Button>
          <Button variant="secondary" className="aspect-square text-xl md:text-2xl font-semibold bg-white/20 hover:bg-white/30 text-white border-none backdrop-blur-sm w-16 h-16 md:w-20 md:h-20" onClick={() => handleNumberPress("6")}>
            6
          </Button>

          {/* Row 3: 7, 8, 9, Clock-In */}
          <Button variant="secondary" className="aspect-square text-xl md:text-2xl font-semibold bg-white/20 hover:bg-white/30 text-white border-none backdrop-blur-sm w-16 h-16 md:w-20 md:h-20" onClick={() => handleNumberPress("7")}>
            7
          </Button>
          <Button variant="secondary" className="aspect-square text-xl md:text-2xl font-semibold bg-white/20 hover:bg-white/30 text-white border-none backdrop-blur-sm w-16 h-16 md:w-20 md:h-20" onClick={() => handleNumberPress("8")}>
            8
          </Button>
          <Button variant="secondary" className="aspect-square text-xl md:text-2xl font-semibold bg-white/20 hover:bg-white/30 text-white border-none backdrop-blur-sm w-16 h-16 md:w-20 md:h-20" onClick={() => handleNumberPress("9")}>
            9
          </Button>
          <Button className="aspect-square text-sm md:text-base font-semibold bg-blue-600 hover:bg-blue-700 text-white w-16 h-16 md:w-20 md:h-20" onClick={handleClockIn}>
            IN
          </Button>

          {/* Row 4: C, 0, X, Clock-Out */}
          <Button variant="secondary" className="aspect-square text-xl md:text-2xl font-semibold bg-white/20 hover:bg-white/30 text-white border-none backdrop-blur-sm w-16 h-16 md:w-20 md:h-20" onClick={handleClear}>
            C
          </Button>
          <Button variant="secondary" className="aspect-square text-xl md:text-2xl font-semibold bg-white/20 hover:bg-white/30 text-white border-none backdrop-blur-sm w-16 h-16 md:w-20 md:h-20" onClick={() => handleNumberPress("0")}>
            0
          </Button>
          <Button variant="secondary" className="aspect-square text-xl md:text-2xl font-semibold bg-white/20 hover:bg-white/30 text-white border-none backdrop-blur-sm w-16 h-16 md:w-20 md:h-20" onClick={handleBackspace}>
            <Delete className="!w-7 !h-7" />
          </Button>
          <Button className="aspect-square text-sm md:text-base font-semibold bg-gray-600 hover:bg-gray-700 text-white w-16 h-16 md:w-20 md:h-20" onClick={handleClockOut}>
            OUT
          </Button>
        </div>
      </div>

      {/* Footer */}
      <div className="relative z-10 flex items-center justify-center p-4 md:p-6 text-white/60 text-sm">
        <div className="text-center">
          <div className="mb-1">{region}</div>
          <div>Version {version}</div>
        </div>
      </div>
    </div>
  );
};

export default LockScreen;
