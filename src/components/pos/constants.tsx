import { Table } from "@/types/inventory";

export const getTableStatusColor = (status: Table["status"]) => {
  switch (status) {
    case "available":
      return "bg-green-100 border-green-300 hover:bg-green-200";
    case "opened":
      return "bg-red-100 border-red-300 hover:bg-red-200";
    case "reserved":
      return "bg-yellow-100 border-yellow-300 hover:bg-yellow-200";
    case "cleaning":
      return "bg-gray-100 border-gray-300 hover:bg-gray-200";
    default:
      return "bg-white border-gray-200";
  }
};

export const getTableShape = (shape: Table["shape"], seats: number) => {
  const baseClasses = "flex items-center justify-center cursor-pointer transition-all duration-200 border-2";
  switch (shape) {
    case "round":
      return `${baseClasses} rounded-full w-20 h-20`;
    case "square":
      return `${baseClasses} rounded-lg w-20 h-20`;
    case "rectangle":
      return `${baseClasses} rounded-lg w-24 h-16`;
    default:
      return `${baseClasses} rounded-lg w-20 h-20`;
  }
};

export const formatTime = (date: Date | string) => {
  try {
    const dateObj = typeof date === "string" ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) {
      return "Invalid time";
    }
    return new Intl.DateTimeFormat("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true
    }).format(dateObj);
  } catch (error) {
    console.error("Error formatting time:", error);
    return "Invalid time";
  }
};
