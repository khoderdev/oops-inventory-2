import { AlertTriangle, Edit, Loader2, Save } from "lucide-react";
import React, { useEffect, useState } from "react";
import { userAPI } from "../../api/auth";
import { useAuth } from "../../contexts/AuthContext";
import type { UpdateUserRequest, User } from "../../types/auth";
import { Alert, AlertDescription } from "../ui/alert";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Switch } from "../ui/switch";

interface EditUserModalProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

const EditUserModal: React.FC<EditUserModalProps> = ({ user, isOpen, onClose, onUpdate }) => {
  const { user: currentUser } = useAuth();
  const [formData, setFormData] = useState<UpdateUserRequest>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isActive: user.isActive
      });
      setHasChanges(false);
      setError("");
    }
  }, [user]);

  const handleInputChange = (field: keyof UpdateUserRequest, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setHasChanges(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !hasChanges) return;

    setIsSubmitting(true);
    setError("");

    try {
      await userAPI.updateUser(user.id, formData);
      onUpdate();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to update user");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (hasChanges) {
      if (confirm("You have unsaved changes. Are you sure you want to close?")) {
        onClose();
      }
    } else {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Edit User
          </DialogTitle>
          <DialogDescription>
            {user && (
              <>
                Update information for <strong>{user.fullName}</strong> (@{user.username})
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

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Personal Information</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-firstName">First Name</Label>
                <Input id="edit-firstName" value={formData.firstName || ""} onChange={e => handleInputChange("firstName", e.target.value)} required />
              </div>

              <div>
                <Label htmlFor="edit-lastName">Last Name</Label>
                <Input id="edit-lastName" value={formData.lastName || ""} onChange={e => handleInputChange("lastName", e.target.value)} required />
              </div>
            </div>

            <div>
              <Label htmlFor="edit-username">Username</Label>
              <Input id="edit-username" value={formData.username || ""} onChange={e => handleInputChange("username", e.target.value)} required />
            </div>
          </div>

          {/* Role and Status */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Role and Status</h3>

            <div>
              <Label htmlFor="edit-role">Role</Label>
              <Select value={formData.role} onValueChange={(value: any) => handleInputChange("role", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="staff">Staff</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  {currentUser?.role === "admin" && <SelectItem value="admin">Admin</SelectItem>}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="edit-isActive">Account Status</Label>
                <div className="text-sm text-muted-foreground">Enable or disable user account access</div>
              </div>
              <Switch id="edit-isActive" checked={formData.isActive ?? true} onCheckedChange={checked => handleInputChange("isActive", checked)} />
            </div>
          </div>

          {/* Account Information */}
          {user && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Account Information</h3>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="text-muted-foreground">Created</Label>
                  <div>{new Date(user.createdAt).toLocaleDateString()}</div>
                </div>

                <div>
                  <Label className="text-muted-foreground">Last Updated</Label>
                  <div>{new Date(user.updatedAt).toLocaleDateString()}</div>
                </div>

                <div>
                  <Label className="text-muted-foreground">Last Login</Label>
                  <div>{user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : "Never"}</div>
                </div>

                <div>
                  <Label className="text-muted-foreground">Login Attempts</Label>
                  <div>{user.loginAttempts || 0}</div>
                </div>
              </div>

              {user.isLocked && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>This account is currently locked due to multiple failed login attempts.</AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !hasChanges}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditUserModal;
