import React from "react";
import { useAuth } from "@/contexts/AuthContext";

interface WelcomeHeaderProps {
  username: string;
}

export const WelcomeHeader: React.FC<WelcomeHeaderProps> = ({ username }) => {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
          Welcome back, {username}!
        </h1>
        <p className="text-gray-600 mt-1">
          Here's what's happening with your restaurant today
        </p>
      </div>
      <div className="text-right">
        <div className="text-sm text-gray-500">Current Time</div>
        <div className="text-lg font-semibold text-gray-900">
          {new Date().toLocaleTimeString("en-US", { 
            hour: "2-digit", 
            minute: "2-digit",
            hour12: true 
          })}
        </div>
      </div>
    </div>
  );
};

export default WelcomeHeader;
