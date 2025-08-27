import React, { useState, useEffect } from "react";
import { useAttendance } from "../../hooks/useAttendance";
import { useAuth } from "../../contexts/AuthContext";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";
import { Clock, CheckCircle, XCircle, Loader2, Calendar } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Alert, AlertDescription } from "../ui/alert";
import { Badge } from "../ui/badge";
import { Skeleton } from "../ui/skeleton";
import { format, formatDistanceToNow } from "date-fns";

interface AttendanceWidgetProps {
  employeeId?: string; // Make it optional since we'll get it from user
}

export const AttendanceWidget: React.FC<AttendanceWidgetProps> = ({ employeeId: propEmployeeId }) => {
  const { user } = useAuth();
  const [employeeId, setEmployeeId] = useState<string | null>(null);
  const [employeeNotFound, setEmployeeNotFound] = useState(false);

  const [code, setCode] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Use the hook only when we have a valid employeeId
  const attendanceHook = useAttendance(employeeId || "");
  const { checkIn, checkOut, getStatus, status, isLoading, error } = employeeId ? attendanceHook : {
    checkIn: async () => {},
    checkOut: async () => {},
    getStatus: async () => {},
    status: null,
    isLoading: false,
    error: null
  };

  // Load employee for current user
  useEffect(() => {
    const loadEmployee = async () => {
      if (!user?.id) return;

      try {
        // If employeeId is provided as prop, use it
        if (propEmployeeId) {
          setEmployeeId(propEmployeeId);
          return;
        }

        // Otherwise, fetch employee for current user
        const response = await fetch(`/api/employees/by-user/${user.id}`);
        if (response.ok) {
          const employee = await response.json();
          setEmployeeId(employee.id.toString());
          setEmployeeNotFound(false);
        } else if (response.status === 404) {
          setEmployeeNotFound(true);
          setEmployeeId(null);
        }
      } catch (err) {
        console.error("Failed to load employee:", err);
        setEmployeeNotFound(true);
      }
    };

    loadEmployee();
  }, [user?.id, propEmployeeId]);

  // Load initial status when employeeId is available
  useEffect(() => {
    if (!employeeId) return;

    const loadStatus = async () => {
      try {
        await getStatus();
      } catch (err) {
        setMessage({ type: "error", text: "Failed to load attendance status" });
      }
    };

    loadStatus();
  }, [employeeId, getStatus]);

  // Handle API errors
  useEffect(() => {
    if (error) {
      setMessage({ type: "error", text: error });
    }
  }, [error]);

  const handleAction = async () => {
    if (!code.trim()) {
      setMessage({ type: "error", text: "Please enter your security code" });
      return;
    }

    setMessage(null);
    setIsSubmitting(true);

    try {
      if (status?.isCheckedIn) {
        await checkOut(code);
        setMessage({ type: "success", text: "Successfully checked out!" });
      } else {
        await checkIn(code);
        setMessage({ type: "success", text: "Successfully checked in!" });
      }
      setCode("");
    } catch (err) {
      // Error is already handled by the hook
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleAction();
    }
  };

  const getStatusText = () => {
    if (!user) return "Please log in";
    if (employeeNotFound) return "No employee record found";
    if (isLoading) return "Loading status...";
    return status?.isCheckedIn ? "Currently Checked In" : "Currently Checked Out";
  };

  const getStatusVariant = () => {
    if (!user || employeeNotFound) return "secondary";
    return status?.isCheckedIn ? "default" : "secondary";
  };

  const getStatusIcon = () => {
    if (!user) return <XCircle className="h-4 w-4 text-gray-500" />;
    if (employeeNotFound) return <XCircle className="h-4 w-4 text-orange-500" />;
    if (isLoading) return <Loader2 className="h-4 w-4 animate-spin" />;
    return status?.isCheckedIn ? <CheckCircle className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-gray-500" />;
  };

  if (!user) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Clock className="h-5 w-5" />
            Attendance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription>Please log in to use attendance features.</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (employeeNotFound) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Clock className="h-5 w-5" />
            Attendance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertDescription>
              No employee record found for your account. Please contact your administrator.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Clock className="h-5 w-5" />
            Attendance
          </CardTitle>
          <Badge variant={getStatusVariant()} className="flex items-center gap-1">
            {getStatusIcon()}
            {getStatusText()}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {message && (
          <Alert variant={message.type === "success" ? "default" : "destructive"} className="py-2">
            <AlertDescription>{message.text}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          {isLoading ? (
            <>
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </>
          ) : (
            <>
              {status?.lastCheckIn && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>
                    Last check-in: {format(new Date(status.lastCheckIn), "PPp")}
                    {status.lastCheckIn && <span className="text-xs ml-1">({formatDistanceToNow(new Date(status.lastCheckIn), { addSuffix: true })})</span>}
                  </span>
                </div>
              )}
            </>
          )}
        </div>

        <div className="space-y-2">
          <Input placeholder="Enter security code" value={code} onChange={e => setCode(e.target.value)} onKeyPress={handleKeyPress} disabled={isLoading || isSubmitting} className="text-center" />
          <Button onClick={handleAction} disabled={isLoading || isSubmitting || !employeeId} className="w-full">
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : status?.isCheckedIn ? (
              "Check Out"
            ) : (
              "Check In"
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default AttendanceWidget;
