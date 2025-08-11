import { AlertTriangle, Shield, Loader2, Eye, EyeOff } from "lucide-react";
import React, { useState } from "react";
import { userAPI } from "../../api/auth";
import type { User } from "../../types/auth";
import { Alert, AlertDescription } from "../ui/alert";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";

interface PinResetModalProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const PinResetModal: React.FC<PinResetModalProps> = ({ 
  user, 
  isOpen, 
  onClose, 
  onSuccess 
}) => {
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showNewPin, setShowNewPin] = useState(false);
  const [showConfirmPin, setShowConfirmPin] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Validation
    if (!/^\d{6}$/.test(newPin)) {
      setError("PIN must be exactly 6 digits");
      return;
    }

    if (newPin !== confirmPin) {
      setError("PINs do not match");
      return;
    }

    setIsSubmitting(true);
    setError("");
    setSuccess("");

    try {
      await userAPI.resetUserPin(user.id, { newPin });
      setSuccess("PIN reset successfully");
      setNewPin("");
      setConfirmPin("");
      
      // Close modal after a short delay
      setTimeout(() => {
        onSuccess();
        onClose();
        setSuccess("");
      }, 1500);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || "Failed to reset PIN");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setNewPin("");
    setConfirmPin("");
    setError("");
    setSuccess("");
    setShowNewPin(false);
    setShowConfirmPin(false);
    onClose();
  };

  const generateRandomPin = () => {
    const pin = Math.floor(100000 + Math.random() * 900000).toString();
    setNewPin(pin);
    setConfirmPin(pin);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Reset PIN
          </DialogTitle>
          <DialogDescription>
            {user && (
              <>
                Reset PIN for <strong>{user.fullName}</strong> (@{user.username})
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="border-green-200 bg-green-50">
            <AlertDescription className="text-green-800">
              {success}
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="new-pin">New PIN</Label>
            <div className="relative">
              <Input
                id="new-pin"
                type={showNewPin ? "text" : "password"}
                maxLength={6}
                value={newPin}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                  setNewPin(value);
                }}
                placeholder="Enter new 6-digit PIN"
                className="text-center text-lg tracking-widest pr-10"
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowNewPin(!showNewPin)}
              >
                {showNewPin ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <div>
            <Label htmlFor="confirm-pin">Confirm PIN</Label>
            <div className="relative">
              <Input
                id="confirm-pin"
                type={showConfirmPin ? "text" : "password"}
                maxLength={6}
                value={confirmPin}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                  setConfirmPin(value);
                }}
                placeholder="Confirm new 6-digit PIN"
                className="text-center text-lg tracking-widest pr-10"
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowConfirmPin(!showConfirmPin)}
              >
                {showConfirmPin ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <div className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={generateRandomPin}
            >
              Generate Random
            </Button>
            <div className="text-xs text-muted-foreground">
              Must be exactly 6 digits
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting || !newPin || !confirmPin}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Resetting...
                </>
              ) : (
                <>
                  <Shield className="mr-2 h-4 w-4" />
                  Reset PIN
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default PinResetModal;
