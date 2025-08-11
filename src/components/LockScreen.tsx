import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Power, RotateCcw, X } from "lucide-react";

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

const LockScreen: React.FC<LockScreenProps> = ({ onSignIn, onClockIn, onClockOut, onClear, onResetMerchant, businessName = "oOps POS", currentDate, region = "North America", version = "5.2.3.5", className }) => {
  const [pin, setPin] = useState("");
  const [displayDate, setDisplayDate] = useState("");

  useEffect(() => {
    // Format current date if not provided
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

  const keypadButtons = [
    { label: "1", value: "1" },
    { label: "2", value: "2" },
    { label: "3", value: "3" },
    { label: "4", value: "4" },
    { label: "5", value: "5" },
    { label: "6", value: "6" },
    { label: "7", value: "7" },
    { label: "8", value: "8" },
    { label: "9", value: "9" },
    { label: "C", value: "clear", action: handleClear },
    { label: "0", value: "0" },
    { label: <X className="w-5 h-5" />, value: "backspace", action: handleBackspace }
  ];

  return (
    <div className={cn("min-h-screen w-full relative overflow-hidden", "bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900", className)}>
      {/* Background blur overlay */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      {/* Blurred background elements for visual depth */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-orange-500/20 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl" />

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between p-4 md:p-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-400 hover:bg-red-500/10" onClick={onResetMerchant}>
            <Power className="w-5 h-5" />
          </Button>
          <span className="text-white/80 text-sm font-medium">Store Log Out</span>
        </div>
        <div className="text-red-500 font-semibold text-lg">Prod</div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-200px)] px-4">
        {/* Business Name */}
        <h1 className="text-white text-3xl md:text-4xl lg:text-5xl font-light mb-12 text-center">{businessName}</h1>

        {/* PIN Display */}
        <div className="flex items-center justify-center mb-8 gap-2">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="w-4 h-4 rounded-full bg-white/30 flex items-center justify-center">
              {index < pin.length && <div className="w-2 h-2 rounded-full bg-white" />}
            </div>
          ))}
        </div>

        {/* Keypad */}
        <div className="flex flex-col gap-4 border border-red-500">
          <div className="flex gap-4 border border-orange-500">
            <div className="grid grid-cols-3  max-w-md w-full border border-green-500">
              {/* Number buttons (3x3 grid) */}
              <div className="col-span-3 grid grid-cols-3 gap-3">
                {keypadButtons.slice(0, 9).map(button => (
                  <Button key={button.value} variant="secondary" className="aspect-square text-xl md:text-2xl font-semibold bg-white/20 hover:bg-white/30 text-white border-none backdrop-blur-sm h-16 md:h-20" onClick={() => handleNumberPress(button.value)}>
                    {button.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Action buttons (right column) */}
            <div className="flex flex-col gap-3">
              <Button className="text-sm md:text-base font-semibold bg-blue-600 hover:bg-blue-700 text-white h-32 md:h-32" onClick={handleSignIn}>
                Sign In
              </Button>
              <Button className="aspect-square text-sm md:text-base font-semibold bg-blue-600 hover:bg-blue-700 text-white h-16 md:h-16" onClick={handleClockIn}>
                Clock-In
              </Button>
              <Button className="aspect-square text-sm md:text-base font-semibold bg-gray-600 hover:bg-gray-700 text-white h-16 md:h-16" onClick={handleClockOut}>
                Clock-Out
              </Button>
            </div>
          </div>
          {/* Bottom row (C, 0, Backspace) */}
          <div className="grid grid-cols-3 gap-3 md:gap-4 max-w-[240px] md:max-w-[280px] w-full mb-8">
            {keypadButtons.slice(9).map(button => (
              <Button key={button.value} variant="secondary" className="aspect-square text-xl md:text-2xl font-semibold bg-white/20 hover:bg-white/30 text-white border-none backdrop-blur-sm h-16 md:h-20" onClick={button.action || (() => button.value !== "clear" && button.value !== "backspace" && handleNumberPress(button.value))}>
                {button.label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="relative z-10 flex items-center justify-between p-4 md:p-6 text-white/60 text-sm">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" className="text-white/60 hover:text-white hover:bg-white/10 px-3 py-2" onClick={onClear}>
            Clear
          </Button>
          <Button variant="ghost" size="sm" className="text-white hover:text-white hover:bg-red-500/20 px-3 py-2 bg-red-500/10" onClick={onResetMerchant}>
            Reset Merchant
          </Button>
        </div>
        <div className="text-right">
          <div className="mb-1">{region}</div>
          <div>Version {version}</div>
        </div>
      </div>

      {/* Date Display */}
      <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 text-white/80 text-center">
        <div className="text-lg md:text-xl font-light">{displayDate}</div>
      </div>
    </div>
  );
};

export default LockScreen;
