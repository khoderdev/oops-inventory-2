import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Delete } from "lucide-react";
import { cn } from "@/lib/utils";

interface PinInputProps {
  onSubmit?: (pin: string) => void;
  onClear?: () => void;
  maxLength?: number;
  submitLabel?: string;
  showSubmitButton?: boolean;
  className?: string;
  pinDisplayClassName?: string;
  keypadClassName?: string;
  buttonClassName?: string;
  submitButtonClassName?: string;
  disabled?: boolean;
  autoSubmit?: boolean; // Auto submit when max length is reached
}

const PinInput: React.FC<PinInputProps> = ({
  onSubmit,
  onClear,
  maxLength = 6,
  submitLabel = "Submit",
  showSubmitButton = true,
  className,
  pinDisplayClassName,
  keypadClassName,
  buttonClassName,
  submitButtonClassName,
  disabled = false,
  autoSubmit = false,
}) => {
  const [pin, setPin] = useState("");

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (disabled) return;
      
      const handledKeys = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "Backspace", "Delete", "Enter", "Escape", "c", "C"];
      if (handledKeys.includes(event.key)) {
        event.preventDefault();
      }
      
      if (/^[0-9]$/.test(event.key)) {
        handleNumberPress(event.key);
      } else if (event.key === "Backspace" || event.key === "Delete") {
        handleBackspace();
      } else if (event.key === "Enter") {
        handleSubmit();
      } else if (event.key === "Escape" || event.key.toLowerCase() === "c") {
        handleClear();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [pin, disabled]);

  useEffect(() => {
    if (autoSubmit && pin.length === maxLength) {
      handleSubmit();
    }
  }, [pin, autoSubmit, maxLength]);

  const handleNumberPress = (number: string) => {
    if (disabled || pin.length >= maxLength) return;
    setPin(prev => prev + number);
  };

  const handleBackspace = () => {
    if (disabled) return;
    setPin(prev => prev.slice(0, -1));
  };

  const handleClear = () => {
    if (disabled) return;
    setPin("");
    onClear?.();
  };

  const handleSubmit = () => {
    if (disabled || pin.length === 0) return;
    onSubmit?.(pin);
    setPin("");
  };

  return (
    <div className={cn("flex flex-col items-center", className)}>
      {/* PIN Display */}
      <div className={cn("flex items-center justify-center mb-6 gap-3 w-full", pinDisplayClassName)}>
        {Array.from({ length: maxLength }).map((_, index) => (
          <div key={index} className="w-3 h-3 md:w-4 md:h-4 rounded-full bg-slate-300 dark:bg-slate-600 flex items-center justify-center">
            {index < pin.length && <div className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-slate-700 dark:bg-slate-200" />}
          </div>
        ))}
      </div>

      {/* Keypad */}
      <div className={cn("grid grid-cols-3 gap-2 mb-4", keypadClassName)}>
        {/* Numbers 1-9 */}
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((number) => (
          <Button
            key={number}
            variant="outline"
            className={cn(
              "aspect-square text-lg font-semibold w-12 h-12 md:w-14 md:h-14",
              "bg-white/80 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-700",
              "border-slate-200 dark:border-slate-600",
              buttonClassName
            )}
            onClick={() => handleNumberPress(number.toString())}
            disabled={disabled}
          >
            {number}
          </Button>
        ))}

        {/* Bottom row: Clear, 0, Backspace */}
        <Button
          variant="outline"
          className={cn(
            "aspect-square text-lg font-semibold w-12 h-12 md:w-14 md:h-14",
            "bg-white/80 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-700",
            "border-slate-200 dark:border-slate-600",
            buttonClassName
          )}
          onClick={handleClear}
          disabled={disabled}
        >
          C
        </Button>
        
        <Button
          variant="outline"
          className={cn(
            "aspect-square text-lg font-semibold w-12 h-12 md:w-14 md:h-14",
            "bg-white/80 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-700",
            "border-slate-200 dark:border-slate-600",
            buttonClassName
          )}
          onClick={() => handleNumberPress("0")}
          disabled={disabled}
        >
          0
        </Button>
        
        <Button
          variant="outline"
          className={cn(
            "aspect-square text-lg font-semibold w-12 h-12 md:w-14 md:h-14",
            "bg-white/80 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-700",
            "border-slate-200 dark:border-slate-600",
            buttonClassName
          )}
          onClick={handleBackspace}
          disabled={disabled}
        >
          <Delete className="w-4 h-4" />
        </Button>
      </div>

      {/* Submit Button */}
      {showSubmitButton && (
        <Button
          className={cn(
            "w-full max-w-xs bg-blue-600 hover:bg-blue-700 text-white",
            submitButtonClassName
          )}
          onClick={handleSubmit}
          disabled={disabled || pin.length === 0}
        >
          {submitLabel}
        </Button>
      )}
    </div>
  );
};

export default PinInput;
