// import React, { useState, useEffect } from "react";
// import { useAttendance } from "../../hooks/useAttendance";
// import { Card, CardTitle } from "../ui/card";
// import { Clock, Space } from "lucide-react";
// import { Button } from "../ui/button";
// import { Input } from "../ui/input";
// import { Alert } from "../ui/alert";

// interface AttendanceWidgetProps {
//   employeeId: string;
// }

// export const AttendanceWidget: React.FC<AttendanceWidgetProps> = ({ employeeId }) => {
//   const [code, setCode] = useState("");
//   const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

//   const { checkIn, checkOut, getStatus, status, isLoading, error } = useAttendance(employeeId);

//   // Load initial status
//   useEffect(() => {
//     const loadStatus = async () => {
//       try {
//         await getStatus();
//       } catch (err) {
//         setMessage({ type: "error", text: "Failed to load attendance status" });
//       }
//     };

//     loadStatus();
//   }, [getStatus]);

//   // Handle API errors
//   useEffect(() => {
//     if (error) {
//       setMessage({ type: "error", text: error });
//     }
//   }, [error]);

//   const handleAction = async () => {
//     setMessage(null);
//     try {
//       if (status?.isClockedIn) {
//         await checkOut(code);
//         setMessage({ type: "success", text: "Successfully checked out!" });
//       } else {
//         await checkIn(code);
//         setMessage({ type: "success", text: "Successfully checked in!" });
//       }
//       setCode("");
//     } catch (err) {
//       // Error is already handled by the hook
//     }
//   };

//   return (
//     <Card>
//       <CardTitle>
//         <Clock />
//         <span>Attendance</span>
//       </CardTitle>
//       {message && <Alert variant={message.type === "success" ? "default" : "destructive"} title={message.text} />}

//       <div>
//         <h1>{status?.isClockedIn ? "Currently Clocked In" : "Currently Clocked Out"}</h1>
//         {status?.lastCheckIn && <p>Last check-in: {new Date(status.lastCheckIn).toLocaleString()}</p>}
//       </div>

//       <Space direction="vertical">
//         <Input placeholder="Enter your code" value={code} onChange={e => setCode(e.target.value)} onPressEnter={handleAction} disabled={isLoading} />

//         <Button variant="default" onClick={handleAction} disabled={isLoading}>
//           {status?.isClockedIn ? "Check Out" : "Check In"}
//         </Button>
//       </Space>
//     </Card>
//   );
// };

// export default AttendanceWidget;

import React, { useState, useEffect } from "react";
import { useAttendance } from "../../hooks/useAttendance";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "../ui/card";
import { Clock, CheckCircle, XCircle, Loader2, Calendar, MapPin } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Alert, AlertDescription } from "../ui/alert";
import { Badge } from "../ui/badge";
import { Skeleton } from "../ui/skeleton";
import { format, formatDistanceToNow } from "date-fns";

interface AttendanceWidgetProps {
  employeeId: string;
}

export const AttendanceWidget: React.FC<AttendanceWidgetProps> = ({ employeeId }) => {
  const [code, setCode] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { checkIn, checkOut, getStatus, status, isLoading, error } = useAttendance(employeeId);

  // Load initial status
  useEffect(() => {
    const loadStatus = async () => {
      try {
        await getStatus();
      } catch (err) {
        setMessage({ type: "error", text: "Failed to load attendance status" });
      }
    };

    loadStatus();
  }, [getStatus]);

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
      if (status?.isClockedIn) {
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
    if (isLoading) return "Loading status...";
    return status?.isClockedIn ? "Currently Clocked In" : "Currently Clocked Out";
  };

  const getStatusVariant = () => {
    return status?.isClockedIn ? "default" : "secondary";
  };

  const getStatusIcon = () => {
    if (isLoading) return <Loader2 className="h-4 w-4 animate-spin" />;
    return status?.isClockedIn ? <CheckCircle className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-gray-500" />;
  };

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
          <Button onClick={handleAction} disabled={isLoading || isSubmitting} className="w-full">
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : status?.isClockedIn ? (
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
